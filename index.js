const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const connectDB = require('./db');
const authRoutes = require('./authRoutes');
const auth = require('./authMiddleware'); // Make sure this is the correct path
const apiRoutes = require('./apiRoutes');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Connect to MongoDB
connectDB();

// Enable CORS for all routes
app.use(cors({
    origin: 'http://127.0.0.1:5173', // Replace with your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

// Set up WebSocket server
wss.on('connection', (ws) => {
  console.log('WebSocket connected');
  apiRoutes.setActiveWs(ws);

  ws.on('close', () => {
    console.log('WebSocket disconnected');
    apiRoutes.setActiveWs(null);
  });
});

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/auth', authRoutes);
app.use('/api', auth, apiRoutes);

const PORT = process.env.PORT || 5000;

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke! Error: ' + err.message);
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
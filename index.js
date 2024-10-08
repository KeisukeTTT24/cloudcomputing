const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const connectDB = require('./db');
const authRoutes = require('./authRoutes');
const auth = require('./authMiddleware');
const apiRoutes = require('./apiRoutes');
const cors = require('cors');
const path = require('path'); // Add this line
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

createFolderIfNotExists(path.join(__dirname, 'uploads'));
createFolderIfNotExists(path.join(__dirname, 'converted'));

// Connect to MongoDB
connectDB();

// Enable CORS for all routes
app.use(cors());

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

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/dist'))); // Add this line

// Routes
app.use('/auth', authRoutes);
app.use('/api', auth, apiRoutes);

// Catch-all handler for any request that doesn't match the ones above
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

const PORT = process.env.PORT || 5000;

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke! Error: ' + err.message);
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

function createFolderIfNotExists(folderPath) {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`Folder created: ${folderPath}`);
  } else {
    console.log(`Folder already exists: ${folderPath}`);
  }
}
const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const WebSocket = require('ws');

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'video/mp4') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only MP4 files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }
});

let activeWs = null;

// This function will be called from index.js to set the active WebSocket
const setActiveWs = (ws) => {
  activeWs = ws;
};

router.post('/convert', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const { filename, path: tempPath } = req.file;
  const outputFormat = req.body.format || 'avi';
  const outputPath = path.join('converted', `${path.parse(filename).name}.${outputFormat}`);

  if (!fs.existsSync('converted')) {
    fs.mkdirSync('converted');
  }

  const sendWebSocketMessage = (message) => {
    if (activeWs && activeWs.readyState === WebSocket.OPEN) {
      activeWs.send(JSON.stringify(message));
    }
  };

  ffmpeg(tempPath)
    .toFormat(outputFormat)
    .on('start', (commandLine) => {
      console.log('FFmpeg process started:', commandLine);
      sendWebSocketMessage({ status: 'start', message: 'Conversion started' });
    })
    .on('progress', (progress) => {
      console.log('Processing: ' + progress.percent + '% done');
      sendWebSocketMessage({ status: 'progress', percent: progress.percent });
    })
    .on('end', () => {
      console.log('FFmpeg process completed');
      fs.unlinkSync(tempPath);
      sendWebSocketMessage({ status: 'complete', message: 'Conversion completed' });
      
      const fileStream = fs.createReadStream(outputPath);
      fileStream.pipe(res);
      fileStream.on('end', () => {
        fs.unlinkSync(outputPath);
      });
    })
    .on('error', (err) => {
      console.error('Error in video conversion:', err);
      sendWebSocketMessage({ status: 'error', message: err.message });
      res.status(500).send('Error in video conversion: ' + err.message);
    })
    .save(outputPath);
});

module.exports = router;
module.exports.setActiveWs = setActiveWs;
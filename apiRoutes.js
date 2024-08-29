const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const WebSocket = require('ws');
const Video = require('./models/videoModel');


const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    // Get the file name and extension
    const fileNameParts = path.parse(file.originalname);
    
    // Sanitize the file name (remove special characters and spaces)
    const sanitizedName = fileNameParts.name.replace(/[^a-zA-Z0-9]/g, '_');
    
    // Create a new filename with the sanitized name, current timestamp, and original extension
    const newFileName = sanitizedName + '-' + Date.now() + fileNameParts.ext;
    
    cb(null, newFileName)
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

router.post('/convert', upload.single('video'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const { filename, path: tempPath, size } = req.file;
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

  try {
    const video = new Video({
      user: req.user._id,
      originalVideo: {
        filename,
        path: tempPath,
        size
      }
    });

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
      .on('end', async (stdout, stderr) => {
        console.log('FFmpeg process completed');
        
        const stats = fs.statSync(outputPath);
        video.convertedVideo = {
          filename: path.basename(outputPath),
          path: outputPath,
          size: stats.size,
          format: outputFormat
        };

        // Get video metadata
        ffmpeg.ffprobe(outputPath, async (err, metadata) => {
          if (!err) {
            const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
            video.metadata = {
              duration: metadata.format.duration,
              resolution: `${videoStream.width}x${videoStream.height}`,
              bitrate: metadata.format.bit_rate
            };
          }

          await video.save();
          sendWebSocketMessage({ status: 'complete', message: 'Conversion completed' });
          
          res.json({
            message: 'Video converted successfully',
            originalPath: tempPath,
            convertedPath: outputPath
          });
        });
      })
      .on('error', async (err) => {
        console.error('Error in video conversion:', err);
        sendWebSocketMessage({ status: 'error', message: err.message });
        await Video.deleteOne({ _id: video._id });
        res.status(500).send('Error in video conversion: ' + err.message);
      })
      .save(outputPath);
  } catch (error) {
    console.error('Error processing video:', error);
    res.status(500).send('Error processing video: ' + error.message);
  }
});

router.get('/history', async (req, res) => {
  try {
    const videos = await Video.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(videos);
  } catch (error) {
    console.error('Error fetching video history:', error);
    res.status(500).send('Error fetching video history');
  }
});

router.get('/download/:id', async (req, res) => {
  try {
    const video = await Video.findOne({ _id: req.params.id, user: req.user._id });
    if (!video) {
      return res.status(404).send('Video not found');
    }

    const filePath = video.convertedVideo.path;
    const fileName = video.convertedVideo.filename;

    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Converted video file not found');
    }

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading converted video:', error);
    res.status(500).send('Error downloading converted video');
  }
});

router.post('/reconvert', async (req, res) => {
  const { videoId, format } = req.body;

  if (!videoId || !format) {
    return res.status(400).json({ success: false, message: 'VideoId and format are required' });
  }

  try {
    const video = await Video.findOne({ _id: videoId, user: req.user._id });

    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    const inputPath = video.originalVideo.path;
    const outputFileName = `${path.parse(video.originalVideo.filename).name}_reconverted.${format}`;
    const outputPath = path.join('converted', outputFileName);

    if (!fs.existsSync('converted')) {
      fs.mkdirSync('converted');
    }

    const sendWebSocketMessage = (message) => {
      if (activeWs && activeWs.readyState === WebSocket.OPEN) {
        activeWs.send(JSON.stringify(message));
      }
    };

    ffmpeg(inputPath)
      .toFormat(format)
      .on('start', (commandLine) => {
        console.log('FFmpeg process started:', commandLine);
        sendWebSocketMessage({ status: 'start', message: 'Reconversion started' });
      })
      .on('progress', (progress) => {
        console.log('Processing: ' + progress.percent + '% done');
        sendWebSocketMessage({ status: 'progress', percent: progress.percent });
      })
      .on('end', async (stdout, stderr) => {
        console.log('FFmpeg process completed');
        
        const stats = fs.statSync(outputPath);
        const newVideo = new Video({
          user: req.user._id,
          originalVideo: video.originalVideo,
          convertedVideo: {
            filename: outputFileName,
            path: outputPath,
            size: stats.size,
            format: format
          }
        });

        ffmpeg.ffprobe(outputPath, async (err, metadata) => {
          if (!err) {
            const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
            newVideo.metadata = {
              duration: metadata.format.duration,
              resolution: `${videoStream.width}x${videoStream.height}`,
              bitrate: metadata.format.bit_rate
            };
          }

          await newVideo.save();
          sendWebSocketMessage({ status: 'complete', message: 'Reconversion completed' });
          
          res.json({
            success: true,
            message: 'Video reconverted successfully',
            videoId: newVideo._id
          });
        });
      })
      .on('error', async (err) => {
        console.error('Error in video reconversion:', err);
        sendWebSocketMessage({ status: 'error', message: err.message });
        res.status(500).json({ success: false, message: 'Error in video reconversion: ' + err.message });
      })
      .save(outputPath);

  } catch (error) {
    console.error('Error processing video reconversion:', error);
    res.status(500).json({ success: false, message: 'Error processing video reconversion: ' + error.message });
  }
});

module.exports = router;
module.exports.setActiveWs = setActiveWs;
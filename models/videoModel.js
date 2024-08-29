const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originalVideo: {
    filename: String,
    path: String,
    size: Number
  },
  convertedVideo: {
    filename: String,
    path: String,
    size: Number,
    format: String
  },
  metadata: {
    duration: Number,
    resolution: String,
    bitrate: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;
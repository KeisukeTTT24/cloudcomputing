const axios = require('axios');

// Get the base URL from command line argument
const BASE_URL = process.argv[2] || 'http://localhost:8080';

// Configuration
const LOGIN_ENDPOINT = `${BASE_URL}/auth/login`;
const RECONVERT_ENDPOINT = `${BASE_URL}/api/reconvert`;
const VIDEO_HISTORY_ENDPOINT = `${BASE_URL}/api/history`;
const INITIAL_CONCURRENT_REQUESTS = 1;
const DURATION_MINUTES = 5;
const TARGET_FORMAT = 'mov';
const USER_NAME = 'testuser';
const USER_PASSWORD = 'pass';
const REQUEST_TIMEOUT = 300000; // 5 minutes

async function login(username, password) {
  try {
    const response = await axios.post(LOGIN_ENDPOINT, { username, password });
    return response.data.token;
  } catch (error) {
    console.error('Login failed:', error.response ? error.response.data : error.message);
    throw error;
  }
}

async function getLatestVideoId(token) {
  try {
    const response = await axios.get(VIDEO_HISTORY_ENDPOINT, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (response.data.length > 0) {
      return response.data[0]._id; // Assuming the API returns an array of videos sorted by createdAt in descending order
    } else {
      throw new Error('No videos found in history');
    }
  } catch (error) {
    console.error('Error fetching video history:', error.response ? error.response.data : error.message);
    throw error;
  }
}

async function sendReconvertRequest(token, videoId) {
  try {
    const response = await axios.post(RECONVERT_ENDPOINT, 
      { videoId: videoId, format: TARGET_FORMAT },
      { 
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        timeout: REQUEST_TIMEOUT
      }
    );
    console.log(`Conversion completed: ${response.data.message}`);
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Conversion request canceled');
    } else {
      console.error(`Conversion request failed: ${error.message}`);
    }
  }
}

async function generateLoad() {
  try {
    const token = await login(USER_NAME, USER_PASSWORD);
    const latestVideoId = await getLatestVideoId(token);
    console.log(`Using latest video ID: ${latestVideoId}`);

    const endTime = Date.now() + DURATION_MINUTES * 60 * 1000;
    let concurrentRequests = INITIAL_CONCURRENT_REQUESTS;
    
    while (Date.now() < endTime) {
      const requests = Array(concurrentRequests).fill().map(() => sendReconvertRequest(token, latestVideoId));
      await Promise.all(requests);
    }
  } catch (error) {
    console.error('Load generation failed:', error.message);
  }
}

generateLoad().then(() => {
  console.log('Load generation completed');
}).catch((error) => {
  console.error('Error during load generation:', error);
});
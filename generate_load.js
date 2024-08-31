const axios = require('axios');

// Get the base URL from command line argument
const BASE_URL = process.argv[2] || 'http://localhost:8080';

// Configuration
const LOGIN_ENDPOINT = `${BASE_URL}/auth/login`;
const RECONVERT_ENDPOINT = `${BASE_URL}/api/reconvert`;
const INITIAL_CONCURRENT_REQUESTS = 1;
const MAX_CONCURRENT_REQUESTS = 8;
const DURATION_MINUTES = 5;
const VIDEO_ID = '66d32e00cfb6e23575f1181f';
const TARGET_FORMAT = 'mov';
const USER_NAME = 'testuser';
const USER_PASSWORD = 'pass';
const RAMP_UP_INTERVAL = 60000; // 60 seconds
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

async function sendReconvertRequest(token) {
  try {
    const response = await axios.post(RECONVERT_ENDPOINT, 
      { videoId: VIDEO_ID, format: TARGET_FORMAT },
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
    const endTime = Date.now() + DURATION_MINUTES * 60 * 1000;
    let concurrentRequests = INITIAL_CONCURRENT_REQUESTS;
    
    while (Date.now() < endTime) {
      const requests = Array(concurrentRequests).fill().map(() => sendReconvertRequest(token));
      await Promise.all(requests);
      
      // Ramp up the number of concurrent requests every 60 seconds
      /*
      if (Date.now() % RAMP_UP_INTERVAL < 1000 && concurrentRequests < MAX_CONCURRENT_REQUESTS) {
        concurrentRequests = Math.min(concurrentRequests + 1, MAX_CONCURRENT_REQUESTS);
        console.log(`Increased concurrent conversions to ${concurrentRequests}`);
      }
      */

      // Add a small delay between batches
      //await new Promise(resolve => setTimeout(resolve, 1000));
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
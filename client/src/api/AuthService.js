import axios from 'axios';

const API_URL = 'http://localhost:5000/auth/';

const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
};

const register = (username, password) => {
  return axios.post(API_URL + 'register', { username, password });
};

const login = (username, password) => {
  return axios.post(API_URL + 'login', { username, password })
    .then((response) => {
      if (response.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      return response.data;
    });
};

const logout = async () => {
    try {
      await axios.post(API_URL + 'logout');
      localStorage.removeItem('user');
      setAuthToken(null);
    } catch (error) {
      console.error('Logout failed', error);
      throw error;
    }
  };

const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem('user'));
};

const AuthService = {
  register,
  login,
  logout,
  getCurrentUser,
  setAuthToken,
};

export default AuthService;
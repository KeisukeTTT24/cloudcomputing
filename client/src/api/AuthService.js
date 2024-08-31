import axios from 'axios';
import { AUTH_URL } from '../config';

const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
};

const register = (username, password) => {
  return axios.post(`${AUTH_URL}/register`, { username, password });
};

const login = (username, password) => {
  return axios.post(`${AUTH_URL}/login`, { username, password })
    .then((response) => {
      if (response.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      return response.data;
    });
};

const logout = async () => {
    try {
      await axios.post(`${AUTH_URL}/logout`);
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
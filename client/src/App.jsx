import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginRegisterPage from './pages/LoginRegisterPage';
import VideoTranscodingPage from './pages/VideoTranscodingPage';
import ProtectedRoute from './ProtectedRoute';
import AuthService from './api/AuthService';

function App() {
  useEffect(() => {
    const user = AuthService.getCurrentUser();
    if (user && user.token) {
      console.log('User is logged in');
      AuthService.setAuthToken(user.token);
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginRegisterPage />} />
        <Route
          path="/transcode"
          element={
            <ProtectedRoute>
              <VideoTranscodingPage />
            </ProtectedRoute>
          }
        />
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
import React, { useState, useEffect, useRef } from 'react';
import { Upload, Button, Form, Select, Typography, notification, Progress, Layout } from 'antd';
import { UploadOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthService from '../api/AuthService';

const { Title } = Typography;
const { Option } = Select;
const { Header, Content } = Layout;

function VideoTranscodingPage() {
  const [selectedFormat, setSelectedFormat] = useState('avi');
  const [conversionProgress, setConversionProgress] = useState(0);
  const [converting, setConverting] = useState(false);
  const ws = useRef(null);
  const navigate = useNavigate();

  const connectWebSocket = () => {
    ws.current = new WebSocket(`ws://${window.location.host}/ws`);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received WebSocket message:', data);
      if (data.status === 'progress') {
        setConversionProgress(parseFloat(data.percent));
      } else if (data.status === 'complete') {
        setConverting(false);
        setConversionProgress(100);
        notification.success({
          message: 'Success',
          description: `File converted and ready to download.`,
        });
      } else if (data.status === 'error') {
        setConverting(false);
        notification.error({
          message: 'Error',
          description: `Error during conversion: ${data.message}`,
        });
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected. Trying to reconnect...');
      setTimeout(connectWebSocket, 3000);
    };
  };

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    if (user && user.token) {
      AuthService.setAuthToken(user.token);
    } else {
      // If no user is logged in, redirect to login page
      navigate('/login');
    }
    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      navigate('/login');
      notification.success({
        message: 'Logged out successfully',
      });
    } catch (error) {
      notification.error({
        message: 'Logout failed',
        description: error.message,
      });
    }
  };

  const handleFormatChange = (value) => {
    setSelectedFormat(value);
  };

  const handleFileChange = (info) => {
    if (info.file.status === 'uploading') {
      setConverting(true);
      setConversionProgress(0);
    }
  };

  const customRequest = async ({ file, onSuccess, onError }) => {
    const formData = new FormData();
    formData.append('video', file);
    formData.append('format', selectedFormat);

    try {
      setConverting(true);
      setConversionProgress(0);
      const response = await axios.post('/api/convert', formData, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `converted.${selectedFormat}`);
      document.body.appendChild(link);
      link.click();
      onSuccess();
    } catch (error) {
      setConverting(false);
      onError(error);
      notification.error({
        message: 'Error',
        description: `There was an error uploading the file.`,
      });
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', width: '100vw' }}>
      <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' }}>
        <Title level={3} style={{ color: 'white', margin: 0 }}>Video Transcoder</Title>
        <Button icon={<LogoutOutlined />} onClick={handleLogout}>
          Logout
        </Button>
      </Header>
      <Content style={{ padding: '20px', backgroundColor: '#f0f2f5', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: '600px', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
          <Form layout="vertical">
            <Form.Item label="Select Output Format" style={{ textAlign: 'center' }}>
              <Select defaultValue={selectedFormat} onChange={handleFormatChange} style={{ width: '100%' }}>
                <Option value="avi">AVI</Option>
                <Option value="mkv">MKV</Option>
                <Option value="mov">MOV</Option>
                <Option value="webm">WEBM</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Upload Video" style={{ textAlign: 'center' }}>
              <Upload
                customRequest={customRequest}
                onChange={handleFileChange}
                showUploadList={false}
              >
                <Button icon={<UploadOutlined />} style={{ width: '100%' }} disabled={converting}>
                  {converting ? 'Converting...' : 'Upload Video'}
                </Button>
              </Upload>
            </Form.Item>
            {converting && (
              <Form.Item>
                <Progress percent={Math.round(conversionProgress)} status="active" />
              </Form.Item>
            )}
          </Form>
        </div>
      </Content>
    </Layout>
  );
}

export default VideoTranscodingPage;
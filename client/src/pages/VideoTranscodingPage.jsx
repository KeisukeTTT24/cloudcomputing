import React, { useState, useEffect, useRef } from 'react';
import { Upload, Button, Form, Select, Typography, notification, Progress, Layout, Table } from 'antd';
import { UploadOutlined, LogoutOutlined, DownloadOutlined, RedoOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthService from '../api/AuthService';
import { API_URL, WS_URL } from '../config';

const { Title } = Typography;
const { Option } = Select;
const { Header, Content } = Layout;

function VideoTranscodingPage() {
  const [selectedFormat, setSelectedFormat] = useState('avi');
  const [conversionProgress, setConversionProgress] = useState(0);
  const [converting, setConverting] = useState(false);
  const [videoHistory, setVideoHistory] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const ws = useRef(null);
  const navigate = useNavigate();

  const connectWebSocket = () => {
    ws.current = new WebSocket(`${WS_URL}`);

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
      fetchVideoHistory();
    } else {
      navigate('/login');
    }
    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [navigate]);

  const fetchVideoHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/history`);
      setVideoHistory(response.data);
    } catch (error) {
      console.error('Error fetching video history:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to fetch video conversion history',
      });
    }
  };

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
      const response = await axios.post(`${API_URL}/convert`, formData, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `converted.${selectedFormat}`);
      document.body.appendChild(link);
      link.click();
      onSuccess();
      fetchVideoHistory(); // Refresh the video history
    } catch (error) {
      setConverting(false);
      onError(error);
      notification.error({
        message: 'Error',
        description: `There was an error uploading the file.`,
      });
    }
  };

  const handleDownload = async (videoId) => {
    try {
      const response = await axios.get(`${API_URL}/download/${videoId}`, {
        responseType: 'blob',
      });
      const contentDisposition = response.headers['content-disposition'];
      const filenameMatch = contentDisposition && contentDisposition.match(/filename="?(.+)"?/i);
      const filename = filenameMatch ? filenameMatch[1] : 'converted_video';
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading video:', error);
      notification.error({
        message: 'Download Failed',
        description: 'There was an error downloading the converted video.',
      });
    }
  };

  const handleVideoSelect = (value) => {
    setSelectedVideo(value);
  };

  const handleReconvert = async () => {
    if (!selectedVideo) {
      notification.warning({
        message: 'No video selected',
        description: 'Please select a video to reconvert.',
      });
      return;
    }

    try {
      setConverting(true);
      setConversionProgress(0);
      const response = await axios.post(`${API_URL}/reconvert`, {
        videoId: selectedVideo,
        format: selectedFormat
      });

      if (response.data.success) {
        notification.success({
          message: 'Reconversion successful',
          description: 'The video has been reconverted. Downloading will start shortly.',
        });
        await handleDownloadReconverted(response.data.videoId);
        fetchVideoHistory(); // Refresh the video history
      } else {
        throw new Error(response.data.message || 'Reconversion failed');
      }
    } catch (error) {
      notification.error({
        message: 'Reconversion failed',
        description: error.message,
      });
    } finally {
      setConverting(false);
    }
  };

  const handleDownloadReconverted = async (videoId) => {
    try {
      const response = await axios.get(`${API_URL}/download/${videoId}`, {
        responseType: 'blob',
      });
      const contentDisposition = response.headers['content-disposition'];
      const filenameMatch = contentDisposition && contentDisposition.match(/filename="?(.+)"?/i);
      const filename = filenameMatch ? filenameMatch[1] : 'reconverted_video';
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading reconverted video:', error);
      notification.error({
        message: 'Download Failed',
        description: 'There was an error downloading the reconverted video.',
      });
    }
  };

  const columns = [
    {
      title: 'Original Filename',
      dataIndex: ['originalVideo', 'filename'],
      key: 'originalFilename',
    },
    {
      title: 'Converted Filename',
      dataIndex: ['convertedVideo', 'filename'],
      key: 'convertedFilename',
    },
    {
      title: 'Output Format',
      dataIndex: ['convertedVideo', 'format'],
      key: 'outputFormat',
    },
    {
      title: 'Duration',
      dataIndex: ['metadata', 'duration'],
      key: 'duration',
      render: (duration) => `${(duration / 60).toFixed(2)} minutes`,
    },
    {
      title: 'Resolution',
      dataIndex: ['metadata', 'resolution'],
      key: 'resolution',
    },
    {
      title: 'Conversion Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <Button
          icon={<DownloadOutlined />}
          onClick={() => handleDownload(record._id)}
        >
          Download
        </Button>
      ),
    },
  ];

  
  return (
    <Layout style={{ height: '100vh', overflow: 'auto' }}>
      <Header 
        style={{ 
          position: 'fixed', 
          zIndex: 1, 
          width: '100%', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '0 20px', 
          background: '#001529' 
        }}
      >
        <Title level={3} style={{ color: 'white', margin: 0 }}>Video Transcoder</Title>
        <Button icon={<LogoutOutlined />} onClick={handleLogout}>
          Logout
        </Button>
      </Header>
      <Content style={{ padding: '84px 20px 20px', backgroundColor: '#f0f2f5', width: '100vw' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto 20px', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
          <Form layout="vertical">
            <Form.Item label="Select Output Format" style={{ textAlign: 'center' }}>
              <Select defaultValue={selectedFormat} onChange={handleFormatChange} style={{ width: '100%' }}>
                <Option value="avi">AVI</Option>
                <Option value="mov">MOV</Option>
                <Option value="webm">WEBM</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Upload New Video" style={{ textAlign: 'center' }}>
              <Upload customRequest={customRequest} onChange={handleFileChange} showUploadList={false}>
                <Button icon={<UploadOutlined />} style={{ width: '100%' }} disabled={converting}>
                  {converting ? 'Converting...' : 'Upload Video'}
                </Button>
              </Upload>
            </Form.Item>
            <Form.Item label="Or Select Previously Uploaded Video" style={{ textAlign: 'center' }}>
              <Select
                style={{ width: '100%', marginBottom: '10px' }}
                placeholder="Select a video"
                onChange={handleVideoSelect}
                value={selectedVideo}
              >
                {videoHistory.map(video => (
                  <Option key={video._id} value={video._id}>
                    {video.originalVideo.filename}
                  </Option>
                ))}
              </Select>
              <Button 
                icon={<RedoOutlined />} 
                style={{ width: '100%' }} 
                onClick={handleReconvert}
                disabled={converting || !selectedVideo}
              >
                Reconvert Selected Video
              </Button>
            </Form.Item>
            {converting && (
              <Form.Item>
                <Progress percent={Math.round(conversionProgress)} status="active" />
              </Form.Item>
            )}
          </Form>
        </div>
        <div style={{ maxWidth: '1000px', margin: '0 auto', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
          <Title level={4}>Conversion History</Title>
          <Table columns={columns} dataSource={videoHistory} rowKey="_id" />
        </div>
      </Content>
    </Layout>
  );
}

export default VideoTranscodingPage;
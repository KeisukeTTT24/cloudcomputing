import React from 'react';
import { Button, Typography, Layout } from 'antd';
import { Link } from 'react-router-dom';
import 'antd/dist/reset.css'; // Import Ant Design styles

const { Title, Paragraph } = Typography;
const { Header, Content } = Layout;

function LandingPage() {
  return (
    <Layout style={{ height: '100vh', backgroundColor: '#d9d9d9', width: '100vw' }}>
      <Content
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 'calc(100vh - 64px)', // Adjust for Header height
          textAlign: 'center',
          backgroundColor: '#b0b0b0',
          color: '#fff',
        }}
      >
        <div>
          <Title style={{ color: '#fff' }}>Welcome to Video Transcoder</Title>
          <Paragraph style={{ color: '#fff', fontSize: '1.5rem' }}>
            Transcode your videos with ease and efficiency
          </Paragraph>
          <Link to="/login">
            <Button type="primary" size="large" style={{ marginTop: '20px' }}>
              Get Started
            </Button>
          </Link>
        </div>
      </Content>
    </Layout>
  );
}

export default LandingPage;


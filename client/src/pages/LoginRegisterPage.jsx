import React, { useState } from 'react';
import { Button, Input, Typography, Form, Layout, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import AuthService from '../api/AuthService';
import 'antd/dist/reset.css';

const { Title } = Typography;
const { Content } = Layout;

function LoginRegisterPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const handleFormSubmit = async (values) => {
    try {
      if (isLogin) {
        const response = await AuthService.login(values.username, values.password);
        if (response.token) {
          message.success('Logged in successfully');
          navigate('/transcode');
        } else {
          message.error('Login failed. Please try again.');
        }
      } else {
        await AuthService.register(values.username, values.password);
        message.success('Registered successfully');
        // Optionally, you can automatically log in the user after registration
        // const loginResponse = await AuthService.login(values.username, values.password);
        // if (loginResponse.token) {
        //   navigate('/transcode');
        // }
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'An error occurred');
    }
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    form.resetFields();
  };

  return (
    <Layout style={{ height: '100vh', backgroundColor: '#f0f2f5', width: '100vw' }}>
      <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: '400px', padding: '20px', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
          <Title level={2} style={{ textAlign: 'center', marginBottom: '20px' }}>
            {isLogin ? 'Login' : 'Register'}
          </Title>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFormSubmit}
          >
            <Form.Item
              name="username"
              label="Username"
              rules={[{ required: true, message: 'Please input your username!' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
                {isLogin ? 'Login' : 'Register'}
              </Button>
            </Form.Item>
            <Form.Item>
              <Button type="link" onClick={toggleForm} style={{ width: '100%' }}>
                {isLogin ? 'Switch to Register' : 'Switch to Login'}
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Content>
    </Layout>
  );
}

export default LoginRegisterPage;
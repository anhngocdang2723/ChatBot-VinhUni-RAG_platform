import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { DEMO_ACCOUNTS } from '../config/accounts';
import logoVinhuni from '../assets/logo-vinhuni.png';
import bgLogin from '../assets/bg-login.jpg';
import { useApi } from '../context/ApiContext';

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: url(${bgLogin}) no-repeat center center fixed;
  background-size: cover;
  padding: 20px;
  
  @media (max-width: 768px) {
    padding: 12px;
    align-items: flex-start;
    min-height: 100vh;
    height: 100%;
  }
`;

const Logo = styled.img`
  width: 120px;
  height: 120px;
  margin: 0 auto;
  display: block;
  margin-bottom: var(--spacing-md);
  
  @media (max-width: 768px) {
    width: 80px;
    height: 80px;
    margin-bottom: var(--spacing-sm);
  }
`;

const Attribution = styled.p`
  text-align: center;
  color: var(--dark-gray);
  font-size: 0.875rem;
  margin-bottom: var(--spacing-lg);
  
  @media (max-width: 768px) {
    font-size: 0.8rem;
    margin-bottom: var(--spacing-md);
  }
`;

const LoginForm = styled.form`
  background: rgba(255, 255, 255, 0.95);
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  width: 100%;
  max-width: 450px;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 40px 0 rgba(31, 38, 135, 0.4);
  }
  
  @media (max-width: 768px) {
    padding: var(--spacing-lg);
    margin-top: 40px;
    max-width: 100%;
  }
`;

const FormTitle = styled.h2`
  color: var(--almost-black);
  margin-bottom: var(--spacing-lg);
  text-align: center;
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
    margin-bottom: var(--spacing-md);
  }
`;

const PortalButtons = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  
  @media (max-width: 768px) {
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-md);
  }
`;

const PortalButton = styled.button`
  padding: var(--spacing-md);
  border: 2px solid #005BAA;
  border-radius: var(--radius-md);
  background-color: ${props => props.active ? '#005BAA' : 'transparent'};
  color: ${props => props.active ? 'var(--white)' : '#005BAA'};
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.active ? '#004c8c' : 'rgba(0, 91, 170, 0.1)'};
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
  
  @media (max-width: 768px) {
    padding: var(--spacing-sm);
    font-size: 1rem;
  }
`;

const FormGroup = styled.div`
  margin-bottom: var(--spacing-md);
  
  @media (max-width: 768px) {
    margin-bottom: var(--spacing-sm);
  }
`;

const Label = styled.label`
  display: block;
  margin-bottom: var(--spacing-sm);
  color: var(--dark-gray);
  font-weight: 500;
  
  @media (max-width: 768px) {
    font-size: 0.9rem;
    margin-bottom: 4px;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 2px solid var(--mid-gray);
  border-radius: var(--radius-md);
  font-size: 1rem;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }
  
  @media (max-width: 768px) {
    padding: 8px 12px;
    font-size: 0.9rem;
  }
`;

const RememberMeContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-md);
  gap: var(--spacing-sm);
  
  @media (max-width: 768px) {
    margin-bottom: var(--spacing-sm);
  }
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
  
  @media (max-width: 768px) {
    width: 16px;
    height: 16px;
  }
`;

const CheckboxLabel = styled.label`
  color: var(--dark-gray);
  font-size: 0.95rem;
  cursor: pointer;
  
  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: var(--spacing-md);
  background-color: #005BAA;
  color: var(--white);
  border: none;
  border-radius: var(--radius-md);
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #004c8c;
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  @media (max-width: 768px) {
    padding: 12px;
    font-size: 1.1rem;
  }
`;

const ErrorMessage = styled.div`
  color: var(--error-color);
  font-size: 0.875rem;
  margin-top: var(--spacing-sm);
  text-align: center;
  
  @media (max-width: 768px) {
    font-size: 0.8rem;
    margin-top: 8px;
  }
`;

const Login = () => {
  const navigate = useNavigate();
  const { apiUrl } = useApi();
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    portal: 'portal',
    rememberMe: false
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Find the user in DEMO_ACCOUNTS to get their role
        let userRole = 'user'; // default role
        for (const [_, account] of Object.entries(DEMO_ACCOUNTS)) {
          if (account.username === credentials.username) {
            userRole = account.role;
            break;
          }
        }
        
        // Store user info in localStorage
        localStorage.setItem('userRole', userRole);
        localStorage.setItem('portal', credentials.portal);
        localStorage.setItem('user', credentials.username);

        // Redirect based on role and portal
        if (credentials.portal === 'portal') {
          // Portal routes
          switch(userRole) {
            case 'admin':
              navigate('/admin');
              break;
            case 'user':
              navigate('/user');
              break;
            default:
              navigate('/user');
              break;
          }
        } else if (credentials.portal === 'elearning') {
          // E-learning routes
          switch(userRole) {
            case 'student':
              navigate('/elearning/student');
              break;
            case 'lecturer':
              navigate('/elearning/lecturer');
              break;
            default:
              setError('Bạn không có quyền truy cập vào hệ thống E-learning');
              break;
          }
        }
      } else {
        const data = await response.json();
        setError(data.detail || 'Tên đăng nhập hoặc mật khẩu không đúng');
      }
    } catch (err) {
      setError('Lỗi kết nối server!');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePortalSelect = (portal) => {
    setCredentials(prev => ({
      ...prev,
      portal
    }));
  };

  return (
    <LoginContainer>
      <LoginForm onSubmit={handleSubmit}>
        <Logo src={logoVinhuni} alt="Vinh University Logo" />
        <FormTitle>TRƯỜNG ĐẠI HỌC VINH</FormTitle>
        <Attribution>Hệ thống quản trị đại học thông minh - USMART</Attribution>
        <PortalButtons>
          <PortalButton
            type="button"
            active={credentials.portal === 'portal'}
            onClick={() => handlePortalSelect('portal')}
          >
            Cổng SV
          </PortalButton>
          <PortalButton
            type="button"
            active={credentials.portal === 'elearning'}
            onClick={() => handlePortalSelect('elearning')}
          >
            E-Learning
          </PortalButton>
        </PortalButtons>
        <FormGroup>
          <Label htmlFor="username">Tên đăng nhập</Label>
          <Input
            type="text"
            id="username"
            name="username"
            value={credentials.username}
            onChange={handleChange}
            required
            placeholder="Nhập tên đăng nhập"
          />
        </FormGroup>
        <FormGroup>
          <Label htmlFor="password">Mật khẩu</Label>
          <Input
            type="password"
            id="password"
            name="password"
            value={credentials.password}
            onChange={handleChange}
            required
            placeholder="Nhập mật khẩu"
          />
        </FormGroup>
        <RememberMeContainer>
          <Checkbox
            type="checkbox"
            id="rememberMe"
            name="rememberMe"
            checked={credentials.rememberMe}
            onChange={handleChange}
          />
          <CheckboxLabel htmlFor="rememberMe">
            Ghi nhớ đăng nhập
          </CheckboxLabel>
        </RememberMeContainer>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <SubmitButton type="submit">Đăng nhập</SubmitButton>
        <SubmitButton type="button" style={{marginTop: '10px', backgroundColor: '#4CAF50'}} onClick={() => alert('Tính năng đang phát triển!')}>Đăng nhập bằng tài khoản nhà trường</SubmitButton>
        <div style={{textAlign: 'center', marginTop: '16px'}}>
          <span>Bạn chưa có tài khoản? </span>
          <a href="/register" style={{color: '#005BAA', textDecoration: 'underline', cursor: 'pointer'}}>Đăng ký tài khoản</a>
        </div>
      </LoginForm>
    </LoginContainer>
  );
};

export default Login; 
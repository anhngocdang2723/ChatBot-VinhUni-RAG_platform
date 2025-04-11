import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { DEMO_ACCOUNTS } from '../config/accounts';

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--light-gray);
`;

const LoginForm = styled.form`
  background: var(--white);
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
`;

const FormTitle = styled.h2`
  color: var(--almost-black);
  margin-bottom: var(--spacing-lg);
  text-align: center;
`;

const PortalButtons = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
`;

const PortalButton = styled.button`
  padding: var(--spacing-md);
  border: 2px solid var(--primary-color);
  border-radius: var(--radius-md);
  background-color: ${props => props.active ? 'var(--primary-color)' : 'transparent'};
  color: ${props => props.active ? 'var(--white)' : 'var(--primary-color)'};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.active ? 'var(--primary-dark)' : 'var(--primary-light)'};
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const FormGroup = styled.div`
  margin-bottom: var(--spacing-md);
`;

const Label = styled.label`
  display: block;
  margin-bottom: var(--spacing-sm);
  color: var(--dark-gray);
  font-weight: 500;
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
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: var(--spacing-md);
  background-color: var(--primary-color);
  color: var(--white);
  border: none;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: var(--primary-dark);
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const ErrorMessage = styled.div`
  color: var(--error-color);
  font-size: 0.875rem;
  margin-top: var(--spacing-sm);
  text-align: center;
`;

const Login = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    portal: 'portal'
  });
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    const account = Object.values(DEMO_ACCOUNTS).find(
      acc => acc.username === credentials.username && 
            acc.password === credentials.password &&
            acc.portal === credentials.portal
    );

    if (account) {
      localStorage.setItem('userRole', account.role);
      localStorage.setItem('portal', account.portal);
      
      if (account.portal === 'portal') {
        if (account.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/user');
        }
      } else {
        if (account.role === 'student') {
          navigate('/elearning/student');
        } else if (account.role === 'lecturer') {
          navigate('/elearning/lecturer');
        }
      }
    } else {
      setError('Tên đăng nhập hoặc mật khẩu không đúng');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
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
        <FormTitle>Đăng nhập</FormTitle>
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
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <SubmitButton type="submit">Đăng nhập</SubmitButton>
      </LoginForm>
    </LoginContainer>
  );
};

export default Login; 
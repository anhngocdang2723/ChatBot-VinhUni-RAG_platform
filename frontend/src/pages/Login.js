import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

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
    password: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    // Check for admin credentials
    if (credentials.username === 'admin' && credentials.password === 'admin') {
      localStorage.setItem('userRole', 'admin');
      navigate('/admin');
    } else {
      // For any other credentials, assign user role
      localStorage.setItem('userRole', 'user');
      navigate('/user');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <LoginContainer>
      <LoginForm onSubmit={handleSubmit}>
        <FormTitle>Welcome Back</FormTitle>
        <FormGroup>
          <Label htmlFor="username">Username</Label>
          <Input
            type="text"
            id="username"
            name="username"
            value={credentials.username}
            onChange={handleChange}
            required
            placeholder="Enter your username"
          />
        </FormGroup>
        <FormGroup>
          <Label htmlFor="password">Password</Label>
          <Input
            type="password"
            id="password"
            name="password"
            value={credentials.password}
            onChange={handleChange}
            required
            placeholder="Enter your password"
          />
        </FormGroup>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <SubmitButton type="submit">Login</SubmitButton>
      </LoginForm>
    </LoginContainer>
  );
};

export default Login; 
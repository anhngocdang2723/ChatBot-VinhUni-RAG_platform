import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import logoVinhuni from '../assets/logo-vinhuni.png';
import { toast } from 'react-toastify';

const RegisterContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f0f4fa;
  padding: 20px;
`;

const RegisterForm = styled.form`
  background: #fff;
  padding: 40px 32px;
  border-radius: 16px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
  width: 100%;
  max-width: 420px;
`;

const Logo = styled.img`
  width: 90px;
  height: 90px;
  margin: 0 auto 20px auto;
  display: block;
`;

const Title = styled.h2`
  text-align: center;
  color: #222;
  margin-bottom: 18px;
`;

const FormGroup = styled.div`
  margin-bottom: 18px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 6px;
  color: #444;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 14px;
  border: 2px solid #cfd8dc;
  border-radius: 8px;
  font-size: 1rem;
  transition: border 0.2s;
  &:focus {
    border-color: #005BAA;
    outline: none;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 12px;
  background-color: #005BAA;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
  transition: background 0.2s;
  &:hover {
    background-color: #004c8c;
  }
`;

const ErrorMessage = styled.div`
  color: #e53935;
  font-size: 0.95rem;
  margin-bottom: 10px;
  text-align: center;
`;

const BackToLogin = styled.div`
  text-align: center;
  margin-top: 18px;
  font-size: 0.98rem;
`;

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullname: '',
    email: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.username || !form.password || !form.confirmPassword || !form.fullname || !form.email) {
      setError('Vui lòng điền đầy đủ thông tin.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
          full_name: form.fullname,
          email: form.email
        })
      });

      if (response.ok) {
        toast.success('Đăng ký thành công!');
        navigate('/login');
      } else {
        const data = await response.json();
        setError(data.detail || 'Đăng ký thất bại!');
      }
    } catch (err) {
      setError('Lỗi kết nối server!');
    }
  };

  return (
    <RegisterContainer>
      <RegisterForm onSubmit={handleSubmit}>
        <Logo src={logoVinhuni} alt="Vinh University Logo" />
        <Title>Đăng ký tài khoản</Title>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <FormGroup>
          <Label htmlFor="username">Tên đăng nhập</Label>
          <Input type="text" id="username" name="username" value={form.username} onChange={handleChange} required placeholder="Nhập tên đăng nhập" />
        </FormGroup>
        <FormGroup>
          <Label htmlFor="password">Mật khẩu</Label>
          <Input type="password" id="password" name="password" value={form.password} onChange={handleChange} required placeholder="Nhập mật khẩu" />
        </FormGroup>
        <FormGroup>
          <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
          <Input type="password" id="confirmPassword" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required placeholder="Nhập lại mật khẩu" />
        </FormGroup>
        <FormGroup>
          <Label htmlFor="fullname">Họ và tên</Label>
          <Input type="text" id="fullname" name="fullname" value={form.fullname} onChange={handleChange} required placeholder="Nhập họ tên" />
        </FormGroup>
        <FormGroup>
          <Label htmlFor="email">Email</Label>
          <Input type="email" id="email" name="email" value={form.email} onChange={handleChange} required placeholder="Nhập email" />
        </FormGroup>
        <SubmitButton type="submit">Đăng ký</SubmitButton>
        <BackToLogin>
          Đã có tài khoản? <a href="/login" style={{color: '#005BAA', textDecoration: 'underline'}}>Đăng nhập</a>
        </BackToLogin>
      </RegisterForm>
    </RegisterContainer>
  );
};

export default Register; 
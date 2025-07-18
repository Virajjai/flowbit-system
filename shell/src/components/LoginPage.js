import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';

const LoginPageContainer = styled.div`
  display: flex;
  height: 100vh;
  justify-content: center;
  align-items: center;
  background-color: #f4f4f9;
`;

const LoginForm = styled.form`
  background: #fff;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem;
  margin: 0.5rem 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const Button = styled.button`
  width: 100%;
  padding: 0.75rem;
  margin-top: 1rem;
  background-color: #2a9d8f;
  border: none;
  border-radius: 4px;
  color: #ffffff;
  font-size: 1rem;
  cursor: pointer;
  &:hover {
    background-color: #21867a;
  }
`;

const Error = styled.div`
  color: #e63946;
  font-size: 0.875rem;
  margin-top: 0.5rem;
`;

const LoginPage = () => {
  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await login(credentials.email, credentials.password);
    if (response.success) {
      navigate('/dashboard');
    }
  };

  return (
    <LoginPageContainer>
      <LoginForm onSubmit={handleSubmit}>
        <h2>Login</h2>
        <Input
          type="email"
          name="email"
          placeholder="Email address"
          value={credentials.email}
          onChange={handleChange}
          onFocus={clearError}
        />
        <Input
          type="password"
          name="password"
          placeholder="Password"
          value={credentials.password}
          onChange={handleChange}
          onFocus={clearError}
        />
        <Button type="submit">Log In</Button>
        {error && <Error>{error}</Error>}
      </LoginForm>
    </LoginPageContainer>
  );
};

export default LoginPage;

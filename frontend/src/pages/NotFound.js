import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const NotFoundContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
  padding: var(--spacing-xl);
`;

const NotFoundTitle = styled.h1`
  font-size: 6rem;
  font-weight: bold;
  color: var(--primary-color);
  margin-bottom: var(--spacing-md);
`;

const NotFoundMessage = styled.p`
  font-size: 1.5rem;
  margin-bottom: var(--spacing-xl);
  max-width: 600px;
`;

const NotFoundPage = () => {
  return (
    <NotFoundContainer>
      <NotFoundTitle>404</NotFoundTitle>
      <NotFoundMessage>
        Oops! The page you're looking for doesn't exist.
      </NotFoundMessage>
      <Link to="/" className="button">
        Go to Dashboard
      </Link>
    </NotFoundContainer>
  );
};

export default NotFoundPage; 
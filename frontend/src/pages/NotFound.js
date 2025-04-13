import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { VINH_COLORS } from '../config/colors';

const NotFoundContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
  padding: var(--spacing-xl);
  background-color: ${VINH_COLORS.backgroundAlt};
`;

const NotFoundTitle = styled.h1`
  font-size: 6rem;
  font-weight: bold;
  color: ${VINH_COLORS.primary};
  margin-bottom: var(--spacing-md);
`;

const NotFoundMessage = styled.p`
  font-size: 1.5rem;
  margin-bottom: var(--spacing-xl);
  max-width: 600px;
  color: ${VINH_COLORS.text};
`;

const StyledButton = styled.button`
  background-color: ${VINH_COLORS.primary};
  color: ${VINH_COLORS.white};
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${VINH_COLORS.primaryDark};
  }
`;

const NotFoundPage = () => {
  return (
    <NotFoundContainer>
      <NotFoundTitle>404</NotFoundTitle>
      <NotFoundMessage>
        Oops! Trang bạn đang tìm kiếm không tồn tại.
      </NotFoundMessage>
      <Link to="/" style={{ textDecoration: 'none' }}>
        <StyledButton>
          Đi đến Trang chủ
        </StyledButton>
      </Link>
    </NotFoundContainer>
  );
};

export default NotFoundPage; 
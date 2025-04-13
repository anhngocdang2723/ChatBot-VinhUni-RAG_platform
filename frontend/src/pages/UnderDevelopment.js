import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { VINH_COLORS } from '../config/colors';

const UnderDevelopmentContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
  padding: var(--spacing-xl);
  background-color: ${VINH_COLORS.backgroundAlt};
`;

const UnderDevelopmentTitle = styled.h1`
  font-size: 3rem;
  font-weight: bold;
  color: ${VINH_COLORS.primary};
  margin-bottom: var(--spacing-md);
`;

const UnderDevelopmentMessage = styled.p`
  font-size: 1.5rem;
  margin-bottom: var(--spacing-xl);
  max-width: 600px;
  color: ${VINH_COLORS.text};
`;

const UnderDevelopmentIcon = styled.div`
  font-size: 5rem;
  margin-bottom: var(--spacing-lg);
  color: ${VINH_COLORS.warning};
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: var(--spacing-md);
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

const UnderDevelopmentPage = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <UnderDevelopmentContainer>
      <UnderDevelopmentIcon>🚧</UnderDevelopmentIcon>
      <UnderDevelopmentTitle>Tính năng đang phát triển</UnderDevelopmentTitle>
      <UnderDevelopmentMessage>
        Chúng tôi đang nỗ lực phát triển tính năng này. Vui lòng quay lại sau!
      </UnderDevelopmentMessage>
      <ButtonContainer>
        <StyledButton onClick={handleGoBack}>
          Quay lại
        </StyledButton>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <StyledButton>
            Đi đến Trang chủ
          </StyledButton>
        </Link>
      </ButtonContainer>
    </UnderDevelopmentContainer>
  );
};

export default UnderDevelopmentPage; 
import React from 'react';
import styled from 'styled-components';
import { useApi } from '../context/ApiContext';

const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
  width: 100vw;
  overflow: hidden;
`;

const Content = styled.main`
  flex: 1;
  width: 100%;
  height: 100vh;
  overflow: hidden;
`;

const StatusIndicator = styled.div`
  position: fixed;
  bottom: var(--spacing-md);
  right: var(--spacing-md);
  display: flex;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--almost-black);
  color: var(--white);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  box-shadow: var(--shadow-md);
  z-index: 1000;
`;

const StatusDot = styled.span`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.connected ? 'var(--success-color)' : 'var(--error-color)'};
  margin-right: var(--spacing-sm);
`;

const UserLayout = ({ children }) => {
  const { isConnected } = useApi();
  
  return (
    <LayoutContainer>
      <Content>
        {children}
      </Content>
      <StatusIndicator>
        <StatusDot connected={isConnected} />
        <span>API: {isConnected ? 'Connected' : 'Disconnected'}</span>
      </StatusIndicator>
    </LayoutContainer>
  );
};

export default UserLayout; 
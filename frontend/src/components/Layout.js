import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { FiHome, FiMessageSquare, FiFolder, FiSettings, FiExternalLink } from 'react-icons/fi';
import { useApi } from '../context/ApiContext';

const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
`;

const Sidebar = styled.aside`
  width: 240px;
  background-color: var(--almost-black);
  color: var(--white);
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
`;

const Logo = styled.div`
  font-size: 1.75rem;
  font-weight: 800;
  margin-bottom: var(--spacing-xl);
  color: var(--white);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  letter-spacing: -0.5px;
  
  span {
    background: linear-gradient(120deg, var(--primary-light), var(--accent-color));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

const NavList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
  
  /* Add some spacing between nav sections */
  & > * + * {
    margin-top: var(--spacing-xs);
  }
`;

const NavItem = styled.li`
  margin-bottom: var(--spacing-sm);
`;

const NavLink = styled(Link)`
  display: flex;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  color: ${props => props.active ? 'var(--white)' : 'var(--gray)'};
  background-color: ${props => props.active ? 'var(--primary-dark)' : 'transparent'};
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: all 0.3s ease;
  font-weight: 500;
  
  &:hover {
    background-color: ${props => props.active ? 'var(--primary-dark)' : 'rgba(255, 255, 255, 0.1)'};
    transform: translateX(4px);
    text-decoration: none;
  }
  
  svg {
    margin-right: var(--spacing-sm);
    transition: transform 0.2s ease;
  }
  
  &:hover svg {
    transform: scale(1.1);
  }
`;

const Content = styled.main`
  flex: 1;
  padding: var(--spacing-lg);
  overflow-y: auto;
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  margin-top: auto;
  padding: var(--spacing-md);
  font-size: 0.875rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const StatusDot = styled.span`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.connected ? 'var(--success-color)' : 'var(--error-color)'};
  margin-right: var(--spacing-sm);
`;

const ApiLink = styled.a`
  color: var(--gray);
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  text-decoration: none;
  
  &:hover {
    color: var(--white);
    text-decoration: none;
  }
  
  svg {
    margin-left: var(--spacing-xs);
  }
`;

const Layout = ({ children }) => {
  const location = useLocation();
  const { isConnected, apiUrl } = useApi();
  
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  return (
    <LayoutContainer>
      <Sidebar>
        <Logo>
          <span>Chatbot VinhUni RAG</span>
        </Logo>
        
        <NavList>
          <NavItem>
            <NavLink to="/" active={isActive('/')}>
              <FiHome />
              Trang chủ
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/chat" active={isActive('/chat')}>
              <FiMessageSquare />
              Trò chuyện
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/documents" active={isActive('/documents')}>
              <FiFolder />
              Quản lý tài liệu
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/settings" active={isActive('/settings')}>
              <FiSettings />
              Cài đặt
            </NavLink>
          </NavItem>
        </NavList>
        
        <StatusIndicator>
          <StatusDot connected={isConnected} />
          <span>API: {isConnected ? 'Đã kết nối' : 'Mất kết nối'}</span>
        </StatusIndicator>
        
        <ApiLink href={apiUrl} target="_blank" rel="noopener noreferrer">
          {apiUrl} <FiExternalLink />
        </ApiLink>
      </Sidebar>
      
      <Content>
        {children}
      </Content>
    </LayoutContainer>
  );
};

export default Layout; 
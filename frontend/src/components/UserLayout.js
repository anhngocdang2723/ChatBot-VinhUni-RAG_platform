import React, { useState } from 'react';
import styled from 'styled-components';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiMessageSquare, FiHelpCircle, FiExternalLink, FiMenu, FiX } from 'react-icons/fi';
import { useApi } from '../context/ApiContext';

const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
  width: 100vw;
  overflow: hidden;
`;

const Sidebar = styled.aside`
  width: 240px;
  background-color: var(--almost-black);
  color: var(--white);
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  z-index: 1000;
  transition: transform 0.3s ease;
  
  @media (max-width: 768px) {
    transform: translateX(${props => props.isOpen ? '0' : '-100%'});
    width: 100%;
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  position: fixed;
  top: var(--spacing-md);
  left: var(--spacing-md);
  z-index: 1001;
  background: var(--almost-black);
  color: var(--white);
  border: none;
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  cursor: pointer;
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const Overlay = styled.div`
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  
  @media (max-width: 768px) {
    display: ${props => props.isOpen ? 'block' : 'none'};
  }
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
  width: 100%;
  height: 100vh;
  overflow-y: auto;
  background-color: var(--background-color);
  margin-left: 240px;
  
  @media (max-width: 768px) {
    margin-left: 0;
  }
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

const ApiLink = styled.a`
  color: var(--gray);
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  text-decoration: none;
  margin-top: var(--spacing-sm);
  
  &:hover {
    color: var(--white);
    text-decoration: none;
  }
  
  svg {
    margin-left: var(--spacing-xs);
  }
`;

const UserLayout = ({ children }) => {
  const location = useLocation();
  const { isConnected, apiUrl } = useApi();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  return (
    <LayoutContainer>
      <MobileMenuButton onClick={toggleSidebar}>
        {isSidebarOpen ? <FiX /> : <FiMenu />}
      </MobileMenuButton>
      
      <Overlay isOpen={isSidebarOpen} onClick={toggleSidebar} />
      
      <Sidebar isOpen={isSidebarOpen}>
        <Logo>
          <span>Chatbot VinhUni RAG</span>
        </Logo>
        
        <NavList>
          <NavItem>
            <NavLink to="/user" active={isActive('/user')} onClick={toggleSidebar}>
              <FiHome />
              Trang chủ
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/user/chat" active={isActive('/user/chat')} onClick={toggleSidebar}>
              <FiMessageSquare />
              Trò chuyện
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/user/help" active={isActive('/user/help')} onClick={toggleSidebar}>
              <FiHelpCircle />
              Hướng dẫn
            </NavLink>
          </NavItem>
        </NavList>
        
        <ApiLink href={apiUrl} target="_blank" rel="noopener noreferrer">
          {apiUrl} <FiExternalLink />
        </ApiLink>
      </Sidebar>
      
      <Content>
        {children}
      </Content>
      
      <StatusIndicator>
        <StatusDot connected={isConnected} />
        <span>API: {isConnected ? 'Đã kết nối' : 'Mất kết nối'}</span>
      </StatusIndicator>
    </LayoutContainer>
  );
};

export default UserLayout; 
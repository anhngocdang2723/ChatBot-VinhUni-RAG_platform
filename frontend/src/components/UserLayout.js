import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiHome, FiMessageSquare, FiHelpCircle, FiExternalLink, FiMenu, FiX, FiLogOut, 
  FiUser, FiBell, FiSettings, FiBook, FiCalendar, FiClipboard, FiFileText, FiSearch } from 'react-icons/fi';
import { useApi } from '../context/ApiContext';
import ApiSwitcher from './ApiSwitcher';
import memeLogo from '../assets/meme-image.png';
import logoVinhuni from '../assets/logo-vinhuni.png';
import userAvatar from '../assets/user.png';
import { VINH_COLORS } from '../config/colors';
import { DEMO_ACCOUNTS } from '../config/accounts';
// import userAvatar from '../assets/male-avatar-placeholder.png';

const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: ${VINH_COLORS.gray};
`;

const Sidebar = styled.aside`
  width: 280px;
  background: ${VINH_COLORS.white};
  color: ${VINH_COLORS.text};
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  z-index: 1000;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 4px 0 10px rgba(0, 0, 0, 0.05);
  padding-top: 72px;
  
  @media (max-width: 768px) {
    transform: translateX(${props => props.isOpen ? '0' : '-100%'});
    width: 100%;
    max-width: 320px;
    padding-top: 64px;
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 1001;
  background: ${VINH_COLORS.white};
  color: ${VINH_COLORS.primary};
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  @media (max-width: 768px) {
    display: flex;
  }
  
  &:active {
    transform: scale(0.95);
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
  opacity: ${props => props.isOpen ? 1 : 0};
  transition: opacity 0.3s ease;
  backdrop-filter: blur(2px);
  
  @media (max-width: 768px) {
    display: ${props => props.isOpen ? 'block' : 'none'};
  }
`;

const LogoContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px;
  margin-bottom: 24px;
  border-bottom: 1px solid ${VINH_COLORS.gray};
`;

const LogoImage = styled.img`
  width: 90px;
  height: 90px;
  margin-bottom: 16px;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: scale(1.02);
  }
`;

const LogoText = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

const LogoTitle = styled.span`
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, ${VINH_COLORS.primary}, ${VINH_COLORS.accent});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.5px;
`;

const LogoSubtitle = styled.span`
  font-size: 1rem;
  color: ${VINH_COLORS.textLight};
  font-weight: 500;
  letter-spacing: 0.5px;
`;

const NavList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
  
  & > * + * {
    margin-top: 2px;
  }
`;

const NavItem = styled.li``;

const NavLink = styled(Link)`
  display: flex;
  align-items: center;
  padding: 10px 12px;
  color: ${props => props.active ? VINH_COLORS.primary : VINH_COLORS.textLight};
  background-color: ${props => props.active ? VINH_COLORS.lightBlue : 'transparent'};
  border-radius: 6px;
  text-decoration: none;
  transition: all 0.2s ease;
  font-weight: ${props => props.active ? '600' : '400'};
  
  &:hover {
    color: ${VINH_COLORS.primary};
    background-color: ${VINH_COLORS.lightBlue}80;
    transform: translateX(2px);
  }
  
  svg {
    width: 20px;
    height: 20px;
    margin-right: 12px;
    transition: transform 0.2s ease;
  }
`;

const Header = styled.header`
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  height: 56px;
  background: ${VINH_COLORS.primary};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 1001;
  color: ${VINH_COLORS.white};
  
  @media (max-width: 768px) {
    padding: 0 12px;
    height: 48px;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  
  @media (max-width: 768px) {
    gap: 8px;
  }
`;

const HeaderLogo = styled.img`
  width: 32px;
  height: 32px;
  object-fit: contain;
  
  @media (max-width: 768px) {
    width: 24px;
    height: 24px;
  }
`;

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const TitleContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0px;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const TitleDivider = styled.div`
  width: 1px;
  height: 32px;
  background: rgba(255, 255, 255, 0.3);
  margin: 0 16px;
`;

const MainTitle = styled.h1`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${VINH_COLORS.white};
  margin: 0;
  letter-spacing: 0.3px;
  
  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
`;

const SubTitle = styled.h2`
  font-size: 0.75rem;
  font-weight: 400;
  color: ${VINH_COLORS.white};
  margin: 0;
  opacity: 0.9;
  
  @media (max-width: 768px) {
    font-size: 0.7rem;
  }
`;

const SearchContainer = styled.div`
  flex: 1;
  max-width: 480px;
  margin: 0 32px;
  position: relative;
  
  @media (max-width: 768px) {
    margin: 0 12px;
    max-width: none;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  height: 32px;
  padding: 4px 44px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  font-size: 0.875rem;
  color: ${VINH_COLORS.white};
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  &:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.3);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }
  
  @media (max-width: 768px) {
    height: 28px;
    padding: 4px 36px;
    font-size: 0.8rem;
  }
`;

const SearchIcon = styled(FiSearch)`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.7);
  width: 16px;
  height: 16px;
  
  @media (max-width: 768px) {
    left: 8px;
    width: 14px;
    height: 14px;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  
  @media (max-width: 768px) {
    gap: 8px;
  }
`;

const IconButton = styled.button`
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: ${VINH_COLORS.white};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: ${VINH_COLORS.white};
  }

  svg {
    width: 18px;
    height: 18px;
    opacity: 0.85;
  }

  &:hover svg {
    opacity: 1;
  }
  
  @media (max-width: 768px) {
    width: 28px;
    height: 28px;
    
    svg {
      width: 16px;
      height: 16px;
    }
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  @media (max-width: 768px) {
    padding: 4px 8px;
  }
`;

const UserAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  background: ${VINH_COLORS.white};
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  @media (max-width: 768px) {
    width: 28px;
    height: 28px;
  }
`;

const UserName = styled.span`
  font-weight: 400;
  color: ${VINH_COLORS.white};
  font-size: 0.875rem;
  
  @media (max-width: 768px) {
    font-size: 0.8rem;
    display: none;
  }
`;

const Content = styled.main`
  flex: 1;
  width: 100%;
  height: 100vh;
  overflow-y: auto;
  background-color: ${VINH_COLORS.gray};
  margin-left: 280px;
  padding: 80px 24px 24px;
  
  @media (max-width: 768px) {
    margin-left: 0;
    padding: 64px 12px 12px;
  }
`;

const StatusIndicator = styled.div`
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: ${VINH_COLORS.white};
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  font-size: 0.875rem;
  color: ${VINH_COLORS.text};
  z-index: 1000;
  
  @media (max-width: 768px) {
    bottom: 16px;
    right: 16px;
    padding: 6px 12px;
    font-size: 0.8rem;
  }
`;

const StatusDot = styled.span`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.connected ? '#52C41A' : '#FF4D4F'};
  margin-right: 8px;
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
  const navigate = useNavigate();
  const { isConnected, apiUrl } = useApi();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userName, setUserName] = useState('Người dùng');
  
  useEffect(() => {
    // Get the current user from localStorage
    const currentUser = localStorage.getItem('user');
    console.log('Current user from localStorage:', currentUser);
    
    if (currentUser) {
      // Find the user in DEMO_ACCOUNTS by username
      const userAccount = Object.values(DEMO_ACCOUNTS).find(account => account.username === currentUser);
      console.log('Found user account:', userAccount);
      
      if (userAccount && userAccount.name) {
        console.log('Setting user name to:', userAccount.name);
        setUserName(userAccount.name);
      } else {
        console.log('No name found for user, using default');
      }
    } else {
      console.log('No user found in localStorage');
    }
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const handleLogout = () => {
    // Clear all auth related data
    localStorage.removeItem('userRole');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    
    // Force reload to clear any cached states
    window.location.href = '/';
  };

  return (
    <LayoutContainer>
      <MobileMenuButton onClick={toggleSidebar}>
        {isSidebarOpen ? <FiX /> : <FiMenu />}
      </MobileMenuButton>
      
      <Overlay isOpen={isSidebarOpen} onClick={toggleSidebar} />
      
      <Header>
        <HeaderLeft>
          <HeaderLogo src={memeLogo} alt="Vinh University Logo" />
          <HeaderTitle>
            <TitleContent>
              <MainTitle>TRƯỜNG ĐẠI HỌC VINH</MainTitle>
              <SubTitle>HỆ THỐNG USMART</SubTitle>
            </TitleContent>
            <TitleDivider />
          </HeaderTitle>
        </HeaderLeft>

        <SearchContainer>
          <SearchIcon />
          <SearchInput 
            placeholder="Nhập từ khóa..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SearchContainer>
        
        <HeaderActions>
          <ApiSwitcher />
          <IconButton>
            <FiBell />
          </IconButton>
          <IconButton>
            <FiSettings />
          </IconButton>
          <UserInfo>
            <UserAvatar>
              <img src={userAvatar} alt={userName} />
            </UserAvatar>
            <UserName>{userName}</UserName>
          </UserInfo>
        </HeaderActions>
      </Header>

      <Sidebar isOpen={isSidebarOpen}>
        <LogoContainer>
          <LogoImage src={logoVinhuni} alt="Vinh University Logo" />
          <LogoText>
            <LogoTitle>CHATBOT</LogoTitle>
            <LogoSubtitle>VinhUni</LogoSubtitle>
          </LogoText>
        </LogoContainer>
        
        <NavList>
          <NavItem>
            <NavLink to="/user" active={location.pathname === '/user'} onClick={toggleSidebar}>
              <FiHome />
              Trang chủ
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/user/chat" active={location.pathname === '/user/chat'} onClick={toggleSidebar}>
              <FiMessageSquare />
              Bắt đầu trò chuyện
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/user/help" active={location.pathname === '/user/help'} onClick={toggleSidebar}>
              <FiHelpCircle />
              Hướng dẫn sử dụng
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/under-development" active={location.pathname === '/under-development'} onClick={toggleSidebar}>
              <FiUser />
              Hồ sơ người học
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/under-development" active={location.pathname === '/under-development'} onClick={toggleSidebar}>
              <FiCalendar />
              Thời khóa biểu
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/under-development" active={location.pathname === '/under-development'} onClick={toggleSidebar}>
              <FiBook />
              Khóa học
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/under-development" active={location.pathname === '/under-development'} onClick={toggleSidebar}>
              <FiFileText />
              Tài liệu
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/under-development" active={location.pathname === '/under-development'} onClick={toggleSidebar}>
              <FiClipboard />
              Kết quả học tập
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="#" onClick={handleLogout} style={{ color: 'var(--error-color)' }}>
              <FiLogOut />
              Đăng xuất
            </NavLink>
          </NavItem>
        </NavList>
        
        {/* <ApiLink href={apiUrl} target="_blank" rel="noopener noreferrer">
          {apiUrl} <FiExternalLink />
        </ApiLink> */}
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
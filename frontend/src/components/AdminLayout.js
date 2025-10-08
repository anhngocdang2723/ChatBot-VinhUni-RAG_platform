import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FiHome, FiFolder, FiSettings, FiExternalLink, FiMenu, FiX, FiLogOut, 
  FiUser, FiBell, FiDatabase, FiSearch, FiServer, FiMessageSquare } from 'react-icons/fi';
import { useApi } from '../context/ApiContext';
import ApiSwitcher from './ApiSwitcher';
import memeLogo from '../assets/meme-image.png';
import logoVinhuni from '../assets/logo-vinhuni.png';
import userAvatar from '../assets/meme-image2.png';
import { VINH_COLORS } from '../config/colors';
import UnderDevelopment from '../pages/UnderDevelopment';
import { DEMO_ACCOUNTS } from '../config/accounts';

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
  transition: all 0.3s ease;
  box-shadow: 4px 0 10px rgba(0, 0, 0, 0.05);
  padding-top: 72px;
  
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
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const HeaderLogo = styled.img`
  width: 32px;
  height: 32px;
  object-fit: contain;
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
`;

const SubTitle = styled.h2`
  font-size: 0.75rem;
  font-weight: 400;
  color: ${VINH_COLORS.white};
  margin: 0;
  opacity: 0.9;
`;

const SearchContainer = styled.div`
  flex: 1;
  max-width: 480px;
  margin: 0 32px;
  position: relative;
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
`;

const SearchIcon = styled(FiSearch)`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.7);
  width: 16px;
  height: 16px;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
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
`;

const UserName = styled.span`
  font-weight: 400;
  color: ${VINH_COLORS.white};
  font-size: 0.875rem;
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
`;

const StatusDot = styled.span`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.connected ? '#52C41A' : '#FF4D4F'};
  margin-right: 8px;
`;

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isConnected, apiUrl } = useApi();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userName, setUserName] = useState('Admin');
  
  useEffect(() => {
    // Get the current user from localStorage
    const currentUser = localStorage.getItem('user');
    if (currentUser) {
      // Find the user in DEMO_ACCOUNTS
      const userAccount = Object.values(DEMO_ACCOUNTS).find(account => account.username === currentUser);
      if (userAccount && userAccount.name) {
        setUserName(userAccount.name);
      }
    }
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    window.location.href = '/';
  };

  const isActive = (path) => {
    return location.pathname === path;
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
              <SubTitle>TRANG QUẢN TRỊ USMART</SubTitle>
            </TitleContent>
            <TitleDivider />
          </HeaderTitle>
        </HeaderLeft>

        <SearchContainer>
          <SearchIcon />
          <SearchInput 
            placeholder="Tìm kiếm..." 
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
            <LogoTitle>QUẢN TRỊ</LogoTitle>
            <LogoSubtitle>VinhUni</LogoSubtitle>
          </LogoText>
        </LogoContainer>
        
        <NavList>
          <NavItem>
            <NavLink to="/admin" active={isActive('/admin')} onClick={toggleSidebar}>
              <FiHome />
              Trang chủ
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/admin/documents" active={isActive('/admin/documents')} onClick={toggleSidebar}>
              <FiFolder />
              Quản lý tài liệu
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/under-development" active={isActive('/under-development')} onClick={toggleSidebar}>
              <FiDatabase />
              Quản lý bộ sưu tập
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/under-development" active={isActive('/under-development')} onClick={toggleSidebar}>
              <FiUser />
              Quản lý người dùng
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/under-development" active={isActive('/under-development')} onClick={toggleSidebar}>
              <FiMessageSquare />
              Quản lý lịch sử trò chuyện
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/admin/settings" active={isActive('/admin/settings')} onClick={toggleSidebar}>
              <FiSettings />
              Cài đặt hệ thống
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/under-development" active={isActive('/under-development')} onClick={toggleSidebar}>
              <FiServer />
              Trạng thái máy chủ
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="#" onClick={handleLogout} style={{ color: VINH_COLORS.error }}>
              <FiLogOut />
              Đăng xuất
            </NavLink>
          </NavItem>
        </NavList>
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

export default AdminLayout; 
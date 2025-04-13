import React from 'react';
import styled from 'styled-components';
import { FiBell, FiMessageCircle, FiSearch, FiLogOut } from 'react-icons/fi';
import { DEMO_ACCOUNTS } from '../config/accounts';
import { VINH_COLORS } from '../config/colors';
import logoVinhuni from '../assets/logo-vinhuni.png';
import maleAvatar from '../assets/male-avatar-placeholder.png';
import femaleAvatar from '../assets/female-avatar-placeholder.png';
import userAvatar from '../assets/meme-image2.png';
import bgLogin from '../assets/bg-login.jpg';

const HeaderWrapper = styled.div`
  background: ${VINH_COLORS.primary};
  width: 100%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const TopBar = styled.div`
  background-color: ${VINH_COLORS.primaryDark};
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  .content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 1rem;
  }

  .user-controls {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    color: ${VINH_COLORS.white};
    font-size: 0.9rem;

    .notifications, .messages, .user-info, .logout {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: var(--radius-md);
      transition: all 0.2s ease;
      
      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
    }

    .logout {
      padding-left: 1rem;
      border-left: 1px solid rgba(255, 255, 255, 0.2);
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      
      img {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 2px solid ${VINH_COLORS.white};
        object-fit: cover;
        background-color: ${VINH_COLORS.white};
      }
      
      .user-details {
        display: flex;
        flex-direction: column;
        
        .username {
          font-weight: 500;
        }
        
        .role-badge {
          font-size: 0.75rem;
          opacity: 0.8;
          background-color: rgba(255, 255, 255, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
          margin-top: 2px;
        }
      }
    }
  }
`;

const Header = styled.header`
  color: ${VINH_COLORS.white};
  padding: 1rem 0;
  background: ${VINH_COLORS.primary};

  .content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  
  img {
    height: 50px;
    width: auto;
    object-fit: contain;
  }
  
  .text {
    display: flex;
    flex-direction: column;
    
    .title {
      font-size: 1.25rem;
      font-weight: 600;
      text-transform: uppercase;
      color: ${VINH_COLORS.white};
      letter-spacing: 0.5px;
      margin-bottom: 0.25rem;
      white-space: nowrap;
    }
    
    .subtitle {
      font-size: 0.9rem;
      opacity: 0.9;
      color: ${VINH_COLORS.white};
    }
  }
`;

const SearchBar = styled.div`
  position: relative;
  width: 350px;

  input {
    width: 100%;
    padding: 0.75rem 1rem;
    padding-right: 3rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: var(--radius-lg);
    background: rgba(255, 255, 255, 0.1);
    color: ${VINH_COLORS.white};
    font-size: 0.95rem;
    transition: all 0.2s ease;

    &::placeholder {
      color: rgba(255, 255, 255, 0.7);
    }

    &:focus {
      outline: none;
      background: rgba(255, 255, 255, 0.15);
      border-color: ${VINH_COLORS.primaryLight};
      box-shadow: 0 0 0 3px ${VINH_COLORS.primaryLight}33;
    }
  }

  button {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: ${VINH_COLORS.white};
    cursor: pointer;
    padding: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;

    &:hover {
      opacity: 0.8;
      transform: translateY(-50%) scale(1.1);
    }
  }
`;

const Navigation = styled.nav`
  background-color: rgba(0, 0, 0, 0.15);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  
  .content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
    display: flex;
    gap: 2.5rem;
  }

  a {
    color: ${VINH_COLORS.white};
    text-decoration: none;
    padding: 1rem 0;
    font-size: 0.95rem;
    font-weight: 500;
    opacity: 0.85;
    border-bottom: 2px solid transparent;
    transition: all 0.2s ease;
    position: relative;
    
    &:hover, &.active {
      opacity: 1;
      border-bottom-color: ${VINH_COLORS.white};
    }
    
    &.active {
      font-weight: 600;
    }
  }
`;

const FooterWrapper = styled.footer`
  background-color: ${VINH_COLORS.primary};
  color: ${VINH_COLORS.white};
  padding: 2rem 0;
  margin-top: auto;
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }

  h3 {
    color: ${VINH_COLORS.white};
    font-size: 1.1rem;
    margin-bottom: 1rem;
    font-weight: 600;
  }

  p, a {
    color: ${VINH_COLORS.white};
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
    display: block;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  a:hover {
    color: ${VINH_COLORS.accent};
    transform: translateX(5px);
  }

  .social-links {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;

    a {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;

      &:hover {
        background: ${VINH_COLORS.accent};
        transform: translateY(-3px);
      }
    }
  }
`;

export const TopBarComponent = ({ userRole = 'student' }) => {
  // Lấy thông tin người dùng từ localStorage
  const currentUsername = localStorage.getItem('user');
  let currentUser = null;
  
  // Tìm người dùng trong DEMO_ACCOUNTS
  if (currentUsername) {
    currentUser = Object.values(DEMO_ACCOUNTS).find(account => account.username === currentUsername);
  }
  
  // Nếu không tìm thấy, sử dụng giá trị mặc định
  if (!currentUser) {
    currentUser = userRole === 'student' ? DEMO_ACCOUNTS.student1 : DEMO_ACCOUNTS.lecturer;
  }
  
  // Sử dụng avatar mặc định
  const avatarSrc = userAvatar;

  // Hàm chuyển đổi role sang tiếng Việt
  const getVietnameseRole = (role) => {
    switch (role) {
      case 'student':
        return 'Sinh viên';
      case 'lecturer':
        return 'Giảng viên';
      case 'admin':
        return 'Quản trị viên';
      case 'user':
        return 'Sinh viên';
      default:
        return role;
    }
  };

  const handleLogout = () => {
    // Clear all auth related data
    localStorage.removeItem('userRole');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('portal');
    sessionStorage.clear();
    // Redirect to login page
    window.location.href = '/';
  };

  return (
    <TopBar>
      <div className="content">
        <div className="user-controls">
          <div className="notifications">
            <FiBell size={18} />
            <span>Thông báo</span>
          </div>
          <div className="messages">
            <FiMessageCircle size={18} />
            <span>Tin nhắn</span>
          </div>
          <div className="user-info">
            <img src={avatarSrc} alt="User avatar" />
            <div className="user-details">
              <span className="username">{currentUser.name || currentUser.username}</span>
              {currentUser.role && (
                <span className="role-badge">
                  {getVietnameseRole(currentUser.role)}
                </span>
              )}
            </div>
          </div>
          <div className="logout" onClick={handleLogout}>
            <FiLogOut size={18} />
            <span>Đăng xuất</span>
          </div>
        </div>
      </div>
    </TopBar>
  );
};

export const ElearningHeader = ({ userRole = 'student' }) => {
  return (
    <HeaderWrapper>
      <TopBarComponent userRole={userRole} />
      <Header>
        <div className="content">
          <Logo>
            <img 
              src={logoVinhuni} 
              alt="VinhUni Logo"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/logo-vinhuni.png';
              }}
            />
            <div className="text">
              <span className="title">Hệ thống dạy học trực tuyến</span>
              <span className="subtitle">Trường Đại học Vinh</span>
            </div>
          </Logo>
          <SearchBar>
            <input type="text" placeholder="Tìm kiếm khóa học..." />
            <button>
              <FiSearch size={20} />
            </button>
          </SearchBar>
        </div>
      </Header>
      <Navigation>
        <div className="content">
          <a href="/elearning/student" className="active">TRANG CHỦ</a>
          <a href="#">TRANG CÁ NHÂN</a>
          <a href="#">KHÓA HỌC</a>
          <a href="#">HƯỚNG DẪN SỬ DỤNG</a>
        </div>
      </Navigation>
    </HeaderWrapper>
  );
};

export const ElearningFooter = () => {
  return (
    <FooterWrapper>
      <FooterContent>
        <div className="footer-section">
          <h3>THÔNG TIN</h3>
          <div className="contact-info">
            <p>Trường Đại học Vinh</p>
            <p>182 Lê Duẩn, Thành phố Vinh</p>
            <p>Điện thoại: (0238) 3855 452</p>
            <p>Email: contact@vinhuni.edu.vn</p>
          </div>
        </div>
        <div className="footer-section">
          <h3>LIÊN KẾT</h3>
          <div className="contact-info">
            <a href="#">Trang chủ Trường Đại học Vinh</a>
            <a href="#">Cổng thông tin sinh viên</a>
            <a href="#">Thư viện số</a>
            <a href="#">Hệ thống email</a>
          </div>
        </div>
        <div className="footer-section">
          <h3>ỨNG DỤNG DI ĐỘNG</h3>
          <div className="contact-info">
            <p>Tải ứng dụng trên:</p>
            <a href="#">Google Play</a>
            <a href="#">App Store</a>
          </div>
        </div>
        <div className="social-links">
          <a href="#"><FiLogOut size={20} /></a>
          <a href="#"><FiMessageCircle size={20} /></a>
          <a href="#"><FiBell size={20} /></a>
        </div>
      </FooterContent>
    </FooterWrapper>
  );
}; 
import React from 'react';
import styled from 'styled-components';
import { FiBell, FiMessageCircle, FiSearch, FiLogOut } from 'react-icons/fi';
import { DEMO_ACCOUNTS } from '../config/accounts';

const HeaderWrapper = styled.div`
  background-color: #0066b3;
  width: 100%;
`;

const TopBar = styled.div`
  background-color: #005291;
  padding: 0.5rem 0;
  
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
    gap: 1rem;
    color: white;
    font-size: 0.9rem;

    .notifications, .messages, .user-info, .logout {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      
      &:hover {
        opacity: 0.9;
      }
    }

    .logout {
      padding-left: 1rem;
      border-left: 1px solid rgba(255, 255, 255, 0.2);
    }

    .user-info img {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: white;
    }
  }
`;

const Header = styled.header`
  color: white;
  padding: 1rem 0;

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
  gap: 1rem;
  
  img {
    height: 50px;
  }
  
  .text {
    display: flex;
    flex-direction: column;
    
    .title {
      font-size: 1.2rem;
      font-weight: 500;
      text-transform: uppercase;
    }
    
    .subtitle {
      font-size: 0.9rem;
      opacity: 0.9;
    }
  }
`;

const SearchBar = styled.div`
  position: relative;
  width: 300px;

  input {
    width: 100%;
    padding: 0.5rem 1rem;
    padding-right: 2.5rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 0.9rem;

    &::placeholder {
      color: rgba(255, 255, 255, 0.7);
    }

    &:focus {
      outline: none;
      background: rgba(255, 255, 255, 0.15);
    }
  }

  button {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    padding: 0.25rem;

    &:hover {
      opacity: 0.8;
    }
  }
`;

const Navigation = styled.nav`
  background-color: rgba(0, 0, 0, 0.1);
  
  .content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
    display: flex;
    gap: 2rem;
  }

  a {
    color: white;
    text-decoration: none;
    padding: 0.75rem 0;
    font-size: 0.95rem;
    opacity: 0.9;
    border-bottom: 2px solid transparent;
    
    &:hover, &.active {
      opacity: 1;
      border-bottom-color: white;
    }
  }
`;

const Footer = styled.footer`
  background: #1e293b;
  color: white;
  padding: 3rem 0;
  margin-top: 4rem;

  .content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  .footer-section {
    h3 {
      font-size: 1.1rem;
      margin-bottom: 1rem;
      font-weight: 500;
    }

    p, a {
      color: #94a3b8;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
      text-decoration: none;

      &:hover {
        color: white;
      }
    }

    .contact-info {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
  }
`;

export const TopBarComponent = ({ userRole = 'student' }) => {
  const currentUser = userRole === 'student' ? DEMO_ACCOUNTS.student : DEMO_ACCOUNTS.lecturer;

  const handleLogout = () => {
    // Add logout logic here
    window.location.href = '/';
  };

  return (
    <TopBar>
      <div className="content">
        <div className="user-controls">
          <div className="notifications">
            <FiBell />
            <span>Thông báo</span>
          </div>
          <div className="messages">
            <FiMessageCircle />
            <span>Tin nhắn</span>
          </div>
          <div className="user-info">
            <img src="/male-avatar-placeholder.png" alt="User avatar" />
            <span>{currentUser.username}</span>
            {currentUser.role && (
              <span style={{ 
                fontSize: '0.8rem', 
                opacity: 0.8, 
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                padding: '2px 6px',
                borderRadius: '4px',
                marginLeft: '4px'
              }}>
                {currentUser.role === 'student' ? 'Sinh viên' : 
                 currentUser.role === 'lecturer' ? 'Giảng viên' : 
                 currentUser.role}
              </span>
            )}
          </div>
          <div className="logout" onClick={handleLogout}>
            <FiLogOut />
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
            <img src="/logo-vinhuni.png" alt="VinhUni Logo" />
            <div className="text">
              <span className="title">Hệ thống dạy học trực tuyến</span>
              <span className="subtitle">Trường Đại học Vinh</span>
            </div>
          </Logo>
          <SearchBar>
            <input type="text" placeholder="Tìm kiếm khóa học..." />
            <button>
              <FiSearch size={18} />
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
    <Footer>
      <div className="content">
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
      </div>
    </Footer>
  );
}; 
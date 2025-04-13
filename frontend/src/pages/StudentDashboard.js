import React, { useState } from 'react';
import styled from 'styled-components';
import { FiMessageSquare, FiX, FiBook, FiCalendar, FiClock, FiChevronRight, FiBell, FiMessageCircle, FiSearch, FiInfo } from 'react-icons/fi';
import ElearningChatInterface from '../components/ElearningChatInterface';
import { useNavigate } from 'react-router-dom';
import { courseData } from '../config/courseData';
import { DEMO_ACCOUNTS } from '../config/accounts';
import { TopBarComponent } from '../components/ElearningLayout';

const PageContainer = styled.div`
  min-height: 100vh;
  background-color: #f8fafc;
`;

const HeaderWrapper = styled.div`
  background-color: #0066b3;
  width: 100%;
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

const MainContent = styled.main`
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem;
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const ContentHeader = styled.div`
  background: white;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  h1 {
    font-size: 1.5rem;
    color: #1e293b;
    margin: 0;
  }

  .breadcrumb {
    color: #64748b;
    font-size: 0.875rem;
    margin-top: 0.5rem;
  }
`;

const CourseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const CourseCard = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }
`;

const ProgressCircle = styled.div`
  width: 80px;
  height: 80px;
  position: relative;
  border-radius: 50%;
  background: ${props => `conic-gradient(
    #ff6b00 ${props.progress}%,
    #f1f5f9 ${props.progress}% 100%
  )`};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;

  &::after {
    content: '';
    position: absolute;
    width: 90%;
    height: 90%;
    background: white;
    border-radius: 50%;
  }

  .progress-text {
    position: relative;
    z-index: 1;
    font-size: 1.2rem;
    font-weight: 500;
    color: #ff6b00;
  }
`;

const CourseContent = styled.div`
  flex: 1;
  padding: 1rem;

  h3 {
    margin: 0;
    color: #1e293b;
    font-size: 1rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }

  .course-code {
    color: #64748b;
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
  }

  .details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    color: #64748b;
    font-size: 0.875rem;

    span {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  }
`;

const Sidebar = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const SidebarCard = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const CardHeader = styled.div`
  padding: 1rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 500;
  color: #1e293b;
`;

const CardContent = styled.div`
  padding: 1rem;
`;

const EventList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  .event-item {
    display: flex;
    gap: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e2e8f0;
    
    &:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .event-icon {
      width: 40px;
      height: 40px;
      background: #f1f5f9;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #0066b3;
    }

    .event-content {
      flex: 1;

      .event-title {
        font-size: 0.875rem;
        color: #1e293b;
        margin-bottom: 0.25rem;
      }

      .event-time {
        font-size: 0.75rem;
        color: #64748b;
      }
    }
  }
`;

const Calendar = styled.div`
  .calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    color: #1e293b;
  }

  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0.5rem;
    text-align: center;
    font-size: 0.875rem;

    .day-header {
      color: #64748b;
      font-weight: 500;
      padding: 0.5rem 0;
    }

    .day {
      padding: 0.5rem 0;
      border-radius: 4px;
      cursor: pointer;

      &.today {
        background: #0066b3;
        color: white;
      }

      &.has-event {
        background: #fee2e2;
        color: #ef4444;
      }

      &:hover:not(.today) {
        background: #f1f5f9;
      }
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

const ChatbotButton = styled.button`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #0066b3;
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;

  &:hover {
    transform: scale(1.05);
    background-color: #005291;
  }
`;

const ChatbotModal = styled.div`
  position: fixed;
  bottom: ${props => props.isOpen ? '2rem' : '-100%'};
  right: 2rem;
  width: 400px;
  height: 600px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: bottom 0.3s ease;
  overflow: hidden;
  
  @media (max-width: 768px) {
    width: calc(100% - 2rem);
    height: 80vh;
  }
`;

const ChatbotHeader = styled.div`
  padding: 1rem;
  background-color: #0066b3;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.95rem;
`;

const StudentDashboard = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const navigate = useNavigate();

  // Get current user from accounts
  const currentUser = DEMO_ACCOUNTS.student; // Using the student account

  // Use courseData directly from config
  const courses = courseData.map(course => ({
    id: course.id,
    title: course.title,
    instructor: course.instructor,
    schedule: course.schedule,
    progress: course.progress,
    code: course.id
  }));

  const handleCourseClick = (course) => {
    navigate(`/elearning/student/course/${course.code}`);
  };

  const calculateProgress = (current, total) => {
    return (current / total) * 100;
  };

  return (
    <PageContainer>
      <HeaderWrapper>
        <TopBarComponent userRole="student" />
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
            <a href="#" className="active">TRANG CHỦ</a>
            <a href="#">TRANG CÁ NHÂN</a>
            <a href="#">KHÓA HỌC</a>
            <a href="#">HƯỚNG DẪN SỬ DỤNG</a>
          </div>
        </Navigation>
      </HeaderWrapper>

      <MainContent>
        <div>
          <ContentHeader>
            <h1>Các môn học</h1>
            <div className="breadcrumb">Trang chủ / Các môn học / Học kì 8</div>
          </ContentHeader>

          <CourseGrid>
            {courses.map(course => (
              <CourseCard key={course.id} onClick={() => handleCourseClick(course)}>
                <div style={{ display: 'flex', padding: '1rem' }}>
                  <ProgressCircle progress={calculateProgress(8, 15) * 100}>
                    <span className="progress-text">53%</span>
                  </ProgressCircle>
                  <CourseContent>
                    <h3>{course.title}</h3>
                    <div className="course-code">{course.code}</div>
                    <div className="details">
                      <span>
                        <FiCalendar size={14} />
                        {course.schedule}
                      </span>
                      <span>
                        <FiClock size={14} />
                        {course.progress}
                      </span>
                    </div>
                  </CourseContent>
                </div>
              </CourseCard>
            ))}
          </CourseGrid>
        </div>

        <Sidebar>
          <SidebarCard>
            <CardHeader>SỰ KIỆN SẮP DIỄN RA</CardHeader>
            <CardContent>
              <EventList>
                <div className="event-item">
                  <div className="event-icon">
                    <FiInfo size={20} />
                  </div>
                  <div className="event-content">
                    <div className="event-title">
                      Dự đoán nguy cơ mắc bệnh tiểu đường với Decision Tree và Random Forest đến hạn
                    </div>
                    <div className="event-time">Hôm nay, 23:55</div>
                  </div>
                </div>
                <div className="event-item">
                  <div className="event-icon">
                    <FiInfo size={20} />
                  </div>
                  <div className="event-content">
                    <div className="event-title">
                      Bài kiểm tra Thực hành 2 is due
                    </div>
                    <div className="event-time">Monday, 28 April, 14:33</div>
                  </div>
                </div>
              </EventList>
            </CardContent>
          </SidebarCard>

          <SidebarCard>
            <CardHeader>LỊCH</CardHeader>
            <CardContent>
              <Calendar>
                <div className="calendar-header">
                  <span>«</span>
                  <span>April 2025</span>
                  <span>»</span>
                </div>
                <div className="calendar-grid">
                  <div className="day-header">T2</div>
                  <div className="day-header">T3</div>
                  <div className="day-header">T4</div>
                  <div className="day-header">T5</div>
                  <div className="day-header">T6</div>
                  <div className="day-header">T7</div>
                  <div className="day-header">CN</div>
                  {/* Add calendar days here */}
                </div>
              </Calendar>
            </CardContent>
          </SidebarCard>
        </Sidebar>
      </MainContent>

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

      <ChatbotButton onClick={() => setIsChatOpen(true)}>
        <FiMessageSquare size={24} />
      </ChatbotButton>

      <ChatbotModal isOpen={isChatOpen}>
        <ChatbotHeader>
          <span>
            {selectedCourse 
              ? `Trợ lý học tập - ${selectedCourse.title}`
              : 'Trợ lý học tập E-learning'}
          </span>
          <button 
            onClick={() => {
              setIsChatOpen(false);
              setSelectedCourse(null);
            }}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'white', 
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <FiX size={20} />
          </button>
        </ChatbotHeader>
        <div style={{ height: 'calc(100% - 56px)' }}>
          <ElearningChatInterface selectedCourse={selectedCourse} />
        </div>
      </ChatbotModal>
    </PageContainer>
  );
};

export default StudentDashboard; 
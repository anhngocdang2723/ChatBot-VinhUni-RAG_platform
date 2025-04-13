import React, { useState } from 'react';
import styled from 'styled-components';
import { FiMessageSquare, FiX, FiBook, FiCalendar, FiClock, FiChevronRight, FiInfo } from 'react-icons/fi';
import ElearningChatInterface from '../components/ElearningChatInterface';
import { useNavigate } from 'react-router-dom';
import { courseData } from '../config/courseData';
import { DEMO_ACCOUNTS } from '../config/accounts';
import { ElearningHeader, ElearningFooter } from '../components/ElearningLayout';
import { VINH_COLORS } from '../config/colors';

const PageContainer = styled.div`
  min-height: 100vh;
  background-color: ${VINH_COLORS.backgroundAlt};
  display: flex;
  flex-direction: column;
`;

const MainContent = styled.main`
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem;
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 2rem;
  flex: 1;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const ContentHeader = styled.div`
  background: ${VINH_COLORS.white};
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px ${VINH_COLORS.shadow};

  h1 {
    font-size: 1.5rem;
    color: ${VINH_COLORS.text};
    margin: 0;
    font-weight: 600;
  }

  .breadcrumb {
    color: ${VINH_COLORS.textLight};
    font-size: 0.875rem;
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
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
  background: ${VINH_COLORS.white};
  border-radius: 8px;
  box-shadow: 0 2px 4px ${VINH_COLORS.shadow};
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 12px ${VINH_COLORS.shadowDark};
  }
`;

const ProgressCircle = styled.div`
  width: 80px;
  height: 80px;
  position: relative;
  border-radius: 50%;
  background: ${props => `conic-gradient(
    ${VINH_COLORS.accent} ${props.progress}%,
    ${VINH_COLORS.lightGray} ${props.progress}% 100%
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
    background: ${VINH_COLORS.white};
    border-radius: 50%;
  }

  .progress-text {
    position: relative;
    z-index: 1;
    font-size: 1.2rem;
    font-weight: 600;
    color: ${VINH_COLORS.accent};
  }
`;

const CourseContent = styled.div`
  flex: 1;
  padding: 1rem;

  h3 {
    margin: 0;
    color: ${VINH_COLORS.text};
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .course-code {
    color: ${VINH_COLORS.textLight};
    font-size: 0.875rem;
    margin-bottom: 0.75rem;
    font-weight: 500;
  }

  .details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    color: ${VINH_COLORS.textLight};
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
  background: ${VINH_COLORS.white};
  border-radius: 8px;
  box-shadow: 0 2px 4px ${VINH_COLORS.shadow};
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 8px ${VINH_COLORS.shadowDark};
  }
`;

const CardHeader = styled.div`
  padding: 1rem 1.25rem;
  background: ${VINH_COLORS.backgroundAlt};
  border-bottom: 1px solid ${VINH_COLORS.border};
  font-weight: 600;
  color: ${VINH_COLORS.text};
  font-size: 0.95rem;
`;

const CardContent = styled.div`
  padding: 1rem 1.25rem;
`;

const EventList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  .event-item {
    display: flex;
    gap: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid ${VINH_COLORS.border};
    
    &:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .event-icon {
      width: 40px;
      height: 40px;
      background: ${VINH_COLORS.backgroundAlt};
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${VINH_COLORS.primary};
    }

    .event-content {
      flex: 1;

      .event-title {
        font-size: 0.875rem;
        color: ${VINH_COLORS.text};
        margin-bottom: 0.25rem;
        font-weight: 500;
      }

      .event-time {
        font-size: 0.75rem;
        color: ${VINH_COLORS.textLight};
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
    color: ${VINH_COLORS.text};
    font-weight: 500;
  }

  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0.5rem;
    text-align: center;
    font-size: 0.875rem;

    .day-header {
      color: ${VINH_COLORS.textLight};
      font-weight: 500;
      padding: 0.5rem 0;
    }

    .day {
      padding: 0.5rem 0;
      border-radius: 4px;
      cursor: pointer;

      &.today {
        background: ${VINH_COLORS.primary};
        color: ${VINH_COLORS.white};
      }

      &.has-event {
        background: ${VINH_COLORS.errorLight};
        color: ${VINH_COLORS.error};
      }

      &:hover:not(.today) {
        background: ${VINH_COLORS.backgroundAlt};
      }
    }
  }
`;

const ChatbotButton = styled.button`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: ${VINH_COLORS.primary};
  color: ${VINH_COLORS.white};
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px ${VINH_COLORS.shadowDark};
  transition: all 0.3s;
  z-index: 100;

  &:hover {
    transform: scale(1.1);
    background-color: ${VINH_COLORS.primaryDark};
  }
`;

const ChatbotModal = styled.div`
  position: fixed;
  bottom: ${props => props.isOpen ? '2rem' : '-100%'};
  right: 2rem;
  width: 400px;
  height: 600px;
  background: ${VINH_COLORS.white};
  border-radius: 12px;
  box-shadow: 0 4px 20px ${VINH_COLORS.shadowDark};
  transition: bottom 0.3s ease;
  overflow: hidden;
  z-index: 1000;
  
  @media (max-width: 768px) {
    width: calc(100% - 2rem);
    height: 80vh;
  }
`;

const ChatbotHeader = styled.div`
  padding: 1rem;
  background-color: ${VINH_COLORS.primary};
  color: ${VINH_COLORS.white};
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.95rem;
  font-weight: 500;

  .close-button {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    background: none;
    border: none;
    color: white;
    cursor: pointer;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }
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
      <ElearningHeader userRole="student" />

      <MainContent>
        <div>
          <ContentHeader>
            <h1>Các môn học</h1>
            <div className="breadcrumb">
              <span>Trang chủ</span>
              <FiChevronRight size={14} />
              <span>Các môn học</span>
              <FiChevronRight size={14} />
              <span>Học kì 8</span>
            </div>
          </ContentHeader>

          <CourseGrid>
            {courses.map(course => (
              <CourseCard key={course.id} onClick={() => handleCourseClick(course)}>
                <div style={{ display: 'flex', padding: '1.25rem' }}>
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

      <ElearningFooter />

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
            className="close-button"
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
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { ElearningHeader, ElearningFooter } from '../components/ElearningLayout';
import { courseData } from '../config/courseData';
import { VINH_COLORS } from '../config/colors';
import { FiBook, FiUsers, FiCalendar, FiClock, FiEdit, FiEye, FiPlus } from 'react-icons/fi';

const DashboardContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: ${VINH_COLORS.backgroundAlt};
`;

const MainContent = styled.main`
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`;

const WelcomeSection = styled.section`
  background: ${VINH_COLORS.white};
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px ${VINH_COLORS.shadow};
  margin-bottom: 2rem;
  border: 1px solid ${VINH_COLORS.border};
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 6px 16px ${VINH_COLORS.shadowDark};
    transform: translateY(-2px);
  }

  h1 {
    color: ${VINH_COLORS.primary};
    margin-bottom: 1rem;
    font-weight: 600;
    font-size: 1.75rem;
  }

  p {
    color: ${VINH_COLORS.text};
    line-height: 1.6;
    font-size: 1rem;
  }
`;

const CoursesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

const CourseCard = styled.div`
  background: ${VINH_COLORS.white};
  border-radius: 12px;
  box-shadow: 0 4px 12px ${VINH_COLORS.shadow};
  padding: 1.5rem;
  transition: all 0.3s ease;
  border: 1px solid ${VINH_COLORS.border};
  display: flex;
  flex-direction: column;
  height: 100%;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 16px ${VINH_COLORS.shadowDark};
  }

  h3 {
    color: ${VINH_COLORS.primary};
    margin-bottom: 1rem;
    font-weight: 600;
    font-size: 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .course-info {
    color: ${VINH_COLORS.text};
    margin-bottom: 1.5rem;
    flex: 1;

    p {
      margin: 0.75rem 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.95rem;
      
      svg {
        color: ${VINH_COLORS.primary};
        flex-shrink: 0;
      }
    }
  }

  .actions {
    display: flex;
    gap: 1rem;
    margin-top: auto;
  }

  button {
    padding: 0.75rem 1.25rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.95rem;

    &.manage {
      background-color: ${VINH_COLORS.primary};
      color: ${VINH_COLORS.white};

      &:hover {
        background-color: ${VINH_COLORS.primaryDark};
        transform: translateY(-2px);
      }
    }

    &.view {
      background-color: ${VINH_COLORS.backgroundAlt};
      color: ${VINH_COLORS.text};

      &:hover {
        background-color: ${VINH_COLORS.lightGray};
        transform: translateY(-2px);
      }
    }
  }
`;

const AddCourseCard = styled(CourseCard)`
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed ${VINH_COLORS.border};
  background-color: ${VINH_COLORS.backgroundAlt};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: ${VINH_COLORS.primary};
    background-color: ${VINH_COLORS.white};
  }

  .add-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    color: ${VINH_COLORS.textLight};
    
    svg {
      font-size: 2.5rem;
      color: ${VINH_COLORS.primary};
    }
    
    span {
      font-size: 1.1rem;
      font-weight: 500;
    }
  }
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  
  h2 {
    color: ${VINH_COLORS.text};
    font-weight: 600;
    font-size: 1.5rem;
  }
  
  .header-actions {
    display: flex;
    gap: 1rem;
  }
  
  button {
    padding: 0.75rem 1.25rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: ${VINH_COLORS.primary};
    color: ${VINH_COLORS.white};
    
    &:hover {
      background-color: ${VINH_COLORS.primaryDark};
      transform: translateY(-2px);
    }
    
    svg {
      font-size: 1.1rem;
    }
  }
`;

const LecturerDashboard = () => {
  const navigate = useNavigate();

  const handleManageCourse = (courseId) => {
    navigate(`/elearning/lecturer/course/${courseId}`);
  };
  
  const handleAddCourse = () => {
    // TODO: Implement add course functionality
    console.log('Add new course');
  };

  return (
    <DashboardContainer>
      <ElearningHeader userRole="lecturer" />
      <MainContent>
        <WelcomeSection>
          <h1>Xin chào, Giảng viên!</h1>
          <p>
            Đây là trang quản lý khóa học của bạn. Bạn có thể xem danh sách các khóa học đang giảng dạy,
            quản lý nội dung khóa học, và theo dõi tiến độ học tập của sinh viên.
          </p>
        </WelcomeSection>

        <DashboardHeader>
          <h2>Khóa học của tôi</h2>
          <div className="header-actions">
            <button onClick={handleAddCourse}>
              <FiPlus />
              <span>Thêm khóa học mới</span>
            </button>
          </div>
        </DashboardHeader>

        <CoursesGrid>
          {courseData.map(course => (
            <CourseCard key={course.id}>
              <h3>
                <FiBook />
                {course.title}
              </h3>
              <div className="course-info">
                <p>
                  <FiBook />
                  Mã môn: {course.id}
                </p>
                <p>
                  <FiUsers />
                  Giảng viên: {course.instructor}
                </p>
                <p>
                  <FiCalendar />
                  Lịch học: {course.schedule}
                </p>
                <p>
                  <FiClock />
                  Tiến độ: {course.progress}
                </p>
                <p>Số chương: {course.chapters.length}</p>
                <p>Số bài tập: {course.exercises.length}</p>
              </div>
              <div className="actions">
                <button className="manage" onClick={() => handleManageCourse(course.id)}>
                  <FiEdit />
                  Quản lý khóa học
                </button>
                <button className="view">
                  <FiEye />
                  Xem chi tiết
                </button>
              </div>
            </CourseCard>
          ))}
          
          <AddCourseCard onClick={handleAddCourse}>
            <div className="add-content">
              <FiPlus />
              <span>Thêm khóa học mới</span>
            </div>
          </AddCourseCard>
        </CoursesGrid>
      </MainContent>
      <ElearningFooter />
    </DashboardContainer>
  );
};

export default LecturerDashboard; 
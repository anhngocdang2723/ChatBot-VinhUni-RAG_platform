import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { ElearningHeader, ElearningFooter } from '../components/ElearningLayout';
import { courseData } from '../config/courseData';

const DashboardContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const MainContent = styled.main`
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`;

const WelcomeSection = styled.section`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;

  h1 {
    color: #0066b3;
    margin-bottom: 1rem;
  }

  p {
    color: #666;
    line-height: 1.6;
  }
`;

const CoursesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

const CourseCard = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }

  h3 {
    color: #0066b3;
    margin-bottom: 1rem;
  }

  .course-info {
    color: #666;
    margin-bottom: 1rem;

    p {
      margin: 0.5rem 0;
    }
  }

  .actions {
    display: flex;
    gap: 1rem;
  }

  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;

    &.manage {
      background-color: #0066b3;
      color: white;

      &:hover {
        background-color: #005291;
      }
    }

    &.view {
      background-color: #f0f0f0;
      color: #333;

      &:hover {
        background-color: #e0e0e0;
      }
    }
  }
`;

const LecturerDashboard = () => {
  const navigate = useNavigate();

  const handleManageCourse = (courseId) => {
    navigate(`/elearning/lecturer/course/${courseId}`);
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

        <CoursesGrid>
          {courseData.map(course => (
            <CourseCard key={course.id}>
              <h3>{course.title}</h3>
              <div className="course-info">
                <p>Mã môn: {course.id}</p>
                <p>Giảng viên: {course.instructor}</p>
                <p>Lịch học: {course.schedule}</p>
                <p>Tiến độ: {course.progress}</p>
                <p>Số chương: {course.chapters.length}</p>
                <p>Số bài tập: {course.exercises.length}</p>
              </div>
              <div className="actions">
                <button className="manage" onClick={() => handleManageCourse(course.id)}>
                  Quản lý khóa học
                </button>
                <button className="view">
                  Xem chi tiết
                </button>
              </div>
            </CourseCard>
          ))}
        </CoursesGrid>
      </MainContent>
      <ElearningFooter />
    </DashboardContainer>
  );
};

export default LecturerDashboard; 
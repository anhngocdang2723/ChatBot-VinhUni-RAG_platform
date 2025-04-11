import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { FiBook, FiFileText, FiMessageCircle, FiInfo, FiChevronRight, FiDownload, FiX, FiBookOpen, FiCalendar, FiClock, FiCheckCircle } from 'react-icons/fi';
import { courseData } from '../config/courseData';
import ElearningChatInterface from '../components/ElearningChatInterface';
import { ElearningHeader, ElearningFooter } from '../components/ElearningLayout';

// Log courseData when the module loads
console.log('Loading courseData:', courseData);

const PageContainer = styled.div`
  min-height: 100vh;
  background-color: #f8fafc;
  display: flex;
  flex-direction: column;
`;

const CourseHeader = styled.div`
  background: white;
  padding: 1.5rem 0;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  .content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  .breadcrumb {
    color: #64748b;
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    a {
      color: #0066b3;
      text-decoration: none;
      &:hover {
        text-decoration: underline;
      }
    }
  }

  h1 {
    color: #1e293b;
    font-size: 1.75rem;
    margin: 0;
    margin-bottom: 1rem;
    font-weight: 600;
  }

  .course-info {
    display: flex;
    gap: 2rem;
    color: #64748b;
    font-size: 0.875rem;

    span {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #f8fafc;
      border-radius: 6px;
      transition: all 0.2s;

      &:hover {
        background: #f1f5f9;
        color: #0066b3;
      }
    }
  }
`;

const MainContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const ContentSection = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 1.5rem;
`;

const SectionHeader = styled.div`
  padding: 1rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 500;
  color: #1e293b;
`;

const ChapterList = styled.div`
  .chapter {
    border-bottom: 1px solid #e2e8f0;
    
    &:last-child {
      border-bottom: none;
    }
  }
`;

const ChapterHeader = styled.div`
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 6px;

  &:hover {
    background-color: #f8fafc;
  }

  .chapter-info {
    h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 500;
      color: #1e293b;
      margin-bottom: 0.25rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .chapter-number {
        background: #0066b3;
        color: white;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.875rem;
      }
    }

    .description {
      font-size: 0.875rem;
      color: #64748b;
    }
  }

  .toggle-icon {
    color: #94a3b8;
    transition: transform 0.2s;
    
    &.expanded {
      transform: rotate(90deg);
      color: #0066b3;
    }
  }
`;

const MaterialList = styled.div`
  padding: 0 1rem 1rem 3.5rem;

  .material-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    color: #64748b;
    font-size: 0.875rem;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s;
    text-decoration: none;

    &:hover {
      background: #f1f5f9;
      color: #0066b3;
      border-color: #e2e8f0;
    }

    .material-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: #f8fafc;
      border-radius: 6px;
      color: #0066b3;
      transition: all 0.2s;
    }

    &:hover .material-icon {
      background: #0066b3;
      color: white;
    }

    .download-icon {
      margin-left: auto;
      opacity: 0;
      transition: opacity 0.2s;
      color: #0066b3;
    }

    &:hover .download-icon {
      opacity: 1;
    }
  }
`;

const Sidebar = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const SidebarCard = styled(ContentSection)`
  margin-bottom: 0;
`;

const AnnouncementList = styled.div`
  .announcement {
    padding: 1rem;
    border-bottom: 1px solid #e2e8f0;

    &:last-child {
      border-bottom: none;
    }

    .title {
      font-weight: 500;
      color: #1e293b;
      margin-bottom: 0.25rem;
    }

    .content {
      font-size: 0.875rem;
      color: #64748b;
      margin-bottom: 0.5rem;
    }

    .date {
      font-size: 0.75rem;
      color: #94a3b8;
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
  background-color: #0066b3;
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 102, 179, 0.3);
  transition: all 0.3s;

  &:hover {
    transform: scale(1.1);
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
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  transition: bottom 0.3s ease;
  overflow: hidden;
  z-index: 1000;
  
  @media (max-width: 768px) {
    width: calc(100% - 2rem);
    height: 80vh;
  }
`;

const ViewMaterialModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: white;
  z-index: 1000;
  display: ${props => props.isOpen ? 'block' : 'none'};
  
  .modal-header {
    padding: 1rem;
    background-color: #0066b3;
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .close-button {
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 50%;
      transition: background-color 0.2s;
      
      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
    }
  }
  
  .modal-content {
    height: calc(100vh - 60px);
    width: 100%;
    border: none;
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

  .close-button {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }
`;

const CoursePage = () => {
  const { courseId } = useParams();
  const [expandedChapters, setExpandedChapters] = useState({});
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  
  console.log('courseId:', courseId);
  console.log('courseData:', courseData);
  const course = courseData[courseId];
  console.log('course:', course);

  if (!course) {
    return <div>Không tìm thấy khóa học</div>;
  }

  const toggleChapter = (chapterId) => {
    setExpandedChapters(prev => ({
      ...prev,
      [chapterId]: !prev[chapterId]
    }));
  };

  const handleMaterialClick = (material) => {
    setSelectedMaterial(material);
  };

  const closeMaterialModal = () => {
    setSelectedMaterial(null);
  };

  return (
    <PageContainer>
      <ElearningHeader />
      
      <CourseHeader>
        <div className="content">
          <div className="breadcrumb">
            <a href="/elearning/student">Trang chủ</a>
            <FiChevronRight size={14} />
            <a href="/elearning/student">Khóa học</a>
            <FiChevronRight size={14} />
            <span>{course.title}</span>
          </div>
          <h1>{course.title}</h1>
          <div className="course-info">
            <span>
              <FiBook />
              {course.code}
            </span>
            <span>
              <FiInfo />
              {course.instructor}
            </span>
            <span>
              <FiCalendar />
              {course.schedule}
            </span>
            <span>
              <FiClock />
              {course.progress}
            </span>
          </div>
        </div>
      </CourseHeader>

      <MainContent>
        <div>
          <ContentSection>
            <SectionHeader>Nội dung môn học</SectionHeader>
            <ChapterList>
              {course.chapters.map(chapter => (
                <div key={chapter.id} className="chapter">
                  <ChapterHeader onClick={() => toggleChapter(chapter.id)}>
                    <div className="chapter-info">
                      <h3>
                        <span className="chapter-number">{chapter.id}</span>
                        {chapter.title}
                      </h3>
                      <div className="description">{chapter.description}</div>
                    </div>
                    <FiChevronRight 
                      className={`toggle-icon ${expandedChapters[chapter.id] ? 'expanded' : ''}`} 
                      size={20} 
                    />
                  </ChapterHeader>
                  {expandedChapters[chapter.id] && (
                    <MaterialList>
                      {chapter.materials.map(material => (
                        <div
                          key={material.id}
                          className="material-item"
                          onClick={() => handleMaterialClick(material)}
                        >
                          <div className="material-icon">
                            <FiFileText size={16} />
                          </div>
                          <span>{material.title}</span>
                          <FiDownload className="download-icon" size={16} />
                        </div>
                      ))}
                    </MaterialList>
                  )}
                </div>
              ))}
            </ChapterList>
          </ContentSection>

          <ContentSection>
            <SectionHeader>Bài tập & Dự án</SectionHeader>
            <ChapterList>
              {course.exercises.map(exercise => (
                <div key={exercise.id} className="chapter">
                  <ChapterHeader>
                    <div className="chapter-info">
                      <h3>
                        <FiBookOpen size={20} style={{ color: '#0066b3' }} />
                        {exercise.title}
                      </h3>
                      <div className="description">
                        {exercise.description}
                        <div style={{ color: '#ef4444', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FiClock size={14} />
                          Hạn nộp: {new Date(exercise.dueDate).toLocaleString('vi-VN')}
                        </div>
                      </div>
                    </div>
                    <FiChevronRight size={20} style={{ color: '#94a3b8' }} />
                  </ChapterHeader>
                </div>
              ))}
            </ChapterList>
          </ContentSection>
        </div>

        <Sidebar>
          <SidebarCard>
            <SectionHeader>Thông báo môn học</SectionHeader>
            <AnnouncementList>
              {course.announcements.map((announcement, index) => (
                <div key={index} className="announcement">
                  <div className="title">{announcement.title}</div>
                  <div className="content">{announcement.content}</div>
                  <div className="date">
                    {new Date(announcement.date).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              ))}
            </AnnouncementList>
          </SidebarCard>

          <SidebarCard>
            <SectionHeader>Diễn đàn thảo luận</SectionHeader>
            <AnnouncementList>
              {course.discussions.map(discussion => (
                <div key={discussion.id} className="announcement">
                  <div className="title">{discussion.title}</div>
                  <div className="content">{discussion.description}</div>
                </div>
              ))}
            </AnnouncementList>
          </SidebarCard>
        </Sidebar>
      </MainContent>

      <ElearningFooter />

      <ChatbotButton onClick={() => setIsChatOpen(true)}>
        <FiMessageCircle size={24} />
      </ChatbotButton>

      <ChatbotModal isOpen={isChatOpen}>
        <ChatbotHeader>
          <span>Trợ lý học tập - {course.title}</span>
          <button 
            onClick={() => setIsChatOpen(false)}
            className="close-button"
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'white', 
              cursor: 'pointer',
            }}
          >
            <FiX size={20} />
          </button>
        </ChatbotHeader>
        <div style={{ height: 'calc(100% - 56px)' }}>
          <ElearningChatInterface selectedCourse={course} />
        </div>
      </ChatbotModal>

      <ViewMaterialModal isOpen={!!selectedMaterial}>
        {selectedMaterial && (
          <>
            <div className="modal-header">
              <h3>{selectedMaterial.title}</h3>
              <div className="close-button" onClick={closeMaterialModal}>
                <FiX size={24} />
              </div>
            </div>
            <div style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
              <iframe 
                className="modal-content"
                src={selectedMaterial.url}
                title={selectedMaterial.title}
                style={{ flex: 2, borderRight: '1px solid #e2e8f0' }}
              />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <ElearningChatInterface selectedCourse={course} />
              </div>
            </div>
          </>
        )}
      </ViewMaterialModal>
    </PageContainer>
  );
};

export default CoursePage; 
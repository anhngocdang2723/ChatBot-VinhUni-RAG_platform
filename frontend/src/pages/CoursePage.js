import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { FiBook, FiFileText, FiMessageCircle, FiInfo, FiChevronRight, FiDownload, FiX, FiBookOpen, FiCalendar, FiClock, FiCheckCircle } from 'react-icons/fi';
import { courseData } from '../config/courseData';
import ElearningChatInterface from '../components/ElearningChatInterface';
import { ElearningHeader, ElearningFooter } from '../components/ElearningLayout';
import { VINH_COLORS } from '../config/colors';

// Log courseData when the module loads
console.log('Loading courseData:', courseData);

const PageContainer = styled.div`
  min-height: 100vh;
  background-color: ${VINH_COLORS.backgroundAlt};
  display: flex;
  flex-direction: column;
`;

const CourseHeader = styled.div`
  background: ${VINH_COLORS.white};
  padding: 1.5rem 0;
  border-bottom: 1px solid ${VINH_COLORS.border};
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px ${VINH_COLORS.shadow};

  .content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  .breadcrumb {
    color: ${VINH_COLORS.textLight};
    font-size: 0.875rem;
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    a {
      color: ${VINH_COLORS.primary};
      text-decoration: none;
      transition: all 0.2s ease;
      
      &:hover {
        color: ${VINH_COLORS.primaryDark};
        text-decoration: underline;
      }
    }
  }

  h1 {
    color: ${VINH_COLORS.text};
    font-size: 1.75rem;
    margin: 0;
    margin-bottom: 1.25rem;
    font-weight: 600;
  }

  .course-info {
    display: flex;
    gap: 1.5rem;
    color: ${VINH_COLORS.textLight};
    font-size: 0.875rem;
    flex-wrap: wrap;

    span {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: ${VINH_COLORS.backgroundAlt};
      border-radius: 6px;
      transition: all 0.2s ease;
      font-weight: 500;

      &:hover {
        background: ${VINH_COLORS.lightGray};
        color: ${VINH_COLORS.primary};
        transform: translateY(-2px);
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
  flex: 1;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const ContentSection = styled.div`
  background: ${VINH_COLORS.white};
  border-radius: 8px;
  box-shadow: 0 2px 4px ${VINH_COLORS.shadow};
  overflow: hidden;
  margin-bottom: 1.5rem;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 8px ${VINH_COLORS.shadowDark};
  }
`;

const SectionHeader = styled.div`
  padding: 1rem 1.25rem;
  background: ${VINH_COLORS.backgroundAlt};
  border-bottom: 1px solid ${VINH_COLORS.border};
  font-weight: 600;
  color: ${VINH_COLORS.text};
  font-size: 0.95rem;
`;

const ChapterList = styled.div`
  .chapter {
    border-bottom: 1px solid ${VINH_COLORS.border};
    
    &:last-child {
      border-bottom: none;
    }
  }
`;

const ChapterHeader = styled.div`
  padding: 1rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 6px;

  &:hover {
    background-color: ${VINH_COLORS.backgroundAlt};
  }

  .chapter-info {
    h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: ${VINH_COLORS.text};
      margin-bottom: 0.25rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .chapter-number {
        background: ${VINH_COLORS.primary};
        color: ${VINH_COLORS.white};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.875rem;
        font-weight: 600;
      }
    }

    .description {
      font-size: 0.875rem;
      color: ${VINH_COLORS.textLight};
    }
  }

  .toggle-icon {
    color: ${VINH_COLORS.textLighter};
    transition: transform 0.2s ease;
    
    &.expanded {
      transform: rotate(90deg);
      color: ${VINH_COLORS.primary};
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
    color: ${VINH_COLORS.textLight};
    font-size: 0.875rem;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s ease;
    text-decoration: none;

    &:hover {
      background: ${VINH_COLORS.lightGray};
      color: ${VINH_COLORS.primary};
      transform: translateX(3px);
    }

    .material-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: ${VINH_COLORS.backgroundAlt};
      border-radius: 6px;
      color: ${VINH_COLORS.primary};
      transition: all 0.2s ease;
    }

    &:hover .material-icon {
      background: ${VINH_COLORS.primary};
      color: ${VINH_COLORS.white};
    }

    .download-icon {
      margin-left: auto;
      opacity: 0;
      transition: opacity 0.2s ease;
      color: ${VINH_COLORS.primary};
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
    padding: 1rem 1.25rem;
    border-bottom: 1px solid ${VINH_COLORS.border};

    &:last-child {
      border-bottom: none;
    }

    .title {
      font-weight: 600;
      color: ${VINH_COLORS.text};
      margin-bottom: 0.5rem;
      font-size: 0.95rem;
    }

    .content {
      font-size: 0.875rem;
      color: ${VINH_COLORS.textLight};
      margin-bottom: 0.75rem;
      line-height: 1.5;
    }

    .date {
      font-size: 0.75rem;
      color: ${VINH_COLORS.textLighter};
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
  transition: all 0.3s ease;
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

const ViewMaterialModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${VINH_COLORS.white};
  z-index: 1000;
  display: ${props => props.isOpen ? 'block' : 'none'};
  
  .modal-header {
    padding: 1rem 1.25rem;
    background-color: ${VINH_COLORS.primary};
    color: ${VINH_COLORS.white};
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 500;
    
    h3 {
      margin: 0;
      font-size: 1.1rem;
    }
    
    .close-button {
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 50%;
      transition: background-color 0.2s ease;
      
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
  padding: 1rem 1.25rem;
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
    transition: all 0.2s ease;
    background: none;
    border: none;
    color: white;
    cursor: pointer;

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
  
  // Find course by matching id
  const course = courseData.find(course => course.id === courseId);

  if (!course) {
    console.log('Course not found:', courseId);
    console.log('Available courses:', courseData.map(c => c.id));
    return <div>Không tìm thấy khóa học</div>;
  }

  // Format collection name
  const collectionName = `course_${courseId.toLowerCase()}`;
  course.collectionName = collectionName;

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
      <ElearningHeader userRole="student" />
      
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
              {course.id}
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
                        <FiBookOpen size={20} style={{ color: VINH_COLORS.primary }} />
                        {exercise.title}
                      </h3>
                      <div className="description">
                        {exercise.description}
                        <div style={{ color: VINH_COLORS.error, marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                          <FiClock size={14} />
                          Hạn nộp: {new Date(exercise.dueDate).toLocaleString('vi-VN')}
                        </div>
                      </div>
                    </div>
                    <FiChevronRight size={20} style={{ color: VINH_COLORS.textLighter }} />
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
                style={{ flex: 2, borderRight: `1px solid ${VINH_COLORS.border}` }}
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
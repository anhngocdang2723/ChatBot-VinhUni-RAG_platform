import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FiBook, FiFileText, FiMessageCircle, FiInfo, FiChevronRight, FiDownload, FiX, FiBookOpen, FiCalendar, FiClock, FiCheckCircle, FiPlus, FiUpload, FiEdit2, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import { courseData } from '../config/courseData';
import { ElearningHeader, ElearningFooter } from '../components/ElearningLayout';
import { useApi } from '../context/ApiContext';
import { toast } from 'react-toastify';
import { VINH_COLORS } from '../config/colors';

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
  box-shadow: 0 4px 12px ${VINH_COLORS.shadow};

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
      transition: all 0.3s ease;
      
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
    margin-bottom: 1rem;
    font-weight: 600;
  }

  .course-info {
    display: flex;
    gap: 2rem;
    color: ${VINH_COLORS.textLight};
    font-size: 0.875rem;

    span {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: ${VINH_COLORS.backgroundAlt};
      border-radius: 8px;
      transition: all 0.3s ease;
      border: 1px solid ${VINH_COLORS.border};

      &:hover {
        background: ${VINH_COLORS.lightGray};
        color: ${VINH_COLORS.primary};
        transform: translateY(-2px);
      }
      
      svg {
        color: ${VINH_COLORS.primary};
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
  background: ${VINH_COLORS.white};
  border-radius: 12px;
  box-shadow: 0 4px 12px ${VINH_COLORS.shadow};
  overflow: hidden;
  margin-bottom: 1.5rem;
  border: 1px solid ${VINH_COLORS.border};
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 6px 16px ${VINH_COLORS.shadowDark};
  }
`;

const SectionHeader = styled.div`
  padding: 1.25rem;
  background: ${VINH_COLORS.backgroundAlt};
  border-bottom: 1px solid ${VINH_COLORS.border};
  font-weight: 500;
  color: ${VINH_COLORS.text};
  display: flex;
  justify-content: space-between;
  align-items: center;

  .actions {
    display: flex;
    gap: 0.75rem;
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

    &.primary {
      background-color: ${VINH_COLORS.primary};
      color: ${VINH_COLORS.white};

      &:hover {
        background-color: ${VINH_COLORS.primaryDark};
        transform: translateY(-2px);
      }
    }

    &.secondary {
      background-color: ${VINH_COLORS.backgroundAlt};
      color: ${VINH_COLORS.text};

      &:hover {
        background-color: ${VINH_COLORS.lightGray};
        transform: translateY(-2px);
      }
    }
  }
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
  padding: 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;

  &:hover {
    background-color: ${VINH_COLORS.backgroundAlt};
  }

  .chapter-info {
    h3 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 500;
      color: ${VINH_COLORS.text};
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .chapter-number {
        background: ${VINH_COLORS.primary};
        color: ${VINH_COLORS.white};
        width: 28px;
        height: 28px;
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

  .chapter-actions {
    display: flex;
    gap: 0.75rem;

    button {
      padding: 0.5rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;

      &.edit {
        background-color: ${VINH_COLORS.backgroundAlt};
        color: ${VINH_COLORS.text};

        &:hover {
          background-color: ${VINH_COLORS.lightGray};
          transform: translateY(-2px);
        }
      }

      &.delete {
        background-color: ${VINH_COLORS.errorLight};
        color: ${VINH_COLORS.error};

        &:hover {
          background-color: ${VINH_COLORS.error};
          color: ${VINH_COLORS.white};
          transform: translateY(-2px);
        }
      }
    }
  }
`;

const MaterialList = styled.div`
  padding: 0 1rem 1.25rem 3.5rem;

  .material-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    color: ${VINH_COLORS.textLight};
    font-size: 0.875rem;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.3s ease;
    text-decoration: none;
    border: 1px solid transparent;

    &:hover {
      background: ${VINH_COLORS.backgroundAlt};
      color: ${VINH_COLORS.primary};
      border-color: ${VINH_COLORS.border};
      transform: translateX(4px);
    }

    .material-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: ${VINH_COLORS.backgroundAlt};
      border-radius: 8px;
      color: ${VINH_COLORS.primary};
      transition: all 0.3s ease;
    }

    &:hover .material-icon {
      background: ${VINH_COLORS.primary};
      color: ${VINH_COLORS.white};
    }

    .material-actions {
      margin-left: auto;
      display: flex;
      gap: 0.5rem;

      button {
        padding: 0.5rem;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;

        &.edit {
          background-color: ${VINH_COLORS.backgroundAlt};
          color: ${VINH_COLORS.text};

          &:hover {
            background-color: ${VINH_COLORS.lightGray};
            transform: translateY(-2px);
          }
        }

        &.delete {
          background-color: ${VINH_COLORS.errorLight};
          color: ${VINH_COLORS.error};

          &:hover {
            background-color: ${VINH_COLORS.error};
            color: ${VINH_COLORS.white};
            transform: translateY(-2px);
          }
        }
      }
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
    padding: 1.25rem;
    border-bottom: 1px solid ${VINH_COLORS.border};

    &:last-child {
      border-bottom: none;
    }

    .title {
      font-weight: 500;
      color: ${VINH_COLORS.text};
      margin-bottom: 0.5rem;
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

    .announcement-actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 0.75rem;

      button {
        padding: 0.5rem;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;

        &.edit {
          background-color: ${VINH_COLORS.backgroundAlt};
          color: ${VINH_COLORS.text};

          &:hover {
            background-color: ${VINH_COLORS.lightGray};
            transform: translateY(-2px);
          }
        }

        &.delete {
          background-color: ${VINH_COLORS.errorLight};
          color: ${VINH_COLORS.error};

          &:hover {
            background-color: ${VINH_COLORS.error};
            color: ${VINH_COLORS.white};
            transform: translateY(-2px);
          }
        }
      }
    }
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: ${VINH_COLORS.white};
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 24px ${VINH_COLORS.shadowDark};
  border: 1px solid ${VINH_COLORS.border};
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${VINH_COLORS.border};

  h2 {
    margin: 0;
    color: ${VINH_COLORS.text};
    font-weight: 600;
    font-size: 1.5rem;
  }

  button {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${VINH_COLORS.textLight};
    transition: all 0.3s ease;

    &:hover {
      color: ${VINH_COLORS.error};
      transform: rotate(90deg);
    }
  }
`;

const UploadArea = styled.div`
  border: 2px dashed ${VINH_COLORS.border};
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  margin-bottom: 1.5rem;
  transition: all 0.3s ease;
  background-color: ${VINH_COLORS.backgroundAlt};

  &:hover {
    border-color: ${VINH_COLORS.primary};
    background-color: ${VINH_COLORS.white};
  }

  input {
    display: none;
  }
  
  svg {
    font-size: 2.5rem;
    color: ${VINH_COLORS.primary};
    margin-bottom: 1rem;
  }
  
  p {
    color: ${VINH_COLORS.text};
    margin-bottom: 0.5rem;
    font-size: 1rem;
  }
  
  .file-types {
    color: ${VINH_COLORS.textLight};
    font-size: 0.875rem;
  }
`;

const FileList = styled.div`
  margin-top: 1rem;
`;

const FileItem = styled.div`
  display: flex;
  align-items: center;
  padding: 0.75rem;
  background: ${VINH_COLORS.backgroundAlt};
  border-radius: 8px;
  margin-bottom: 0.75rem;
  border: 1px solid ${VINH_COLORS.border};
  transition: all 0.3s ease;

  &:hover {
    background: ${VINH_COLORS.white};
    transform: translateX(4px);
  }

  .file-icon {
    margin-right: 0.75rem;
    color: ${VINH_COLORS.primary};
  }

  .file-name {
    flex: 1;
    color: ${VINH_COLORS.text};
    font-weight: 500;
  }

  .file-size {
    color: ${VINH_COLORS.textLight};
    font-size: 0.875rem;
    margin-right: 1rem;
  }

  button {
    padding: 0.25rem;
    background: none;
    border: none;
    color: ${VINH_COLORS.error};
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      color: ${VINH_COLORS.errorDark};
      transform: scale(1.1);
    }
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background-color: ${VINH_COLORS.backgroundAlt};
  border-radius: 4px;
  overflow: hidden;
  margin-top: 1rem;
`;

const ProgressFill = styled.div`
  width: ${props => props.progress}%;
  height: 100%;
  background-color: ${VINH_COLORS.primary};
  transition: width 0.3s ease;
`;

const StatusMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.75rem;
  color: ${props => {
    switch (props.status) {
      case 'success': return VINH_COLORS.success;
      case 'error': return VINH_COLORS.error;
      case 'processing': return VINH_COLORS.primary;
      default: return VINH_COLORS.textLight;
    }
  }};
  font-size: 0.875rem;
  font-weight: 500;

  svg {
    ${props => props.status === 'processing' && `
      animation: spin 1s linear infinite;
      @keyframes spin {
        100% { transform: rotate(360deg); }
      }
    `}
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
  
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
    
    &.cancel {
      background-color: ${VINH_COLORS.backgroundAlt};
      color: ${VINH_COLORS.text};
      
      &:hover {
        background-color: ${VINH_COLORS.lightGray};
        transform: translateY(-2px);
      }
    }
    
    &.upload {
      background-color: ${VINH_COLORS.primary};
      color: ${VINH_COLORS.white};
      
      &:hover {
        background-color: ${VINH_COLORS.primaryDark};
        transform: translateY(-2px);
      }
      
      &:disabled {
        background-color: ${VINH_COLORS.lightGray};
        cursor: not-allowed;
        transform: none;
      }
    }
  }
`;

const LecturerCoursePage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { uploadDocument } = useApi();
  const [expandedChapters, setExpandedChapters] = useState({});
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const course = courseData.find(course => course.id === courseId);

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

  const handleAddChapter = () => {
    // TODO: Implement add chapter functionality
    console.log('Add new chapter');
  };

  const handleAddMaterial = (chapterId) => {
    // TODO: Implement add material functionality
    console.log('Add new material to chapter', chapterId);
  };

  const handleEditChapter = (chapterId) => {
    // TODO: Implement edit chapter functionality
    console.log('Edit chapter', chapterId);
  };

  const handleDeleteChapter = (chapterId) => {
    // TODO: Implement delete chapter functionality
    console.log('Delete chapter', chapterId);
  };

  const handleEditMaterial = (materialId) => {
    // TODO: Implement edit material functionality
    console.log('Edit material', materialId);
  };

  const handleDeleteMaterial = (materialId) => {
    // TODO: Implement delete material functionality
    console.log('Delete material', materialId);
  };

  const handleAddAnnouncement = () => {
    // TODO: Implement add announcement functionality
    console.log('Add new announcement');
  };

  const handleEditAnnouncement = (announcementId) => {
    // TODO: Implement edit announcement functionality
    console.log('Edit announcement', announcementId);
  };

  const handleDeleteAnnouncement = (announcementId) => {
    // TODO: Implement delete announcement functionality
    console.log('Delete announcement', announcementId);
  };

  const handleFilesChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    setUploadStatus({ status: 'processing', message: 'Uploading files...' });
    setUploadProgress(0);

    try {
      // Create collection name from course ID
      const collectionName = `course_${courseId.toLowerCase()}`;

      // Upload each file
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const progress = (i / selectedFiles.length) * 100;
        setUploadProgress(progress);
        setUploadStatus({
          status: 'processing',
          message: `Uploading file ${i + 1} of ${selectedFiles.length}: ${file.name}`
        });

        await uploadDocument(file, collectionName, {
          chunk_size: 1000,
          chunk_overlap: 200
        });
      }

      setUploadProgress(100);
      setUploadStatus({
        status: 'success',
        message: 'All files uploaded successfully!'
      });

      // Reset form after delay
      setTimeout(() => {
        setSelectedFiles([]);
        setUploadStatus(null);
        setUploadProgress(0);
        setShowUploadModal(false);
      }, 2000);

    } catch (error) {
      setUploadStatus({
        status: 'error',
        message: error.message || 'Failed to upload files'
      });
      setUploadProgress(0);
      toast.error('Failed to upload files');
    }
  };

  return (
    <PageContainer>
      <ElearningHeader userRole="lecturer" />
      
      <CourseHeader>
        <div className="content">
          <div className="breadcrumb">
            <a href="/elearning/lecturer">Trang chủ</a>
            <FiChevronRight size={14} />
            <a href="/elearning/lecturer">Khóa học</a>
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
            <SectionHeader>
              <span>Nội dung môn học</span>
              <div className="actions">
                <button className="secondary" onClick={() => setShowUploadModal(true)}>
                  <FiUpload size={16} />
                  Tải tài liệu lên Vector DB
                </button>
                <button className="primary" onClick={handleAddChapter}>
                  <FiPlus size={16} />
                  Thêm chương
                </button>
              </div>
            </SectionHeader>
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
                    <div className="chapter-actions">
                      <button className="edit" onClick={(e) => { e.stopPropagation(); handleEditChapter(chapter.id); }}>
                        <FiEdit2 size={16} />
                      </button>
                      <button className="delete" onClick={(e) => { e.stopPropagation(); handleDeleteChapter(chapter.id); }}>
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </ChapterHeader>
                  {expandedChapters[chapter.id] && (
                    <MaterialList>
                      <div className="material-item" onClick={() => handleAddMaterial(chapter.id)}>
                        <div className="material-icon">
                          <FiPlus size={16} />
                        </div>
                        <span>Thêm tài liệu mới</span>
                      </div>
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
                          <div className="material-actions">
                            <button className="edit" onClick={(e) => { e.stopPropagation(); handleEditMaterial(material.id); }}>
                              <FiEdit2 size={16} />
                            </button>
                            <button className="delete" onClick={(e) => { e.stopPropagation(); handleDeleteMaterial(material.id); }}>
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </MaterialList>
                  )}
                </div>
              ))}
            </ChapterList>
          </ContentSection>

          <ContentSection>
            <SectionHeader>
              <span>Bài tập & Dự án</span>
              <div className="actions">
                <button className="primary">
                  <FiPlus size={16} />
                  Thêm bài tập
                </button>
              </div>
            </SectionHeader>
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
                        <div style={{ color: VINH_COLORS.error, marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FiClock size={14} />
                          Hạn nộp: {new Date(exercise.dueDate).toLocaleString('vi-VN')}
                        </div>
                      </div>
                    </div>
                    <div className="chapter-actions">
                      <button className="edit">
                        <FiEdit2 size={16} />
                      </button>
                      <button className="delete">
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </ChapterHeader>
                </div>
              ))}
            </ChapterList>
          </ContentSection>
        </div>

        <Sidebar>
          <SidebarCard>
            <SectionHeader>
              <span>Thông báo môn học</span>
              <div className="actions">
                <button className="primary" onClick={handleAddAnnouncement}>
                  <FiPlus size={16} />
                  Thêm thông báo
                </button>
              </div>
            </SectionHeader>
            <AnnouncementList>
              {course.announcements.map((announcement, index) => (
                <div key={index} className="announcement">
                  <div className="title">{announcement.title}</div>
                  <div className="content">{announcement.content}</div>
                  <div className="date">
                    {new Date(announcement.date).toLocaleDateString('vi-VN')}
                  </div>
                  <div className="announcement-actions">
                    <button className="edit" onClick={() => handleEditAnnouncement(index)}>
                      <FiEdit2 size={16} />
                    </button>
                    <button className="delete" onClick={() => handleDeleteAnnouncement(index)}>
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </AnnouncementList>
          </SidebarCard>

          <SidebarCard>
            <SectionHeader>
              <span>Diễn đàn thảo luận</span>
              <div className="actions">
                <button className="primary">
                  <FiPlus size={16} />
                  Thêm chủ đề
                </button>
              </div>
            </SectionHeader>
            <AnnouncementList>
              {course.discussions.map(discussion => (
                <div key={discussion.id} className="announcement">
                  <div className="title">{discussion.title}</div>
                  <div className="content">{discussion.description}</div>
                  <div className="announcement-actions">
                    <button className="edit">
                      <FiEdit2 size={16} />
                    </button>
                    <button className="delete">
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </AnnouncementList>
          </SidebarCard>
        </Sidebar>
      </MainContent>

      {showUploadModal && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <h2>Tải tài liệu lên Vector DB</h2>
              <button onClick={() => setShowUploadModal(false)}>
                <FiX />
              </button>
            </ModalHeader>

            <UploadArea onClick={() => document.getElementById('file-upload').click()}>
              <input
                type="file"
                id="file-upload"
                multiple
                onChange={handleFilesChange}
                accept=".pdf,.docx,.txt,.md,.csv"
              />
              <FiUpload size={32} />
              <p>Kéo và thả tài liệu vào đây, hoặc nhấp để chọn</p>
              <p className="file-types">
                Định dạng hỗ trợ: PDF, DOCX, TXT, MD, CSV
              </p>
            </UploadArea>

            {selectedFiles.length > 0 && (
              <FileList>
                {selectedFiles.map((file, index) => (
                  <FileItem key={index}>
                    <FiFileText className="file-icon" />
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">
                      {(file.size / 1024).toFixed(2)} KB
                    </span>
                    <button onClick={() => removeFile(index)}>
                      <FiX />
                    </button>
                  </FileItem>
                ))}
              </FileList>
            )}

            {uploadStatus && (
              <>
                <ProgressBar>
                  <ProgressFill progress={uploadProgress} />
                </ProgressBar>
                <StatusMessage status={uploadStatus.status}>
                  {uploadStatus.status === 'processing' ? (
                    <FiRefreshCw />
                  ) : uploadStatus.status === 'success' ? (
                    <FiCheckCircle />
                  ) : (
                    <FiX />
                  )}
                  {uploadStatus.message}
                </StatusMessage>
              </>
            )}

            <ModalActions>
              <button className="cancel" onClick={() => setShowUploadModal(false)}>
                Hủy
              </button>
              <button
                className="upload"
                onClick={handleUpload}
                disabled={selectedFiles.length === 0 || uploadStatus?.status === 'processing'}
              >
                {uploadStatus?.status === 'processing' ? (
                  <>
                    <FiRefreshCw className="spinning" />
                    Đang tải lên...
                  </>
                ) : (
                  <>
                    <FiUpload />
                    Tải lên
                  </>
                )}
              </button>
            </ModalActions>
          </ModalContent>
        </Modal>
      )}

      <ElearningFooter />
    </PageContainer>
  );
};

export default LecturerCoursePage; 
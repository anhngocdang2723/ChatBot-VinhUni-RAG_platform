import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FiBook, FiFileText, FiMessageCircle, FiInfo, FiChevronRight, FiDownload, FiX, FiBookOpen, FiCalendar, FiClock, FiCheckCircle, FiPlus, FiUpload, FiEdit2, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import { courseData } from '../config/courseData';
import { ElearningHeader, ElearningFooter } from '../components/ElearningLayout';
import { useApi } from '../context/ApiContext';
import { toast } from 'react-toastify';

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
  display: flex;
  justify-content: space-between;
  align-items: center;

  .actions {
    display: flex;
    gap: 0.5rem;
  }

  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    &.primary {
      background-color: #0066b3;
      color: white;

      &:hover {
        background-color: #005291;
      }
    }

    &.secondary {
      background-color: #f0f0f0;
      color: #333;

      &:hover {
        background-color: #e0e0e0;
      }
    }
  }
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

  .chapter-actions {
    display: flex;
    gap: 0.5rem;

    button {
      padding: 0.5rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;

      &.edit {
        background-color: #f0f0f0;
        color: #333;

        &:hover {
          background-color: #e0e0e0;
        }
      }

      &.delete {
        background-color: #fee2e2;
        color: #dc2626;

        &:hover {
          background-color: #fecaca;
        }
      }
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

    .material-actions {
      margin-left: auto;
      display: flex;
      gap: 0.5rem;

      button {
        padding: 0.5rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;

        &.edit {
          background-color: #f0f0f0;
          color: #333;

          &:hover {
            background-color: #e0e0e0;
          }
        }

        &.delete {
          background-color: #fee2e2;
          color: #dc2626;

          &:hover {
            background-color: #fecaca;
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

    .announcement-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;

      button {
        padding: 0.5rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;

        &.edit {
          background-color: #f0f0f0;
          color: #333;

          &:hover {
            background-color: #e0e0e0;
          }
        }

        &.delete {
          background-color: #fee2e2;
          color: #dc2626;

          &:hover {
            background-color: #fecaca;
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
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  h2 {
    margin: 0;
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
    color: #64748b;

    &:hover {
      color: #dc2626;
    }
  }
`;

const UploadArea = styled.div`
  border: 2px dashed #e2e8f0;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  margin-bottom: 1.5rem;
  transition: all 0.2s;

  &:hover {
    border-color: #0066b3;
    background-color: rgba(0, 102, 179, 0.05);
  }

  input {
    display: none;
  }
`;

const FileList = styled.div`
  margin-top: 1rem;
`;

const FileItem = styled.div`
  display: flex;
  align-items: center;
  padding: 0.5rem;
  background: #f8fafc;
  border-radius: 4px;
  margin-bottom: 0.5rem;

  .file-icon {
    margin-right: 0.5rem;
    color: #0066b3;
  }

  .file-name {
    flex: 1;
  }

  .file-size {
    color: #64748b;
    font-size: 0.875rem;
    margin-right: 1rem;
  }

  button {
    padding: 0.25rem;
    background: none;
    border: none;
    color: #dc2626;
    cursor: pointer;

    &:hover {
      color: #b91c1c;
    }
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background-color: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 1rem;
`;

const ProgressFill = styled.div`
  width: ${props => props.progress}%;
  height: 100%;
  background-color: #0066b3;
  transition: width 0.3s ease;
`;

const StatusMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  color: ${props => {
    switch (props.status) {
      case 'success': return '#059669';
      case 'error': return '#dc2626';
      case 'processing': return '#0066b3';
      default: return '#64748b';
    }
  }};

  svg {
    ${props => props.status === 'processing' && `
      animation: spin 1s linear infinite;
      @keyframes spin {
        100% { transform: rotate(360deg); }
      }
    `}
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
      <ElearningHeader />
      
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
              <FiUpload size={32} style={{ marginBottom: '1rem', color: '#0066b3' }} />
              <p>Kéo và thả tài liệu vào đây, hoặc nhấp để chọn</p>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem' }}>
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

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="secondary" onClick={() => setShowUploadModal(false)}>
                Hủy
              </button>
              <button
                className="primary"
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
            </div>
          </ModalContent>
        </Modal>
      )}

      <ElearningFooter />
    </PageContainer>
  );
};

export default LecturerCoursePage; 
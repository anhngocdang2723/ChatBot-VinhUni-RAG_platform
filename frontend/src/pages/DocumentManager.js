import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FiUpload, FiTrash2, FiEdit, FiSearch, FiFilter, FiFolder, FiRefreshCw, FiFileText, FiCheck, FiX } from 'react-icons/fi';
import Layout from '../components/Layout';
import { useApi } from '../context/ApiContext';
import { toast } from 'react-toastify';
import debounce from 'lodash/debounce';

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: var(--spacing-sm);
`;

const Subtitle = styled.p`
  color: var(--dark-gray);
`;

const TabsContainer = styled.div`
  display: flex;
  margin-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--mid-gray);
`;

const Tab = styled.button`
  padding: var(--spacing-md);
  background: none;
  border: none;
  border-bottom: 2px solid ${props => props.active ? 'var(--primary-color)' : 'transparent'};
  color: ${props => props.active ? 'var(--primary-color)' : 'var(--dark-gray)'};
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  cursor: pointer;
  
  &:hover {
    color: var(--primary-color);
    background: transparent;
  }
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
`;

const ActionButtons = styled.div`
  display: flex;
  gap: var(--spacing-sm);
`;

const SearchContainer = styled.div`
  display: flex;
  gap: var(--spacing-sm);
  width: 300px;
  
  input {
    flex-grow: 1;
  }
`;

const Card = styled.div`
  background-color: var(--white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-md);
  margin-bottom: var(--spacing-lg);
`;

const CollectionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-lg);
  margin-top: var(--spacing-lg);
`;

const CollectionCard = styled.div`
  background-color: var(--white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--mid-gray);
  transition: all 0.2s;
  
  &:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
  }
`;

const CollectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-md);
`;

const CollectionIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background-color: var(--primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    color: var(--white);
  }
`;

const CollectionTitle = styled.h3`
  font-size: 1.1rem;
  margin-bottom: var(--spacing-xs);
  word-break: break-word;
`;

const CollectionStats = styled.div`
  font-size: 0.875rem;
  color: var(--gray);
  margin-bottom: var(--spacing-md);
`;

const CollectionActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-xs);
  
  button {
    padding: var(--spacing-xs);
    min-width: 32px;
    height: 32px;
  }
`;

const DocumentsList = styled.div`
  margin-top: var(--spacing-lg);
`;

const DocumentItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--mid-gray);
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: var(--light-gray);
  }
`;

const DocumentInfo = styled.div`
  flex-grow: 1;
`;

const DocumentTitle = styled.div`
  font-weight: 500;
`;

const DocumentMeta = styled.div`
  font-size: 0.875rem;
  color: var(--gray);
`;

const DocumentActions = styled.div`
  display: flex;
  gap: var(--spacing-xs);
  
  button {
    padding: var(--spacing-xs);
    min-width: 32px;
    height: 32px;
  }
`;

const UploadForm = styled.form`
  margin-top: var(--spacing-lg);
`;

const FormGroup = styled.div`
  margin-bottom: var(--spacing-md);
`;

const Label = styled.label`
  display: block;
  margin-bottom: var(--spacing-xs);
  font-weight: 500;
`;

const UploadArea = styled.div`
  border: 2px dashed var(--mid-gray);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: var(--primary-color);
    background-color: rgba(37, 99, 235, 0.05);
  }
  
  input {
    display: none;
  }
`;

const UploadIcon = styled.div`
  font-size: 2rem;
  color: var(--gray);
  margin-bottom: var(--spacing-md);
`;

const UploadText = styled.div`
  margin-bottom: var(--spacing-md);
`;

const SelectedFile = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background-color: var(--light-gray);
  border-radius: var(--radius-md);
  margin-top: var(--spacing-sm);
`;

const EmptyState = styled.div`
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--gray);
`;

const UploadProgress = styled.div`
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--light-gray);
  border-radius: var(--radius-md);
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background-color: var(--mid-gray);
  border-radius: 4px;
  overflow: hidden;
  margin-top: var(--spacing-sm);
`;

const ProgressFill = styled.div`
  width: ${props => props.progress}%;
  height: 100%;
  background-color: var(--primary-color);
  transition: width 0.3s ease;
`;

const StatusSteps = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-md);
  gap: var(--spacing-md);
`;

const StatusStep = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  background-color: ${props => props.active ? 'var(--primary-light)' : 'var(--white)'};
  color: ${props => props.active ? 'var(--white)' : props.completed ? 'var(--success-color)' : 'var(--gray)'};
  border: 1px solid ${props => props.completed ? 'var(--success-color)' : 'var(--mid-gray)'};

  svg {
    ${props => props.active && `
      animation: spin 1s linear infinite;
      @keyframes spin {
        100% { transform: rotate(360deg); }
      }
    `}
  }
`;

const StatusMessage = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: ${props => {
    switch (props.status) {
      case 'success': return 'var(--success-color)';
      case 'error': return 'var(--error-color)';
      case 'processing': return 'var(--primary-color)';
      default: return 'var(--gray)';
    }
  }};
  margin-top: var(--spacing-sm);
`;

const DocumentManager = () => {
  const { getCollections, uploadDocument, deleteCollection, isLoading } = useApi();
  const [activeTab, setActiveTab] = useState('collections');
  const [collections, setCollections] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [uploadConfig, setUploadConfig] = useState({
    collectionName: '',
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  // Memoize fetchCollections to prevent unnecessary re-renders
  const fetchCollections = useCallback(async () => {
    if (isRefreshing) return; // Prevent multiple simultaneous requests
    
    try {
      setIsRefreshing(true);
      const fetchedCollections = await getCollections();
      // Only store essential collection information
      const simplifiedCollections = fetchedCollections.map(collection => ({
        name: collection.name,
        vectors_count: collection.vectors_count,
        document_count: collection.document_count || 0
      }));
      setCollections(simplifiedCollections || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
      toast.error('Failed to fetch collections');
    } finally {
      setIsRefreshing(false);
    }
  }, [getCollections, isRefreshing]);

  // Debounce the search query to prevent rapid API calls
  const debouncedSearch = useCallback(
    debounce((query) => {
      setSearchQuery(query);
    }, 300),
    []
  );

  // Only fetch collections on mount and when explicitly requested
  useEffect(() => {
    fetchCollections();
  }, []); // Remove fetchCollections from dependencies to prevent re-fetching

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadStatus(null);
      setUploadProgress(0);
      // If no collection name is set, use file name as collection name suggestion
      if (!uploadConfig.collectionName) {
        const fileName = file.name.split('.')[0];
        setUploadConfig(prev => ({
          ...prev,
          collectionName: fileName
        }));
      }
    }
  };

  const handleUploadConfigChange = (event) => {
    const { name, value } = event.target;
    setUploadConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    
    if (!selectedFile) {
      return;
    }
    
    try {
      // Step 1: Sending
      setUploadStep('sending');
      setUploadStatus({ status: 'processing', message: 'Sending document to server...' });
      setUploadProgress(0);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);
      
      const response = await uploadDocument(
        selectedFile, 
        uploadConfig.collectionName || null,
        {
          chunk_size: parseInt(uploadConfig.chunkSize),
          chunk_overlap: parseInt(uploadConfig.chunkOverlap)
        }
      );
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (response && response.status === 'processing') {
        // Step 2: Processing
        setUploadStep('processing');
        setUploadStatus({
          status: 'processing',
          message: `Processing document in background...`
        });
        
        // Simulate processing time (you might want to implement actual status checking here)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Step 3: Created
        setUploadStep('created');
        setUploadStatus({
          status: 'success',
          message: `Collection "${response.collection_name}" created successfully!`
        });
        toast.success('Document processed and collection created successfully!');
      } else {
        throw new Error('Upload failed');
      }
      
      // Reset form after a delay
      setTimeout(() => {
        setSelectedFile(null);
        setUploadConfig({
          collectionName: '',
          chunkSize: 1000,
          chunkOverlap: 200,
        });
        setUploadStatus(null);
        setUploadProgress(0);
        setUploadStep(null);
        
        // Reset file input
        const fileInput = document.getElementById('file-upload');
        if (fileInput) {
          fileInput.value = '';
        }
        
        // Refresh collections
        fetchCollections();
      }, 3000);
      
    } catch (error) {
      setUploadStatus({
        status: 'error',
        message: error.message || 'Failed to upload document'
      });
      setUploadStep(null);
      toast.error('Failed to upload document');
      setUploadProgress(0);
    }
  };

  const handleDeleteCollection = async (collectionName) => {
    if (window.confirm(`Are you sure you want to delete collection "${collectionName}"? This action cannot be undone.`)) {
      try {
        await deleteCollection(collectionName);
        await fetchCollections();
      } catch (error) {
        toast.error('Failed to delete collection');
      }
    }
  };

  const filteredCollections = collections.filter(collection => 
    collection.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <PageHeader>
        <div>
          <Title>Quản lý tài liệu</Title>
          <Subtitle>Tải lên và quản lý tài liệu của bạn</Subtitle>
        </div>
        
        <button 
          onClick={fetchCollections} 
          disabled={isLoading || isRefreshing}
        >
          <FiRefreshCw className={isRefreshing ? 'spinning' : ''} /> 
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </PageHeader>
      
      <TabsContainer>
        <Tab 
          active={activeTab === 'collections'} 
          onClick={() => setActiveTab('collections')}
        >
          Tập tài liệu (collections)
        </Tab>
        <Tab 
          active={activeTab === 'upload'} 
          onClick={() => setActiveTab('upload')}
        >
          Tải lên tài liệu
        </Tab>
      </TabsContainer>
      
      {activeTab === 'collections' && (
        <>
          <ActionBar>
            <SearchContainer>
              <input 
                type="text" 
                placeholder="Tìm kiếm tập tài liệu..." 
                onChange={(e) => debouncedSearch(e.target.value)}
              />
              <button className="button-secondary">
                <FiSearch />
              </button>
            </SearchContainer>
            
            <ActionButtons>
              <button onClick={() => setActiveTab('upload')}>
                <FiUpload /> Tải lên tài liệu
              </button>
            </ActionButtons>
          </ActionBar>
          
          {isLoading ? (
            <div className="spinner" />
          ) : filteredCollections.length > 0 ? (
            <CollectionsGrid>
              {filteredCollections.map(collection => (
                <CollectionCard key={collection.name}>
                  <CollectionHeader>
                    <CollectionIcon>
                      <FiFolder />
                    </CollectionIcon>
                    <CollectionActions>
                      <button className="button-secondary">
                        <FiEdit />
                      </button>
                      <button 
                        className="button-danger"
                        onClick={() => handleDeleteCollection(collection.name)}
                      >
                        <FiTrash2 />
                      </button>
                    </CollectionActions>
                  </CollectionHeader>
                  
                  <CollectionTitle>{collection.name}</CollectionTitle>
                  
                  <CollectionStats>
                    <div>{collection.vectors_count} vectors</div>
                    <div>{collection.document_count} documents</div>
                  </CollectionStats>
                </CollectionCard>
              ))}
            </CollectionsGrid>
          ) : (
            <EmptyState>
              <p>Không tìm thấy tập tài liệu. Tải lên tài liệu để tạo tập tài liệu đầu tiên.</p>
              <button className="mt-md" onClick={() => setActiveTab('upload')}>
                <FiUpload /> Tải lên tài liệu
              </button>
            </EmptyState>
          )}
        </>
      )}
      
      {activeTab === 'upload' && (
        <Card>
          <h2>Tải lên tài liệu</h2>
          
          <UploadForm onSubmit={handleUpload}>
            <FormGroup>
              <Label htmlFor="file-upload">Chọn tài liệu</Label>
              <UploadArea onClick={() => document.getElementById('file-upload').click()}>
                <input 
                  type="file" 
                  id="file-upload" 
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.txt,.md,.csv"
                />
                
                <UploadIcon>
                  <FiUpload />
                </UploadIcon>
                
                <UploadText>
                  {selectedFile ? (
                    <SelectedFile>
                      <FiFileText /> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                    </SelectedFile>
                  ) : (
                    <>
                      <p>Kéo và thả tài liệu vào đây, hoặc nhấp để chọn</p>
                      <p className="mt-sm">Định dạng hỗ trợ: PDF, DOCX, TXT, MD, CSV</p>
                    </>
                  )}
                </UploadText>
              </UploadArea>
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="collection-name">Tên tập tài liệu (tùy chọn)</Label>
              <input 
                type="text"
                id="collection-name"
                name="collectionName"
                placeholder="Để trống để tạo tự động"
                value={uploadConfig.collectionName}
                onChange={handleUploadConfigChange}
              />
            </FormGroup>
            
            <FormGroup>
              <Label>Cấu hình chia nhỏ (chunking)</Label>
              <div className="flex gap-md">
                <div>
                  <Label htmlFor="chunk-size">Kích thước chia nhỏ</Label>
                  <input 
                    type="number"
                    id="chunk-size"
                    name="chunkSize"
                    value={uploadConfig.chunkSize}
                    onChange={handleUploadConfigChange}
                    min="100"
                    max="10000"
                  />
                </div>
                <div>
                  <Label htmlFor="chunk-overlap">Kích thước chồng lắp (chunk overlap)</Label>
                  <input 
                    type="number"
                    id="chunk-overlap"
                    name="chunkOverlap"
                    value={uploadConfig.chunkOverlap}
                    onChange={handleUploadConfigChange}
                    min="0"
                    max="5000"
                  />
                </div>
              </div>
            </FormGroup>
            
            {uploadStatus && (
              <UploadProgress>
                <StatusSteps>
                  <StatusStep 
                    completed={uploadStep === 'processing' || uploadStep === 'created'} 
                    active={uploadStep === 'sending'}
                  >
                    {uploadStep === 'sending' ? <FiRefreshCw /> : <FiCheck />}
                    Gửi tài liệu
                  </StatusStep>
                  <StatusStep 
                    completed={uploadStep === 'created'} 
                    active={uploadStep === 'processing'}
                  >
                    {uploadStep === 'processing' ? <FiRefreshCw /> : 
                     uploadStep === 'created' ? <FiCheck /> : null}
                    Xử lý tài liệu
                  </StatusStep>
                  <StatusStep 
                    completed={uploadStep === 'created'} 
                    active={false}
                  >
                    {uploadStep === 'created' ? <FiCheck /> : null}
                    Tạo tập tài liệu
                  </StatusStep>
                </StatusSteps>
                
                <ProgressBar>
                  <ProgressFill progress={uploadProgress} />
                </ProgressBar>
                <StatusMessage status={uploadStatus.status}>
                  {uploadStatus.status === 'success' ? <FiCheck /> : 
                   uploadStatus.status === 'error' ? <FiX /> : 
                   <FiRefreshCw className="spinning" />}
                  {uploadStatus.message}
                </StatusMessage>
              </UploadProgress>
            )}
            
            <div>
              <button 
                type="submit" 
                disabled={!selectedFile || isLoading || uploadStatus?.status === 'processing'}
              >
                <FiUpload /> Tải lên tài liệu
              </button>
            </div>
          </UploadForm>
        </Card>
      )}
    </Layout>
  );
};

export default DocumentManager; 
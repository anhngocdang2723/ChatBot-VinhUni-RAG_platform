import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FiUpload, FiTrash2, FiEdit, FiSearch, FiFilter, FiFolder, FiRefreshCw, FiFileText, FiCheck, FiX, FiLoader } from 'react-icons/fi';
import AdminLayout from '../components/AdminLayout';
import { useApi } from '../context/ApiContext';
import { toast } from 'react-toastify';
import debounce from 'lodash/debounce';
import { VINH_COLORS } from '../config/colors';

// CSS Variables for consistent spacing and styling
const CSS_VARIABLES = `
  --spacing-xs: 0.5rem;
  --spacing-sm: 0.75rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  
  --transition-fast: 0.15s ease;
  --transition-normal: 0.3s ease;
`;

const PageContainer = styled.div`
  ${CSS_VARIABLES}
  background: ${VINH_COLORS.background};
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-lg);
`;

const PageHeader = styled.div`
  margin-bottom: var(--spacing-xl);
  background: linear-gradient(135deg, ${VINH_COLORS.primary}, ${VINH_COLORS.primaryDark});
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  color: ${VINH_COLORS.white};
  box-shadow: var(--shadow-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HeaderContent = styled.div`
  flex: 1;
`;

const Title = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: var(--spacing-sm);
  color: inherit;
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  opacity: 0.9;
  max-width: 600px;
`;

const TabsContainer = styled.div`
  display: flex;
  margin-bottom: var(--spacing-lg);
  border-bottom: 1px solid ${VINH_COLORS.border};
`;

const Tab = styled.button`
  padding: var(--spacing-md);
  background: none;
  border: none;
  border-bottom: 2px solid ${props => props.active ? VINH_COLORS.primary : 'transparent'};
  color: ${props => props.active ? VINH_COLORS.primary : VINH_COLORS.textLight};
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    color: ${VINH_COLORS.primary};
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
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid ${VINH_COLORS.border};
    border-radius: var(--radius-md);
    transition: all 0.2s ease;
    
    &:focus {
      outline: none;
      border-color: ${VINH_COLORS.primary};
      box-shadow: 0 0 0 2px ${VINH_COLORS.primaryLight}33;
    }
  }
  
  button {
    background-color: ${VINH_COLORS.primary};
    color: ${VINH_COLORS.white};
    border: none;
    border-radius: var(--radius-md);
    padding: var(--spacing-sm) var(--spacing-md);
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background-color: ${VINH_COLORS.primaryDark};
    }
  }
`;

const Card = styled.div`
  background: ${VINH_COLORS.white};
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  transition: all 0.3s ease;
  border: 1px solid ${VINH_COLORS.border};
  margin-bottom: var(--spacing-lg);

  &:hover {
    box-shadow: var(--shadow-lg);
  }
`;

const CollectionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-lg);
  margin-top: var(--spacing-lg);
`;

const CollectionCard = styled.div`
  background: ${VINH_COLORS.white};
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  transition: all 0.3s ease;
  border: 1px solid ${VINH_COLORS.border};

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
    border-color: ${VINH_COLORS.primaryLight};
  }
`;

const CollectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-md);
`;

const CollectionIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: ${VINH_COLORS.primaryLight};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${VINH_COLORS.primary};
  font-size: 1.5rem;
`;

const CollectionTitle = styled.h3`
  font-size: 1.1rem;
  margin-bottom: var(--spacing-xs);
  word-break: break-word;
  color: ${VINH_COLORS.text};
  font-weight: 600;
`;

const CollectionStats = styled.div`
  font-size: 0.875rem;
  color: ${VINH_COLORS.textLight};
  margin-bottom: var(--spacing-md);
  display: flex;
  gap: var(--spacing-md);
  
  div {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }
`;

const CollectionActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-xs);
  
  button {
    padding: var(--spacing-xs);
    min-width: 32px;
    height: 32px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    
    &.button-secondary {
      background-color: ${VINH_COLORS.lightGray};
      color: ${VINH_COLORS.text};
      
      &:hover {
        background-color: ${VINH_COLORS.gray};
      }
    }
    
    &.button-danger {
      background-color: ${VINH_COLORS.errorLight};
      color: ${VINH_COLORS.error};
      
      &:hover {
        background-color: ${VINH_COLORS.error};
        color: ${VINH_COLORS.white};
      }
    }
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
  border-bottom: 1px solid ${VINH_COLORS.border};
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: ${VINH_COLORS.backgroundAlt};
  }
`;

const DocumentInfo = styled.div`
  flex-grow: 1;
`;

const DocumentTitle = styled.div`
  font-weight: 500;
  color: ${VINH_COLORS.text};
`;

const DocumentMeta = styled.div`
  font-size: 0.875rem;
  color: ${VINH_COLORS.textLight};
`;

const DocumentActions = styled.div`
  display: flex;
  gap: var(--spacing-xs);
  
  button {
    padding: var(--spacing-xs);
    min-width: 32px;
    height: 32px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    
    &.button-secondary {
      background-color: ${VINH_COLORS.lightGray};
      color: ${VINH_COLORS.text};
      
      &:hover {
        background-color: ${VINH_COLORS.gray};
      }
    }
  }
`;

const UploadForm = styled.form`
  margin-top: var(--spacing-lg);
`;

const FormGroup = styled.div`
  margin-bottom: var(--spacing-md);
  
  input[type="text"],
  input[type="number"] {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid ${VINH_COLORS.border};
    border-radius: var(--radius-md);
    transition: all 0.2s ease;
    
    &:focus {
      outline: none;
      border-color: ${VINH_COLORS.primary};
      box-shadow: 0 0 0 2px ${VINH_COLORS.primaryLight}33;
    }
  }
  
  .flex {
    display: flex;
    gap: var(--spacing-md);
    
    > div {
      flex: 1;
    }
  }
`;

const Label = styled.label`
  display: block;
  margin-bottom: var(--spacing-xs);
  font-weight: 500;
  color: ${VINH_COLORS.text};
`;

const UploadArea = styled.div`
  border: 2px dashed ${VINH_COLORS.border};
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: ${VINH_COLORS.primary};
    background-color: ${VINH_COLORS.infoLight};
  }
  
  input {
    display: none;
  }
`;

const UploadIcon = styled.div`
  font-size: 2rem;
  color: ${VINH_COLORS.primary};
  margin-bottom: var(--spacing-md);
`;

const UploadText = styled.div`
  margin-bottom: var(--spacing-md);
  color: ${VINH_COLORS.text};
  
  p {
    margin-bottom: var(--spacing-xs);
    
    &.mt-sm {
      margin-top: var(--spacing-sm);
      color: ${VINH_COLORS.textLight};
      font-size: 0.875rem;
    }
  }
`;

const SelectedFile = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background-color: ${VINH_COLORS.backgroundAlt};
  border-radius: var(--radius-md);
  margin-top: var(--spacing-sm);
  color: ${VINH_COLORS.text};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: var(--spacing-xl);
  color: ${VINH_COLORS.textLight};
  
  p {
    margin-bottom: var(--spacing-md);
  }
  
  button {
    background-color: ${VINH_COLORS.primary};
    color: ${VINH_COLORS.white};
    border: none;
    border-radius: var(--radius-md);
    padding: var(--spacing-sm) var(--spacing-md);
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    
    &:hover {
      background-color: ${VINH_COLORS.primaryDark};
    }
  }
  
  .mt-md {
    margin-top: var(--spacing-md);
  }
`;

const UploadProgress = styled.div`
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: ${VINH_COLORS.backgroundAlt};
  border-radius: var(--radius-md);
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background-color: ${VINH_COLORS.gray};
  border-radius: 4px;
  overflow: hidden;
  margin-top: var(--spacing-sm);
`;

const ProgressFill = styled.div`
  width: ${props => props.progress}%;
  height: 100%;
  background-color: ${VINH_COLORS.primary};
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
  background-color: ${props => props.active ? VINH_COLORS.primary : VINH_COLORS.white};
  color: ${props => props.active ? VINH_COLORS.white : props.completed ? VINH_COLORS.success : VINH_COLORS.textLight};
  border: 1px solid ${props => props.completed ? VINH_COLORS.success : VINH_COLORS.border};

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
      case 'success': return VINH_COLORS.success;
      case 'error': return VINH_COLORS.error;
      case 'processing': return VINH_COLORS.primary;
      default: return VINH_COLORS.textLight;
    }
  }};
  margin-top: var(--spacing-sm);
`;

const Button = styled.button`
  background-color: ${props => {
    switch (props.variant) {
      case 'primary': return VINH_COLORS.primary;
      case 'secondary': return VINH_COLORS.secondary;
      case 'danger': return VINH_COLORS.error;
      default: return VINH_COLORS.primary;
    }
  }};
  color: ${VINH_COLORS.white};
  border: none;
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-weight: 500;
  
  &:hover {
    background-color: ${props => {
      switch (props.variant) {
        case 'primary': return VINH_COLORS.primaryDark;
        case 'secondary': return VINH_COLORS.secondaryDark;
        case 'danger': return VINH_COLORS.error;
        default: return VINH_COLORS.primaryDark;
      }
    }};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  &.spinning svg {
    animation: spin 1s linear infinite;
    @keyframes spin {
      100% { transform: rotate(360deg); }
    }
  }
`;

const LoadingSpinner = styled(FiLoader)`
  animation: spin 1s linear infinite;
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
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
    <AdminLayout>
      <PageContainer>
        <PageHeader>
          <HeaderContent>
            <Title>Quản lý tài liệu</Title>
            <Subtitle>Tải lên và quản lý tài liệu của bạn</Subtitle>
          </HeaderContent>
          
          <Button 
            onClick={fetchCollections} 
            disabled={isLoading || isRefreshing}
            variant="primary"
          >
            <FiRefreshCw className={isRefreshing ? 'spinning' : ''} /> 
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
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
                <button>
                  <FiSearch />
                </button>
              </SearchContainer>
              
              <ActionButtons>
                <Button onClick={() => setActiveTab('upload')} variant="primary">
                  <FiUpload /> Tải lên tài liệu
                </Button>
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
                      <div><FiFileText /> {collection.vectors_count} vectors</div>
                      <div><FiFolder /> {collection.document_count} documents</div>
                    </CollectionStats>
                  </CollectionCard>
                ))}
              </CollectionsGrid>
            ) : (
              <EmptyState>
                <p>Không tìm thấy tập tài liệu. Tải lên tài liệu để tạo tập tài liệu đầu tiên.</p>
                <Button className="mt-md" onClick={() => setActiveTab('upload')} variant="primary">
                  <FiUpload /> Tải lên tài liệu
                </Button>
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
                <div className="flex">
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
                <Button 
                  type="submit" 
                  disabled={!selectedFile || isLoading || uploadStatus?.status === 'processing'}
                  variant="primary"
                >
                  <FiUpload /> Tải lên tài liệu
                </Button>
              </div>
            </UploadForm>
          </Card>
        )}
      </PageContainer>
    </AdminLayout>
  );
};

export default DocumentManager; 
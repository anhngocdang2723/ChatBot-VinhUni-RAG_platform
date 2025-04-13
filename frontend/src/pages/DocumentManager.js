import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FiUpload, FiTrash2, FiEdit, FiSearch, FiFilter, FiFolder, FiRefreshCw, FiFileText, FiCheck, FiX, FiLoader, FiAlertCircle, FiFile } from 'react-icons/fi';
import AdminLayout from '../components/AdminLayout';
import { useApi } from '../context/ApiContext';
import { toast } from 'react-toastify';
import debounce from 'lodash/debounce';
import { VINH_COLORS } from '../config/colors';

const ManagerContainer = styled.div`
  padding: var(--spacing-xl);
`;

const Header = styled.div`
  margin-bottom: var(--spacing-xl);
  background: linear-gradient(135deg, ${VINH_COLORS.primary}, ${VINH_COLORS.primaryDark});
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  color: ${VINH_COLORS.white};
  box-shadow: var(--shadow-lg);
`;

const Title = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: var(--spacing-sm);
  color: inherit;
`;

const Description = styled.p`
  font-size: 1.1rem;
  opacity: 0.9;
  max-width: 600px;
`;

const ActionBar = styled.div`
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-md);
  font-weight: 600;
  transition: all 0.3s ease;
  cursor: pointer;
  border: none;
  
  ${props => props.primary ? `
    background: ${VINH_COLORS.primary};
    color: ${VINH_COLORS.white};
    &:hover {
      background: ${VINH_COLORS.primaryDark};
    }
  ` : props.danger ? `
    background: ${VINH_COLORS.error};
    color: ${VINH_COLORS.white};
    &:hover {
      background: ${VINH_COLORS.errorDark};
    }
  ` : `
    background: ${VINH_COLORS.white};
    color: ${VINH_COLORS.textDark};
    border: 1px solid ${VINH_COLORS.border};
    &:hover {
      background: ${VINH_COLORS.backgroundLight};
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  svg {
    width: 20px;
    height: 20px;
    
    &.spinning {
      animation: spin 1s linear infinite;
      @keyframes spin {
        100% { transform: rotate(360deg); }
      }
    }
  }
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 200px;
  padding: var(--spacing-md);
  border: 1px solid ${VINH_COLORS.border};
  border-radius: var(--radius-md);
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: ${VINH_COLORS.primary};
    box-shadow: 0 0 0 2px ${VINH_COLORS.primaryLight};
  }
`;

const DocumentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-lg);
`;

const DocumentCard = styled.div`
  background: ${VINH_COLORS.white};
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-md);
  border: 1px solid ${VINH_COLORS.border};
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
  }
`;

const DocumentHeader = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
`;

const DocumentIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: ${VINH_COLORS.primaryLight};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${VINH_COLORS.primary};
  font-size: 1.25rem;
`;

const DocumentTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${VINH_COLORS.textDark};
  margin: 0;
`;

const DocumentInfo = styled.div`
  color: ${VINH_COLORS.textLight};
  font-size: 0.9rem;
  margin-top: var(--spacing-sm);
`;

const DocumentActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
`;

const LoadingSpinner = styled(FiLoader)`
  animation: spin 1s linear infinite;
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  color: ${VINH_COLORS.error};
  padding: var(--spacing-md);
  background: ${VINH_COLORS.errorLight};
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
`;

const EmptyState = styled.div`
  text-align: center;
  padding: var(--spacing-xl);
  color: ${VINH_COLORS.textLight};
`;

const Input = styled.input`
  width: 100%;
  padding: var(--spacing-md);
  border: 1px solid ${VINH_COLORS.border};
  border-radius: var(--radius-md);
  font-size: 1rem;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${VINH_COLORS.primary};
    box-shadow: 0 0 0 2px ${VINH_COLORS.primaryLight};
  }

  &::placeholder {
    color: ${VINH_COLORS.textLight};
  }
`;

const NumberInput = styled(Input).attrs({ type: 'number' })`
  width: 120px;
`;

const FlexContainer = styled.div`
  display: flex;
  gap: var(--spacing-md);
  align-items: ${props => props.alignItems || 'center'};
  justify-content: ${props => props.justifyContent || 'flex-start'};
  flex-wrap: ${props => props.wrap ? 'wrap' : 'nowrap'};
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${VINH_COLORS.primaryLight};
  border-top-color: ${VINH_COLORS.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: var(--spacing-xl) auto;

  @keyframes spin {
    100% { transform: rotate(360deg); }
  }
`;

const DocumentManager = () => {
  const { getCollections, uploadDocument, deleteCollection, isLoading, api } = useApi();
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
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

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

  useEffect(() => {
    fetchDocuments();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/documents');
      setDocuments(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch documents');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentId) => {
    try {
      await api.delete(`/documents/${documentId}`);
      fetchDocuments();
    } catch (err) {
      setError('Failed to delete document');
      console.error(err);
    }
  };

  return (
    <AdminLayout>
      <ManagerContainer>
        <Header>
          <Title>Quản lý tài liệu</Title>
          <Description>
            Tải lên và quản lý các tài liệu được sử dụng bởi chatbot. Hỗ trợ các định dạng PDF, DOCX, và TXT.
          </Description>
        </Header>

        {error && (
          <ErrorMessage>
            <FiAlertCircle /> {error}
          </ErrorMessage>
        )}

        <ActionBar>
          <Button as="label" primary>
            <FiUpload /> Tải lên tài liệu
            <input
              type="file"
              multiple
              accept=".pdf,.docx,.txt"
              onChange={handleUpload}
              style={{ display: 'none' }}
            />
          </Button>
          <SearchInput
            placeholder="Tìm kiếm tài liệu..."
            value={searchQuery}
            onChange={(e) => debouncedSearch(e.target.value)}
          />
        </ActionBar>

        {loading ? (
          <EmptyState>
            <LoadingSpinner size={32} />
            <p>Đang tải dữ liệu...</p>
          </EmptyState>
        ) : documents.length === 0 ? (
          <EmptyState>
            <FiFolder size={32} />
            <p>Chưa có tài liệu nào được tải lên</p>
          </EmptyState>
        ) : (
          <DocumentGrid>
            {documents.map(doc => (
              <DocumentCard key={doc.id}>
                <DocumentHeader>
                  <DocumentIcon>
                    <FiFile />
                  </DocumentIcon>
                  <DocumentTitle>{doc.name}</DocumentTitle>
                </DocumentHeader>
                <DocumentInfo>
                  Kích thước: {doc.size}
                  <br />
                  Ngày tải lên: {new Date(doc.uploadedAt).toLocaleDateString()}
                </DocumentInfo>
                <DocumentActions>
                  <Button delete onClick={() => handleDelete(doc.id)}>
                    <FiTrash2 /> Xóa
                  </Button>
                </DocumentActions>
              </DocumentCard>
            ))}
          </DocumentGrid>
        )}
      </ManagerContainer>
    </AdminLayout>
  );
};

export default DocumentManager; 
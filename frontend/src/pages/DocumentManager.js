import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FiUpload, FiTrash2, FiEdit, FiSearch, FiFilter, FiFolder, FiRefreshCw, FiFileText, FiCheck, FiX } from 'react-icons/fi';
import AdminLayout from '../components/AdminLayout';
import { useApi } from '../context/ApiContext';
import { toast } from 'react-toastify';
import debounce from 'lodash/debounce';
import { getCachedCollections, setCachedCollections, clearCachedCollections } from '../utils/collectionSessionCache';

const PageContainer = styled.div`
  background: var(--white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-lg);
  min-height: calc(100vh - 120px);
`;

const PageTitle = styled.h2`
  color: var(--primary-color);
  margin-bottom: var(--spacing-lg);
  font-size: 1.75rem;
  font-weight: 600;
  border-bottom: 2px solid var(--primary-light);
  padding-bottom: var(--spacing-md);
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
  
  button {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--white);
    border: 1px solid var(--primary-color);
    color: var(--primary-color);
    border-radius: var(--radius-md);
    transition: all 0.2s;
    
    &:hover {
      background: var(--primary-light);
      color: var(--white);
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .spinning {
      animation: spin 1s linear infinite;
    }
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: var(--spacing-xs);
  color: var(--almost-black);
`;

const Subtitle = styled.p`
  color: var(--dark-gray);
  font-size: 1.1rem;
`;

const TabsContainer = styled.div`
  display: flex;
  margin-bottom: var(--spacing-lg);
  border-bottom: 2px solid var(--light-gray);
  gap: var(--spacing-md);
`;

const Tab = styled.button`
  padding: var(--spacing-md) var(--spacing-lg);
  background: none;
  border: none;
  border-bottom: 2px solid ${props => props.active ? 'var(--primary-color)' : 'transparent'};
  color: ${props => props.active ? 'var(--primary-color)' : 'var(--dark-gray)'};
  font-weight: ${props => props.active ? '600' : '400'};
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: -2px;
  
  &:hover {
    color: var(--primary-color);
    background: var(--primary-lightest);
  }
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  gap: var(--spacing-md);
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const SearchContainer = styled.div`
  display: flex;
  gap: var(--spacing-sm);
  width: 300px;
  
  input {
    flex-grow: 1;
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--mid-gray);
    border-radius: var(--radius-md);
    font-size: 1rem;
    
    &:focus {
      border-color: var(--primary-color);
      outline: none;
      box-shadow: 0 0 0 2px var(--primary-lightest);
    }
  }
  
  button {
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--white);
    border: 1px solid var(--mid-gray);
    border-radius: var(--radius-md);
    color: var(--dark-gray);
    
    &:hover {
      background: var(--light-gray);
      border-color: var(--dark-gray);
    }
  }
  
  @media (max-width: 768px) {
    width: 100%;
  }
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
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--light-gray);
  transition: all 0.2s;
  
  &:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
    border-color: var(--primary-light);
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
  background-color: var(--primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    color: var(--white);
    font-size: 1.5rem;
  }
`;

const CollectionTitle = styled.h3`
  font-size: 1.2rem;
  margin: var(--spacing-sm) 0;
  color: var(--almost-black);
  word-break: break-word;
`;

const CollectionStats = styled.div`
  font-size: 0.9rem;
  color: var(--gray);
  display: flex;
  gap: var(--spacing-md);
  
  div {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    
    svg {
      color: var(--primary-color);
    }
  }
`;

const CollectionActions = styled.div`
  display: flex;
  gap: var(--spacing-xs);
  
  button {
    padding: var(--spacing-xs);
    min-width: 32px;
    height: 32px;
    border-radius: var(--radius-sm);
    
    &.button-secondary {
      background: var(--white);
      border: 1px solid var(--mid-gray);
      color: var(--dark-gray);
      
      &:hover {
        background: var(--light-gray);
        border-color: var(--dark-gray);
      }
    }
    
    &.button-danger {
      background: var(--white);
      border: 1px solid var(--error-color);
      color: var(--error-color);
      
      &:hover {
        background: var(--error-light);
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
  max-width: 800px;
  margin: 0 auto;
`;

const FormGroup = styled.div`
  margin-bottom: var(--spacing-lg);
`;

const Label = styled.label`
  display: block;
  margin-bottom: var(--spacing-xs);
  font-weight: 500;
  color: var(--almost-black);
`;

const UploadArea = styled.div`
  border: 2px dashed var(--primary-light);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--primary-lightest);
  
  &:hover {
    border-color: var(--primary-color);
    background: var(--primary-lighter);
  }
  
  input {
    display: none;
  }
`;

const UploadIcon = styled.div`
  font-size: 2.5rem;
  color: var(--primary-color);
  margin-bottom: var(--spacing-md);
`;

const UploadText = styled.div`
  color: var(--dark-gray);
  
  p {
    margin: var(--spacing-xs) 0;
  }
  
  .mt-sm {
    margin-top: var(--spacing-sm);
    font-size: 0.9rem;
    color: var(--gray);
  }
`;

const SelectedFile = styled.div`
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--white);
  border: 1px solid var(--primary-light);
  border-radius: var(--radius-md);
  color: var(--almost-black);
  
  svg {
    color: var(--primary-color);
  }
`;

const UploadProgress = styled.div`
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--white);
  border-radius: var(--radius-md);
  border: 1px solid var(--light-gray);
`;

const StatusSteps = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-md);
  gap: var(--spacing-md);
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const StatusStep = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
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
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background-color: var(--light-gray);
  border-radius: 4px;
  overflow: hidden;
  margin: var(--spacing-md) 0;
`;

const ProgressFill = styled.div`
  width: ${props => props.progress}%;
  height: 100%;
  background-color: var(--primary-color);
  transition: width 0.3s ease;
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
  font-size: 0.9rem;
  margin-top: var(--spacing-sm);
  
  svg {
    ${props => props.status === 'processing' && `
      animation: spin 1s linear infinite;
      @keyframes spin {
        100% { transform: rotate(360deg); }
      }
    `}
  }
`;

const EditDocumentModal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--white);
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  z-index: 1000;
  
  h2 {
    color: var(--primary-color);
    margin-bottom: var(--spacing-md);
    font-size: 1.5rem;
  }
  
  p {
    color: var(--dark-gray);
    margin-bottom: var(--spacing-lg);
  }
  
  .mt-lg {
    margin-top: var(--spacing-lg);
    display: flex;
    gap: var(--spacing-md);
    
    button {
      flex: 1;
      padding: var(--spacing-md);
      font-weight: 500;
      
      &.button-secondary {
        background: var(--white);
        border: 1px solid var(--mid-gray);
        color: var(--dark-gray);
        
        &:hover {
          background: var(--light-gray);
          border-color: var(--dark-gray);
        }
      }
    }
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  backdrop-filter: blur(2px);
`;

const ActionButtons = styled.div`
  display: flex;
  gap: var(--spacing-sm);
`;

const EmptyState = styled.div`
  text-align: center;
  padding: var(--spacing-xl);
  background: var(--white);
  border-radius: var(--radius-lg);
  border: 2px dashed var(--light-gray);
  margin: var(--spacing-xl) 0;

  p {
    color: var(--gray);
    margin-bottom: var(--spacing-md);
  }

  button {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
  }
`;

const Card = styled.div`
  background: var(--white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--light-gray);

  h2 {
    color: var(--primary-color);
    margin-bottom: var(--spacing-lg);
    font-size: 1.5rem;
    font-weight: 600;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormField = styled.div`
  &.full-width {
    grid-column: 1 / -1;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--mid-gray);
  border-radius: var(--radius-md);
  font-size: 1rem;
  transition: all 0.2s;
  background: var(--white);

  &:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px var(--primary-lightest);
    outline: none;
  }

  &:disabled {
    background: var(--light-gray);
    cursor: not-allowed;
  }

  &[type="date"] {
    min-height: 38px;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--mid-gray);
  border-radius: var(--radius-md);
  font-size: 1rem;
  transition: all 0.2s;
  background: var(--white);
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right var(--spacing-sm) center;
  background-size: 1em;

  &:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px var(--primary-lightest);
    outline: none;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--mid-gray);
  border-radius: var(--radius-md);
  font-size: 1rem;
  transition: all 0.2s;
  resize: vertical;
  min-height: 100px;

  &:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px var(--primary-lightest);
    outline: none;
  }
`;

const FilterContainer = styled.div`
  display: flex;
  gap: var(--spacing-md);
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const DocumentDetails = styled.div`
  display: flex;
  gap: var(--spacing-md);
  font-size: 0.875rem;
  color: var(--gray);
  margin-top: var(--spacing-xs);
  
  span {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-md);
  margin-top: var(--spacing-xl);
  
  button {
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--primary-color);
    border-radius: var(--radius-md);
    background: var(--white);
    color: var(--primary-color);
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    &:not(:disabled):hover {
      background: var(--primary-light);
      color: var(--white);
    }
  }
  
  span {
    color: var(--dark-gray);
  }
`;

const DocumentManager = () => {
  const { getCollections, uploadDocument, deleteCollection, deleteDocument, isLoading } = useApi();
  const [activeTab, setActiveTab] = useState('documents');
  const [documents, setDocuments] = useState([]);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [newFile, setNewFile] = useState(null);
  const [filterDocumentType, setFilterDocumentType] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [uploadConfig, setUploadConfig] = useState({
    chunkSize: 1000,
    chunkOverlap: 200,
    metadata: {
      document_type: '',
      department: '',
      display_name: '',
      description: '',
      impact_date: '',
      effective_date: '',
      expiry_date: '',
      reference_number: '',
    }
  });

  // Constants for chunking configuration
  const CHUNKING_CONFIG = {
    DEFAULT_CHUNK_SIZE: 1000,
    DEFAULT_CHUNK_OVERLAP: 200,
    MIN_CHUNK_SIZE: 100,
    MAX_CHUNK_SIZE: 10000,
    MIN_CHUNK_OVERLAP: 0,
    MAX_CHUNK_OVERLAP: 5000
  };

  // Fixed collection config from backend
  const COLLECTION_CONFIG = {
    name: "truong_dai_hoc_vinh",
    displayName: "Dữ liệu Trường Đại học Vinh",
    description: "Tập dữ liệu tổng hợp của Trường Đại học Vinh"
  };

  // Fetch documents from PostgreSQL
  const fetchDocuments = useCallback(async () => {
    if (isRefreshing) return;
    try {
      setIsRefreshing(true);
      const url = `http://localhost:8000/api/documents/postgresql/documents?skip=${(currentPage - 1) * pageSize}&limit=${pageSize}&document_type=${filterDocumentType}&department=${filterDepartment}`;
      console.log('Fetching documents from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        // Add credentials if your API requires authentication
        // credentials: 'include',
      });
      
      // Log the raw response for debugging
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Check if response is not ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API error: ${response.status} ${response.statusText}\n${errorText}`);
      }

      // Only try to parse JSON if response is ok
      const data = await response.json();
      console.log('Received data:', data);
      
      // Validate the response data structure
      if (!data || !Array.isArray(data.items)) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from API');
      }

      setDocuments(data.items);
      setTotalDocuments(data.total || 0);
    } catch (error) {
      console.error('Detailed error information:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // More user-friendly error message based on error type
      let errorMessage = 'Failed to fetch documents: ';
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        errorMessage += 'Cannot connect to server. Please check if the server is running.';
      } else if (error.message.includes('API error: 500')) {
        errorMessage += 'Server encountered an error. Please try again later.';
      } else if (error.message.includes('API error: 404')) {
        errorMessage += 'The requested resource was not found.';
      } else {
        errorMessage += error.message;
      }
      
      toast.error(errorMessage);
      // Reset the documents state to empty on error
      setDocuments([]);
      setTotalDocuments(0);
    } finally {
      setIsRefreshing(false);
    }
  }, [currentPage, pageSize, filterDocumentType, filterDepartment]);

  // Fetch documents when filters or pagination changes
  useEffect(() => {
    if (!isRefreshing) {
      fetchDocuments();
    }
  }, [fetchDocuments, currentPage, pageSize, filterDocumentType, filterDepartment]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadStatus(null);
      setUploadProgress(0);
      // Set display name from file name as suggestion
      setUploadConfig(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          display_name: file.name.split('.')[0]
        }
      }));
    }
  };

  const handleUploadConfigChange = (event) => {
    const { name, value } = event.target;
    setUploadConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const refreshCollectionsCache = async () => {
    await fetch('http://localhost:8000/api/manage/collections/refresh', { method: 'POST' });
    clearCachedCollections(); // Xóa cache FE để lần sau lấy lại từ backend
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    // Validate required fields
    const requiredFields = {
      'document_type': 'Document Type',
      'department': 'Department',
      'display_name': 'Display Name'
    };

    for (const [field, label] of Object.entries(requiredFields)) {
      if (!uploadConfig.metadata[field]) {
        toast.error(`${label} is required`);
        return;
      }
    }
    
    try {
      setUploadStep('sending');
      setUploadStatus({ status: 'processing', message: 'Sending document to server...' });
      setUploadProgress(0);
      
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      // Add file metadata
      const enhancedMetadata = {
        ...uploadConfig.metadata,
        original_filename: selectedFile.name,
        file_size: selectedFile.size,
        file_type: selectedFile.type,
        upload_date: new Date().toISOString(),
        upload_by: "admin" // Or get from auth context
      };

      // Create FormData
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('chunk_size', uploadConfig.chunkSize.toString());
      formData.append('chunk_overlap', uploadConfig.chunkOverlap.toString());
      formData.append('metadata', JSON.stringify(enhancedMetadata));
      
      const response = await uploadDocument(selectedFile, formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (response && response.status === 'processing') {
        setUploadStep('processing');
        setUploadStatus({
          status: 'processing',
          message: 'Processing document and storing in the system...'
        });
        
        // Poll for document status
        const statusCheckInterval = setInterval(async () => {
          try {
            const statusResponse = await fetch(`/api/documents/status/${response.file_id}`);
            const statusData = await statusResponse.json();
            
            if (statusData.status === 'completed') {
              clearInterval(statusCheckInterval);
              setUploadStep('created');
              setUploadStatus({
                status: 'success',
                message: 'Document processed and stored successfully!'
              });
              toast.success('Document processed and stored successfully!');
              
              // Reset form and refresh documents
              setTimeout(() => {
                setSelectedFile(null);
                setUploadConfig({
                  chunkSize: 1000,
                  chunkOverlap: 200,
                  metadata: {
                    document_type: '',
                    department: '',
                    display_name: '',
                    description: '',
                    impact_date: '',
                    effective_date: '',
                    expiry_date: '',
                    reference_number: '',
                  }
                });
                setUploadStatus(null);
                setUploadProgress(0);
                setUploadStep(null);
                const fileInput = document.getElementById('file-upload');
                if (fileInput) {
                  fileInput.value = '';
                }
                fetchDocuments();
              }, 3000);
            } else if (statusData.status === 'failed') {
              clearInterval(statusCheckInterval);
              setUploadStep(null);
              setUploadStatus({
                status: 'error',
                message: statusData.error || 'Failed to process document'
              });
              toast.error(statusData.error || 'Failed to process document');
            }
          } catch (error) {
            console.error('Error checking document status:', error);
          }
        }, 2000);
        
      } else {
        throw new Error('Upload failed');
      }
      
    } catch (error) {
      setUploadStatus({
        status: 'error',
        message: error.message || 'Failed to upload document'
      });
      setUploadStep(null);
      toast.error(error.message || 'Failed to upload document');
      setUploadProgress(0);
    }
  };

  const handleDeleteCollection = async (collectionName) => {
    if (window.confirm(`Are you sure you want to delete collection "${collectionName}"? This action cannot be undone.`)) {
      try {
        await deleteCollection(collectionName);
        await refreshCollectionsCache();
        await fetchDocuments();
      } catch (error) {
        toast.error('Failed to delete collection');
      }
    }
  };

  const handleEditDocument = async (document) => {
    setEditingDocument(document);
  };

  const handleUpdateDocument = async (event) => {
    event.preventDefault();
    
    if (!newFile || !editingDocument) {
      return;
    }
    
    try {
      setUploadStep('sending');
      setUploadStatus({ status: 'processing', message: 'Updating document...' });
      setUploadProgress(0);
      
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      // Add file metadata
      const enhancedMetadata = {
        ...uploadConfig.metadata,
        document_id: editingDocument.document_id,
        original_filename: newFile.name,
        file_size: newFile.size,
        file_type: newFile.type,
        update_date: new Date().toISOString(),
        updated_by: "admin" // Or get from auth context
      };
      
      const response = await uploadDocument(
        newFile,
        null, // No collection name needed
        {
          chunk_size: parseInt(uploadConfig.chunkSize),
          chunk_overlap: parseInt(uploadConfig.chunkOverlap),
          metadata: enhancedMetadata,
          is_update: true // Flag to indicate this is an update
        }
      );
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (response && response.status === 'processing') {
        setUploadStep('processing');
        setUploadStatus({
          status: 'processing',
          message: 'Processing updated document...'
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setUploadStep('created');
        setUploadStatus({
          status: 'success',
          message: 'Document updated successfully!'
        });
        toast.success('Document updated successfully!');
      } else {
        throw new Error('Update failed');
      }
      
      setTimeout(async () => {
        setEditingDocument(null);
        setNewFile(null);
        setUploadStatus(null);
        setUploadProgress(0);
        setUploadStep(null);
        await refreshCollectionsCache();
        fetchDocuments();
      }, 3000);
      
    } catch (error) {
      setUploadStatus({
        status: 'error',
        message: error.message || 'Failed to update document'
      });
      setUploadStep(null);
      toast.error('Failed to update document');
      setUploadProgress(0);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (window.confirm(`Are you sure you want to delete this document? This action cannot be undone.`)) {
      try {
        const response = await fetch(`/api/documents/${documentId}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete document');
        }
        
        toast.success('Document deleted successfully');
        fetchDocuments();
      } catch (error) {
        console.error('Error deleting document:', error);
        toast.error('Failed to delete document');
      }
    }
  };

  // Debounce the search query to prevent rapid API calls
  const debouncedSearch = useCallback(
    debounce((query) => {
      setSearchQuery(query);
    }, 300),
    []
  );

  const filteredDocuments = documents.filter(document => 
    document.metadata?.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <PageContainer>
        <PageTitle>Trang quản lý tài liệu của quản trị viên</PageTitle>
        <PageHeader>
          <div>
            <Title>Quản lý tài liệu</Title>
            <Subtitle>Hệ thống quản lý tài liệu Trường Đại học Vinh</Subtitle>
          </div>
          
          <button 
            onClick={fetchDocuments} 
            disabled={isLoading || isRefreshing}
          >
            <FiRefreshCw className={isRefreshing ? 'spinning' : ''} /> 
            {isRefreshing ? 'Đang tải...' : 'Làm mới'}
          </button>
        </PageHeader>
        
        <TabsContainer>
          <Tab 
            active={activeTab === 'documents'} 
            onClick={() => setActiveTab('documents')}
          >
            Danh sách tài liệu
          </Tab>
          <Tab 
            active={activeTab === 'upload'} 
            onClick={() => setActiveTab('upload')}
          >
            Tải lên tài liệu
          </Tab>
        </TabsContainer>
        
        {activeTab === 'documents' && (
          <>
            <ActionBar>
              <SearchContainer>
                <input 
                  type="text" 
                  placeholder="Tìm kiếm tài liệu..." 
                  onChange={(e) => debouncedSearch(e.target.value)}
                />
                <button className="button-secondary">
                  <FiSearch />
                </button>
              </SearchContainer>
              
              <FilterContainer>
                <Select
                  value={filterDocumentType}
                  onChange={(e) => setFilterDocumentType(e.target.value)}
                >
                  <option value="">Tất cả loại văn bản</option>
                  <option value="REGULATION">Quy định</option>
                  <option value="POLICY">Chính sách</option>
                  <option value="NOTICE">Thông báo</option>
                  <option value="CIRCULAR">Thông tư</option>
                  <option value="DECISION">Quyết định</option>
                  <option value="GUIDELINE">Hướng dẫn</option>
                </Select>
                
                <Select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                >
                  <option value="">Tất cả phòng ban</option>
                  <option value="ACADEMIC_AFFAIRS">Phòng Đào tạo</option>
                  <option value="STUDENT_AFFAIRS">Phòng Công tác sinh viên</option>
                  <option value="SCIENCE_TECHNOLOGY">Phòng Khoa học công nghệ</option>
                  <option value="FINANCE">Phòng Tài chính</option>
                  <option value="PERSONNEL">Phòng Tổ chức cán bộ</option>
                  <option value="INTERNATIONAL">Phòng Hợp tác quốc tế</option>
                  <option value="QUALITY_ASSURANCE">Phòng Đảm bảo chất lượng</option>
                  <option value="FACILITY">Phòng Cơ sở vật chất</option>
                  <option value="GENERAL">Văn phòng</option>
                </Select>
              </FilterContainer>
              
              <ActionButtons>
                <button onClick={() => setActiveTab('upload')}>
                  <FiUpload /> Tải lên tài liệu
                </button>
              </ActionButtons>
            </ActionBar>
            
            {isLoading ? (
              <div className="spinner" />
            ) : documents.length > 0 ? (
              <>
                <DocumentsList>
                  {documents.map(doc => (
                    <DocumentItem key={doc.id}>
                      <DocumentInfo>
                        <DocumentTitle>{doc.display_name}</DocumentTitle>
                        <DocumentMeta>
                          {doc.document_type} • {doc.department} • 
                          Ngày ban hành: {new Date(doc.impact_date).toLocaleDateString('vi-VN')}
                        </DocumentMeta>
                        <DocumentDetails>
                          <span>Số tham chiếu: {doc.reference_number}</span>
                          <span>Số chunks: {doc.total_chunks}</span>
                          <span>Kích thước: {(doc.file_size / 1024).toFixed(2)} KB</span>
                        </DocumentDetails>
                      </DocumentInfo>
                      <DocumentActions>
                        <button className="button-secondary" onClick={() => handleEditDocument(doc)}>
                          <FiEdit />
                        </button>
                        <button className="button-danger" onClick={() => handleDeleteDocument(doc.document_id)}>
                          <FiTrash2 />
                        </button>
                      </DocumentActions>
                    </DocumentItem>
                  ))}
                </DocumentsList>
                
                <Pagination>
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <span>
                    Page {currentPage} of {Math.ceil(totalDocuments / pageSize)}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage >= Math.ceil(totalDocuments / pageSize)}
                  >
                    Next
                  </button>
                </Pagination>
              </>
            ) : (
              <EmptyState>
                <p>Chưa có tài liệu nào. Tải lên tài liệu đầu tiên của bạn.</p>
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
                <Label>Thông tin văn bản</Label>
                <FormGrid>
                  <FormField>
                    <Label htmlFor="document_type">Loại văn bản</Label>
                    <Select
                      id="document_type"
                      name="document_type"
                      value={uploadConfig.metadata.document_type}
                      onChange={(e) => setUploadConfig(prev => ({
                        ...prev,
                        metadata: {
                          ...prev.metadata,
                          document_type: e.target.value
                        }
                      }))}
                    >
                      <option value="">Chọn loại văn bản</option>
                      <option value="REGULATION">Quy định</option>
                      <option value="POLICY">Chính sách</option>
                      <option value="NOTICE">Thông báo</option>
                      <option value="CIRCULAR">Thông tư</option>
                      <option value="DECISION">Quyết định</option>
                      <option value="GUIDELINE">Hướng dẫn</option>
                    </Select>
                  </FormField>
                  
                  <FormField>
                    <Label htmlFor="department">Phòng ban phát hành</Label>
                    <Select
                      id="department"
                      value={uploadConfig.metadata.department}
                      onChange={(e) => setUploadConfig(prev => ({
                        ...prev,
                        metadata: {
                          ...prev.metadata,
                          department: e.target.value
                        }
                      }))}
                    >
                      <option value="">Chọn phòng ban</option>
                      <option value="ACADEMIC_AFFAIRS">Phòng Đào tạo</option>
                      <option value="STUDENT_AFFAIRS">Phòng Công tác sinh viên</option>
                      <option value="SCIENCE_TECHNOLOGY">Phòng Khoa học công nghệ</option>
                      <option value="FINANCE">Phòng Tài chính</option>
                      <option value="PERSONNEL">Phòng Tổ chức cán bộ</option>
                      <option value="INTERNATIONAL">Phòng Hợp tác quốc tế</option>
                      <option value="QUALITY_ASSURANCE">Phòng Đảm bảo chất lượng</option>
                      <option value="FACILITY">Phòng Cơ sở vật chất</option>
                      <option value="GENERAL">Văn phòng</option>
                    </Select>
                  </FormField>
                  
                  <FormField>
                    <Label htmlFor="display_name">Tên hiển thị</Label>
                    <Input
                      type="text"
                      id="display_name"
                      value={uploadConfig.metadata.display_name}
                      onChange={(e) => setUploadConfig(prev => ({
                        ...prev,
                        metadata: {
                          ...prev.metadata,
                          display_name: e.target.value
                        }
                      }))}
                      placeholder="Nhập tên hiển thị của văn bản"
                    />
                  </FormField>
                  
                  <FormField>
                    <Label htmlFor="reference_number">Số tham chiếu</Label>
                    <Input
                      type="text"
                      id="reference_number"
                      value={uploadConfig.metadata.reference_number}
                      onChange={(e) => setUploadConfig(prev => ({
                        ...prev,
                        metadata: {
                          ...prev.metadata,
                          reference_number: e.target.value
                        }
                      }))}
                      placeholder="VD: 123/QĐ-ĐHV"
                    />
                  </FormField>
                  
                  <FormField>
                    <Label htmlFor="impact_date">Ngày ban hành</Label>
                    <Input
                      type="date"
                      id="impact_date"
                      value={uploadConfig.metadata.impact_date}
                      onChange={(e) => setUploadConfig(prev => ({
                        ...prev,
                        metadata: {
                          ...prev.metadata,
                          impact_date: e.target.value
                        }
                      }))}
                    />
                  </FormField>
                  
                  <FormField>
                    <Label htmlFor="effective_date">Ngày hiệu lực</Label>
                    <Input
                      type="date"
                      id="effective_date"
                      value={uploadConfig.metadata.effective_date}
                      onChange={(e) => setUploadConfig(prev => ({
                        ...prev,
                        metadata: {
                          ...prev.metadata,
                          effective_date: e.target.value
                        }
                      }))}
                    />
                  </FormField>
                  
                  <FormField>
                    <Label htmlFor="expiry_date">Ngày hết hiệu lực</Label>
                    <Input
                      type="date"
                      id="expiry_date"
                      value={uploadConfig.metadata.expiry_date}
                      onChange={(e) => setUploadConfig(prev => ({
                        ...prev,
                        metadata: {
                          ...prev.metadata,
                          expiry_date: e.target.value
                        }
                      }))}
                    />
                  </FormField>
                  
                  <FormField className="full-width">
                    <Label htmlFor="description">Mô tả</Label>
                    <Textarea
                      id="description"
                      value={uploadConfig.metadata.description}
                      onChange={(e) => setUploadConfig(prev => ({
                        ...prev,
                        metadata: {
                          ...prev.metadata,
                          description: e.target.value
                        }
                      }))}
                      placeholder="Nhập mô tả về văn bản"
                      rows={3}
                    />
                  </FormField>
                </FormGrid>
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
                      min={CHUNKING_CONFIG.MIN_CHUNK_SIZE}
                      max={CHUNKING_CONFIG.MAX_CHUNK_SIZE}
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
                      min={CHUNKING_CONFIG.MIN_CHUNK_OVERLAP}
                      max={CHUNKING_CONFIG.MAX_CHUNK_OVERLAP}
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
        
        {editingDocument && (
          <>
            <Overlay onClick={() => setEditingDocument(null)} />
            <EditDocumentModal>
              <h2>Update Document Content</h2>
              <p>Document: {editingDocument.display_name}</p>
              
              <UploadForm onSubmit={handleUpdateDocument}>
                <FormGroup>
                  <Label htmlFor="new-file">Select New Document File</Label>
                  <UploadArea onClick={() => document.getElementById('new-file').click()}>
                    <input 
                      type="file" 
                      id="new-file" 
                      onChange={(e) => setNewFile(e.target.files[0])}
                      accept=".pdf,.docx,.txt,.md,.csv"
                    />
                    
                    <UploadIcon>
                      <FiUpload />
                    </UploadIcon>
                    
                    <UploadText>
                      {newFile ? (
                        <SelectedFile>
                          <FiFileText /> {newFile.name} ({(newFile.size / 1024).toFixed(2)} KB)
                        </SelectedFile>
                      ) : (
                        <>
                          <p>Click to select new document file</p>
                          <p className="mt-sm">Supported formats: PDF, DOCX, TXT, MD, CSV</p>
                        </>
                      )}
                    </UploadText>
                  </UploadArea>
                </FormGroup>
                
                {uploadStatus && (
                  <UploadProgress>
                    <StatusSteps>
                      <StatusStep 
                        completed={uploadStep === 'processing' || uploadStep === 'created'} 
                        active={uploadStep === 'sending'}
                      >
                        {uploadStep === 'sending' ? <FiRefreshCw /> : <FiCheck />}
                        Sending document
                      </StatusStep>
                      <StatusStep 
                        completed={uploadStep === 'created'} 
                        active={uploadStep === 'processing'}
                      >
                        {uploadStep === 'processing' ? <FiRefreshCw /> : 
                         uploadStep === 'created' ? <FiCheck /> : null}
                        Processing document
                      </StatusStep>
                      <StatusStep 
                        completed={uploadStep === 'created'} 
                        active={false}
                      >
                        {uploadStep === 'created' ? <FiCheck /> : null}
                        Update complete
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
                
                <div className="mt-lg">
                  <button 
                    type="submit" 
                    disabled={!newFile || uploadStatus?.status === 'processing'}
                  >
                    <FiUpload /> Update Document
                  </button>
                  <button 
                    type="button" 
                    className="button-secondary ml-sm" 
                    onClick={() => setEditingDocument(null)}
                  >
                    Cancel
                  </button>
                </div>
              </UploadForm>
            </EditDocumentModal>
          </>
        )}
      </PageContainer>
    </AdminLayout>
  );
};

export default DocumentManager; 
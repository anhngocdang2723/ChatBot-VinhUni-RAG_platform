import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiCheck, FiRefreshCw, FiSave, FiX, FiAlertTriangle, FiLoader } from 'react-icons/fi';
import AdminLayout from '../components/AdminLayout';
import { useApi } from '../context/ApiContext';
import { toast } from 'react-toastify';
import { VINH_COLORS } from '../config/colors';

const PageContainer = styled.div`
  padding: var(--spacing-xl);
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

const StatusContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  background-color: ${props => 
    props.connected ? `${VINH_COLORS.successLight}` : `${VINH_COLORS.errorLight}`};
  color: ${props => 
    props.connected ? VINH_COLORS.success : VINH_COLORS.error};
  border: 1px solid ${props => 
    props.connected ? VINH_COLORS.success : VINH_COLORS.error};
`;

const StatusIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${props => 
    props.connected ? VINH_COLORS.success : VINH_COLORS.error};
  color: ${VINH_COLORS.white};
  margin-right: var(--spacing-md);
  font-size: 1.25rem;
`;

const StatusText = styled.div`
  flex: 1;
  
  h3 {
    margin-bottom: var(--spacing-xs);
    font-weight: 600;
  }
  
  p {
    color: ${VINH_COLORS.textLight};
    font-size: 0.875rem;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
`;

const FormGroup = styled.div`
  margin-bottom: var(--spacing-md);
  
  input {
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
`;

const Label = styled.label`
  display: block;
  margin-bottom: var(--spacing-xs);
  font-weight: 500;
  color: ${VINH_COLORS.text};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
`;

const HelpText = styled.p`
  font-size: 0.875rem;
  color: ${VINH_COLORS.textLight};
  margin-top: var(--spacing-xs);
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

const CardTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  color: ${VINH_COLORS.text};
`;

const Settings = () => {
  const { 
    apiUrl, 
    apiKey,
    updateApiUrl,
    updateApiKey,
    isConnected, 
    checkConnection, 
    isLoading 
  } = useApi();
  
  const [formValues, setFormValues] = useState({
    apiUrl: '',
    apiKey: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    setFormValues({
      apiUrl: apiUrl || '',
      apiKey: apiKey || '',
    });
  }, [apiUrl, apiKey]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value.trim(),
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      // Update API configuration
      updateApiUrl(formValues.apiUrl);
      updateApiKey(formValues.apiKey);
      
      // Test connection
      const isConnected = await checkConnection();
      
      if (isConnected) {
        toast.success('API configuration updated successfully!');
      } else {
        toast.error('Could not connect to the API with the new configuration.');
      }
    } catch (error) {
      toast.error('Failed to update API configuration: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleTestConnection = async () => {
    const isConnected = await checkConnection();
    if (isConnected) {
      toast.success('Successfully connected to the API!');
    }
  };
  
  return (
    <AdminLayout>
      <PageContainer>
        <PageHeader>
          <HeaderContent>
            <Title>Cài đặt</Title>
            <Subtitle>Cấu hình kết nối API</Subtitle>
          </HeaderContent>
          
          <Button 
            onClick={handleTestConnection}
            disabled={isLoading || isSaving}
            variant="primary"
          >
            <FiRefreshCw className={isLoading ? 'spinning' : ''} /> 
            {isLoading ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}
          </Button>
        </PageHeader>
        
        <Card>
          <StatusContainer connected={isConnected}>
            <StatusIcon connected={isConnected}>
              {isConnected ? <FiCheck /> : <FiX />}
            </StatusIcon>
            <StatusText>
              <h3>Kết nối API: {isConnected ? 'Đã kết nối' : 'Mất kết nối'}</h3>
              <p>
                {isConnected 
                  ? 'Kết nối API hoạt động chính xác.' 
                  : 'Vui lòng kiểm tra URL và thông tin xác thực của bạn.'}
              </p>
            </StatusText>
          </StatusContainer>
          
          <CardTitle>Cấu hình API</CardTitle>
          
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label htmlFor="apiUrl">URL API</Label>
              <input
                type="url"
                id="apiUrl"
                name="apiUrl"
                value={formValues.apiUrl}
                onChange={handleChange}
                placeholder="http://localhost:8000/api"
                required
                pattern="https?://.+"
                title="Vui lòng nhập URL hợp lệ bắt đầu với http:// hoặc https://"
              />
              <HelpText>
                Định dạng URL của API RAG Chatbot (ví dụ: http://localhost:8000/api)
              </HelpText>
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="apiKey">API Key (nếu cần)</Label>
              <input
                type="password"
                id="apiKey"
                name="apiKey"
                value={formValues.apiKey}
                onChange={handleChange}
                placeholder="Nhập khóa API của bạn"
              />
              <HelpText>
                Để trống nếu API không yêu cầu xác thực
              </HelpText>
            </FormGroup>
            
            <ButtonGroup>
              <Button 
                type="submit" 
                variant="primary"
                disabled={isLoading || isSaving}
              >
                <FiSave /> 
                {isSaving ? 'Đang lưu...' : 'Lưu cấu hình'}
              </Button>
            </ButtonGroup>
          </Form>
        </Card>
        
        <Card>
          <CardTitle>Giới thiệu</CardTitle>
          <p>RAG Chatbot Interface v1.0.0</p>
          <p className="mt-md">
            Ứng dụng này cung cấp giao diện người dùng để tương tác với API RAG Chatbot của bạn.
            Tải lên tài liệu, quản lý tập tài liệu và truy vấn tài liệu bằng ngôn ngữ tự nhiên.
          </p>
        </Card>
      </PageContainer>
    </AdminLayout>
  );
};

export default Settings; 
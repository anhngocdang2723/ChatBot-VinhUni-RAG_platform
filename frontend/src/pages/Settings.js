import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiCheck, FiRefreshCw, FiSave, FiX, FiAlertTriangle } from 'react-icons/fi';
import Layout from '../components/Layout';
import { useApi } from '../context/ApiContext';
import { toast } from 'react-toastify';

const PageHeader = styled.div`
  margin-bottom: var(--spacing-xl);
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: var(--spacing-sm);
`;

const Subtitle = styled.p`
  color: var(--dark-gray);
`;

const Card = styled.div`
  background-color: var(--white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-md);
  margin-bottom: var(--spacing-xl);
`;

const StatusContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  background-color: ${props => 
    props.connected ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
  color: ${props => 
    props.connected ? 'var(--success-color)' : 'var(--error-color)'};
`;

const StatusIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${props => 
    props.connected ? 'var(--success-color)' : 'var(--error-color)'};
  color: var(--white);
  margin-right: var(--spacing-md);
`;

const StatusText = styled.div`
  flex: 1;
  
  h3 {
    margin-bottom: var(--spacing-xs);
  }
  
  p {
    color: var(--dark-gray);
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
`;

const Label = styled.label`
  display: block;
  margin-bottom: var(--spacing-xs);
  font-weight: 500;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
`;

const HelpText = styled.p`
  font-size: 0.875rem;
  color: var(--gray);
  margin-top: var(--spacing-xs);
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
    <Layout>
      <PageHeader>
        <Title>Settings</Title>
        <Subtitle>Configure your API connection</Subtitle>
      </PageHeader>
      
      <Card>
        <StatusContainer connected={isConnected}>
          <StatusIcon connected={isConnected}>
            {isConnected ? <FiCheck /> : <FiX />}
          </StatusIcon>
          <StatusText>
            <h3>API Connection: {isConnected ? 'Connected' : 'Disconnected'}</h3>
            <p>
              {isConnected 
                ? 'Your API connection is working correctly.' 
                : 'Please check your API URL and credentials.'}
            </p>
          </StatusText>
          <button 
            className="button-secondary" 
            onClick={handleTestConnection}
            disabled={isLoading || isSaving}
          >
            <FiRefreshCw className={isLoading ? 'spinning' : ''} /> 
            Test Connection
          </button>
        </StatusContainer>
        
        <h2>API Configuration</h2>
        
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="apiUrl">API URL</Label>
            <input
              type="url"
              id="apiUrl"
              name="apiUrl"
              value={formValues.apiUrl}
              onChange={handleChange}
              placeholder="http://localhost:8000/api"
              required
              pattern="https?://.+"
              title="Please enter a valid URL starting with http:// or https://"
            />
            <HelpText>
              The base URL for your RAG Chatbot API (e.g., http://localhost:8000/api)
            </HelpText>
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="apiKey">API Key (if required)</Label>
            <input
              type="password"
              id="apiKey"
              name="apiKey"
              value={formValues.apiKey}
              onChange={handleChange}
              placeholder="Enter your API key"
            />
            <HelpText>
              Leave blank if your API doesn't require authentication
            </HelpText>
          </FormGroup>
          
          <ButtonGroup>
            <button 
              type="submit" 
              className="button-primary"
              disabled={isLoading || isSaving}
            >
              <FiSave /> 
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </button>
          </ButtonGroup>
        </Form>
      </Card>
      
      <Card>
        <h2>About</h2>
        <p>RAG Chatbot Interface v1.0.0</p>
        <p className="mt-md">
          This application provides a user interface for interacting with your RAG Chatbot API.
          Upload documents, manage collections, and query your documents using natural language.
        </p>
      </Card>
    </Layout>
  );
};

export default Settings; 
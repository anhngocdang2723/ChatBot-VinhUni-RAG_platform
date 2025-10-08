import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_CONFIG, API_ENDPOINTS, ERROR_MESSAGES, getHeaders, handleError } from '../api/config';

// Create context
const ApiContext = createContext();

export const ApiProvider = ({ children }) => {
  const [apiUrl, setApiUrl] = useState(
    localStorage.getItem('apiUrl') || API_CONFIG.BASE_URL
  );
  const [apiKey, setApiKey] = useState(
    localStorage.getItem('apiKey') || ''
  );
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Create axios instance with base configuration
  const api = axios.create({
    baseURL: apiUrl,
    timeout: API_CONFIG.TIMEOUT,
    headers: getHeaders(apiKey),
    withCredentials: true // Enable credentials to send session cookies
  });

  // Check if API is connected using health endpoint
  const checkConnection = useCallback(async () => {
    if (isLoading) return false; // Prevent multiple simultaneous checks
    
    setIsLoading(true);
    try {
      const response = await api.get(API_ENDPOINTS.HEALTH);
      const isOk = response.data.status === 'ok';
      setIsConnected(isOk);
      if (!isOk) {
        toast.error(ERROR_MESSAGES.CONNECTION_ERROR);
      }
      return isOk;
    } catch (error) {
      console.error('API connection error:', error);
      setIsConnected(false);
      toast.error(ERROR_MESSAGES.CONNECTION_ERROR);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [api, isLoading]);

  // Add response interceptor for error handling and health checks
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      response => response,
      async error => {
        // Check connection on network errors or if server is unreachable
        if (error.message === 'Network Error' || error.response?.status === 503) {
          await checkConnection();
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptor on unmount
    return () => api.interceptors.response.eject(interceptor);
  }, [api, checkConnection]);

  // Update API URL
  const updateApiUrl = useCallback((newUrl) => {
    // Ensure URL ends with /api
    const formattedUrl = newUrl.endsWith('/api') ? newUrl : `${newUrl}/api`;
    setApiUrl(formattedUrl);
    localStorage.setItem('apiUrl', formattedUrl);
    api.defaults.baseURL = formattedUrl;
    // Check connection after URL update
    checkConnection();
  }, [api, checkConnection]);

  // Update API Key
  const updateApiKey = useCallback((newKey) => {
    setApiKey(newKey);
    localStorage.setItem('apiKey', newKey);
    api.defaults.headers.common['Authorization'] = newKey ? `Bearer ${newKey}` : undefined;
  }, [api]);

  // Initialize connection check only once on mount
  useEffect(() => {
    checkConnection();
  }, []); // Empty dependency array = only run once on mount

  // API Methods with improved error handling
  const getCollections = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.COLLECTIONS);
      return response.data;
    } catch (error) {
      handleError(error);
      return [];
    }
  };

  const getRawCollections = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.RAW_COLLECTIONS);
      return response.data;
    } catch (error) {
      handleError(error);
      return [];
    }
  };

  const queryRag = async (queryData) => {
    try {
      const response = await api.post(`${API_ENDPOINTS.QUERY}/rag`, queryData);
      return response.data;
    } catch (error) {
      handleError(error);
      return null;
    }
  };

  const retrieveDocuments = async (queryData) => {
    try {
      const response = await api.post(`${API_ENDPOINTS.QUERY}/retrieve`, queryData);
      return response.data;
    } catch (error) {
      handleError(error);
      return [];
    }
  };

  const uploadDocument = async (file, collectionName = null, config = {}) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (collectionName) {
        formData.append('collection_name', collectionName);
      }

      // Add chunking configuration
      if (config.chunk_size) {
        formData.append('chunk_size', config.chunk_size.toString());
      }
      if (config.chunk_overlap) {
        formData.append('chunk_overlap', config.chunk_overlap.toString());
      }

      // Add metadata if provided
      if (config.metadata) {
        formData.append('metadata', JSON.stringify(config.metadata));
      }

      const response = await api.post(API_ENDPOINTS.DOCUMENTS + '/upload', formData, {
        headers: {
          ...getHeaders(apiKey),
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      handleError(error);
      return null;
    }
  };

  const deleteDocument = async (documentId) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.DOCUMENTS}/${documentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete document');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  };

  const value = {
    apiUrl,
    apiKey,
    isConnected,
    isLoading,
    updateApiUrl,
    updateApiKey,
    getCollections,
    getRawCollections,
    queryRag,
    retrieveDocuments,
    uploadDocument,
    deleteDocument,
  };

  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  );
};

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}; 
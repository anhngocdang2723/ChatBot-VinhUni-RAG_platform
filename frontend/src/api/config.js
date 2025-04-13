    // API Configuration
    export const API_CONFIG = {
        BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api' || 'https://freehosting.id.vn/api',
        TIMEOUT: 30000, // 30 seconds
        RETRY_ATTEMPTS: 5,
        RETRY_DELAY: 10000, // 10 seconds
    };

    // API Endpoints
    export const API_ENDPOINTS = {
        DOCUMENTS: '/documents',
        QUERY: '/query',
        MANAGE: '/manage',
        COLLECTIONS: '/manage/collections',
        RAW_COLLECTIONS: '/query/collections/raw',
        HEALTH: '/health'  // Add health endpoint for connection check
    };

    // Error Messages
    export const ERROR_MESSAGES = {
        CONNECTION_ERROR: 'Unable to connect to the server. Please check your connection and try again.',
        TIMEOUT_ERROR: 'Request timed out. Please try again.',
        SERVER_ERROR: 'An error occurred on the server. Please try again later.',
        UNAUTHORIZED: 'You are not authorized to perform this action.',
        NOT_FOUND: 'The requested resource was not found.',
        VALIDATION_ERROR: 'Invalid request data. Please check your input.',
    };

    // Request Headers
    export const getHeaders = (apiKey = null) => {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
        
        if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }
        
        return headers;
    };

    // Response Interceptor
    export const handleResponse = (response) => {
        if (!response.ok) {
            const error = new Error(response.statusText);
            error.status = response.status;
            error.statusText = response.statusText;
            throw error;
        }
        return response.json();
    };

    // Error Interceptor
    export const handleError = (error) => {
        if (error.response) {
            // FastAPI error response format
            const errorData = error.response.data;
            
            if (errorData.detail) {
                // Handle FastAPI's standard error format
                throw new Error(typeof errorData.detail === 'string' 
                    ? errorData.detail 
                    : errorData.detail[0].msg);
            }
            
            // Handle specific status codes
            switch (error.response.status) {
                case 401:
                    throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
                case 404:
                    throw new Error(ERROR_MESSAGES.NOT_FOUND);
                case 422:
                    throw new Error(ERROR_MESSAGES.VALIDATION_ERROR);
                case 500:
                    throw new Error(ERROR_MESSAGES.SERVER_ERROR);
                default:
                    throw new Error(errorData.message || ERROR_MESSAGES.SERVER_ERROR);
            }
        } else if (error.request) {
            // Request made but no response
            if (error.code === 'ECONNABORTED') {
                throw new Error(ERROR_MESSAGES.TIMEOUT_ERROR);
            }
            throw new Error(ERROR_MESSAGES.CONNECTION_ERROR);
        } else {
            // Something else went wrong
            throw new Error(error.message || ERROR_MESSAGES.SERVER_ERROR);
        }
    }; 
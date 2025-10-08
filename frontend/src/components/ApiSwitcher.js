import React, { useState, useEffect } from 'react';
import { useApi } from '../context/ApiContext';
import { API_CONFIG } from '../api/config';
import './ApiSwitcher.css';

const ApiSwitcher = () => {
  const { apiUrl, updateApiUrl, isConnected, checkConnection } = useApi();
  const [isChecking, setIsChecking] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const endpoints = [
    { 
      label: 'Local Development', 
      url: API_CONFIG.ENDPOINTS.LOCAL,
      icon: '🏠',
      description: 'localhost:8000'
    },
    { 
      label: 'Cloudflare Tunnel', 
      url: API_CONFIG.ENDPOINTS.REMOTE,
      icon: '☁️',
      description: 'api.freehosting.id.vn'
    }
  ];

  const currentEndpoint = endpoints.find(e => e.url === apiUrl) || endpoints[0];

  const handleSwitch = async (newUrl) => {
    if (newUrl === apiUrl) {
      setShowDropdown(false);
      return;
    }

    setIsChecking(true);
    await updateApiUrl(newUrl);
    await checkConnection();
    setIsChecking(false);
    setShowDropdown(false);
  };

  return (
    <div className="api-switcher">
      <button 
        className={`api-switcher-button ${isConnected ? 'connected' : 'disconnected'}`}
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={isChecking}
      >
        <span className="api-icon">{currentEndpoint.icon}</span>
        <span className="api-label">{currentEndpoint.label}</span>
        <span className={`status-indicator ${isConnected ? 'online' : 'offline'}`}></span>
        <span className="dropdown-arrow">▼</span>
      </button>

      {showDropdown && (
        <div className="api-dropdown">
          <div className="dropdown-header">Select API Endpoint</div>
          {endpoints.map((endpoint) => (
            <button
              key={endpoint.url}
              className={`dropdown-item ${endpoint.url === apiUrl ? 'active' : ''}`}
              onClick={() => handleSwitch(endpoint.url)}
              disabled={isChecking}
            >
              <span className="endpoint-icon">{endpoint.icon}</span>
              <div className="endpoint-info">
                <div className="endpoint-label">{endpoint.label}</div>
                <div className="endpoint-description">{endpoint.description}</div>
              </div>
              {endpoint.url === apiUrl && (
                <span className="checkmark">✓</span>
              )}
            </button>
          ))}
        </div>
      )}

      {isChecking && (
        <div className="checking-overlay">
          <div className="spinner"></div>
          <span>Connecting...</span>
        </div>
      )}
    </div>
  );
};

export default ApiSwitcher;

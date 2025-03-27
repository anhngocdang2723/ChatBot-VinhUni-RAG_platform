import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ApiProvider } from './context/ApiContext';

// Pages
import Dashboard from './pages/Dashboard';
import ChatInterface from './pages/ChatInterface';
import DocumentManager from './pages/DocumentManager';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

// Global styles
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ApiProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/chat" element={<ChatInterface />} />
          <Route path="/documents" element={<DocumentManager />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
    </ApiProvider>
  </React.StrictMode>
); 
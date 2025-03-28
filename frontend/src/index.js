import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ApiProvider } from './context/ApiContext';

// Pages
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import DocumentManager from './pages/DocumentManager';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

// Global styles
import './index.css';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  // In a real application, you would check the user's role from your auth context
  const userRole = localStorage.getItem('userRole') || 'user';
  
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ApiProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Login />} />
          
          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/documents"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DocumentManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Settings />
              </ProtectedRoute>
            }
          />
          
          {/* User routes - simplified to only chat */}
          <Route
            path="/user"
            element={
              <ProtectedRoute allowedRoles={['user', 'admin']}>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Catch all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
    </ApiProvider>
  </React.StrictMode>
); 
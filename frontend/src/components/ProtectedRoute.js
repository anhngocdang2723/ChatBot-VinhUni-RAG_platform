import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  // In a real application, you would check the user's role from your auth context
  const userRole = localStorage.getItem('userRole') || 'user';
  
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

export default ProtectedRoute; 
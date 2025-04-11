import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles, allowedPortal }) => {
  const userRole = localStorage.getItem('userRole');
  const portal = localStorage.getItem('portal');

  if (!userRole || !portal) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(userRole) || portal !== allowedPortal) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute; 
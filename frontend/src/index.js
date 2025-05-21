import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ApiProvider } from './context/ApiContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import DocumentManager from './pages/DocumentManager';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import GeneralChatInterface from './pages/GeneralChatInterface';
import Help from './pages/Help';
import StudentDashboard from './pages/StudentDashboard';
import LecturerDashboard from './pages/LecturerDashboard';
import CoursePage from './pages/CoursePage';
import LecturerCoursePage from './pages/LecturerCoursePage';
import UnderDevelopment from './pages/UnderDevelopment';
import Register from './pages/Register';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ApiProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']} allowedPortal="portal">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/documents"
            element={
              <ProtectedRoute allowedRoles={['admin']} allowedPortal="portal">
                <DocumentManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={['admin']} allowedPortal="portal">
                <Settings />
              </ProtectedRoute>
            }
          />
          
          {/* User routes */}
          <Route
            path="/user"
            element={
              <ProtectedRoute allowedRoles={['user', 'admin']} allowedPortal="portal">
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/chat"
            element={
              <ProtectedRoute allowedRoles={['user', 'admin']} allowedPortal="portal">
                <GeneralChatInterface />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/help"
            element={
              <ProtectedRoute allowedRoles={['user', 'admin']} allowedPortal="portal">
                <Help />
              </ProtectedRoute>
            }
          />

          {/* E-learning routes */}
          <Route
            path="/elearning/student"
            element={
              <ProtectedRoute allowedRoles={['student']} allowedPortal="elearning">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/elearning/student/course/:courseId"
            element={
              <ProtectedRoute allowedRoles={['student']} allowedPortal="elearning">
                <CoursePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/elearning/lecturer"
            element={
              <ProtectedRoute allowedRoles={['lecturer']} allowedPortal="elearning">
                <LecturerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/elearning/lecturer/course/:courseId"
            element={
              <ProtectedRoute allowedRoles={['lecturer']} allowedPortal="elearning">
                <LecturerCoursePage />
              </ProtectedRoute>
            }
          />
          
          {/* Under Development route */}
          <Route path="/under-development" element={<UnderDevelopment />} />
          
          {/* Catch all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
    </ApiProvider>
  </React.StrictMode>
); 
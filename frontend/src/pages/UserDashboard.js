import React from 'react';
import UserLayout from '../components/UserLayout';
import ChatInterface from './ChatInterface';

const UserDashboard = () => {
  return (
    <UserLayout>
      <ChatInterface />
    </UserLayout>
  );
};

export default UserDashboard; 
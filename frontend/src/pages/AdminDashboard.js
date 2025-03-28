import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import styled from 'styled-components';

const DashboardContainer = styled.div`
  padding: var(--spacing-lg);
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  margin-top: var(--spacing-xl);
`;

const StatCard = styled.div`
  background: var(--white);
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-4px);
  }
`;

const StatTitle = styled.h3`
  color: var(--gray);
  font-size: 0.875rem;
  margin-bottom: var(--spacing-sm);
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: var(--almost-black);
`;

const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <AdminLayout>
      <DashboardContainer>
        <h2>Welcome to the Admin Dashboard</h2>
        <StatsGrid>
          <StatCard>
            <StatTitle>Total Documents</StatTitle>
            <StatValue>0</StatValue>
          </StatCard>
          <StatCard>
            <StatTitle>Active Users</StatTitle>
            <StatValue>0</StatValue>
          </StatCard>
          <StatCard>
            <StatTitle>Total Conversations</StatTitle>
            <StatValue>0</StatValue>
          </StatCard>
          <StatCard>
            <StatTitle>System Status</StatTitle>
            <StatValue>Active</StatValue>
          </StatCard>
        </StatsGrid>
      </DashboardContainer>
    </AdminLayout>
  );
};

export default AdminDashboard; 
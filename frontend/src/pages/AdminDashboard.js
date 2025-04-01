import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import styled from 'styled-components';
import { useApi } from '../context/ApiContext';
import { FiLoader } from 'react-icons/fi';

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
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
`;

const LoadingSpinner = styled(FiLoader)`
  animation: spin 1s linear infinite;
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  color: var(--error-color);
  padding: var(--spacing-md);
  background: rgba(255, 0, 0, 0.1);
  border-radius: var(--radius-md);
  margin-top: var(--spacing-md);
`;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { apiUrl } = useApi();
  const [stats, setStats] = useState({
    totalDocuments: 0,
    totalCollections: 0,
    collections: [],
    systemStatus: 'Active'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await fetch(`${apiUrl}/manage/stats`);
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard statistics');
        }
        const data = await response.json();
        setStats({
          totalDocuments: data.total_documents,
          totalCollections: data.total_collections,
          collections: data.collections,
          systemStatus: 'Active'
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, [apiUrl]);

  return (
    <AdminLayout>
      <DashboardContainer>
        <h2>Chào mừng đến với trang quản trị Chatbot</h2>
        
        {error && (
          <ErrorMessage>
            Error: {error}
          </ErrorMessage>
        )}

        <StatsGrid>
          <StatCard>
            <StatTitle>Tổng số tài liệu</StatTitle>
            <StatValue>
              {loading ? <LoadingSpinner /> : stats.totalDocuments}
            </StatValue>
          </StatCard>
          <StatCard>
            <StatTitle>Tổng số bộ sưu tập</StatTitle>
            <StatValue>
              {loading ? <LoadingSpinner /> : stats.totalCollections}
            </StatValue>
          </StatCard>
          <StatCard>
            <StatTitle>Số bộ sưu tập hoạt động</StatTitle>
            <StatValue>
              {loading ? <LoadingSpinner /> : stats.collections.length}
            </StatValue>
          </StatCard>
          <StatCard>
            <StatTitle>Trạng thái hệ thống</StatTitle>
            <StatValue>
              {loading ? <LoadingSpinner /> : stats.systemStatus}
            </StatValue>
          </StatCard>
        </StatsGrid>
      </DashboardContainer>
    </AdminLayout>
  );
};

export default AdminDashboard; 
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import styled from 'styled-components';
import { useApi } from '../context/ApiContext';
import { FiLoader, FiDatabase, FiLayers, FiServer, FiActivity } from 'react-icons/fi';
import { VINH_COLORS } from '../config/colors';

const DashboardContainer = styled.div`
  padding: var(--spacing-xl);
`;

const WelcomeSection = styled.div`
  margin-bottom: var(--spacing-xl);
  background: linear-gradient(135deg, ${VINH_COLORS.primary}, ${VINH_COLORS.primaryDark});
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  color: ${VINH_COLORS.white};
  box-shadow: var(--shadow-lg);
`;

const Title = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: var(--spacing-sm);
  color: inherit;
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  opacity: 0.9;
  max-width: 600px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-lg);
  margin-top: var(--spacing-xl);
`;

const StatCard = styled.div`
  background: ${VINH_COLORS.white};
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  transition: all 0.3s ease;
  border: 1px solid ${VINH_COLORS.border};

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
  }
`;

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-md);
  gap: var(--spacing-md);
`;

const StatIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: ${VINH_COLORS.primaryLight};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${VINH_COLORS.primary};
  font-size: 1.5rem;
`;

const StatTitle = styled.h3`
  color: ${VINH_COLORS.textDark};
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
`;

const StatValue = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  color: ${VINH_COLORS.primary};
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
`;

const LoadingSpinner = styled(FiLoader)`
  animation: spin 1s linear infinite;
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  color: ${VINH_COLORS.error};
  padding: var(--spacing-md);
  background: ${VINH_COLORS.errorLight};
  border-radius: var(--radius-md);
  margin-top: var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
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
        <WelcomeSection>
          <Title>Chào mừng đến với trang quản trị Chatbot</Title>
          <Subtitle>
            Quản lý tài liệu, theo dõi hoạt động hệ thống và cấu hình chatbot của bạn tại đây
          </Subtitle>
        </WelcomeSection>
        
        {error && (
          <ErrorMessage>
            <FiActivity /> Error: {error}
          </ErrorMessage>
        )}

        <StatsGrid>
          <StatCard>
            <StatHeader>
              <StatIcon>
                <FiDatabase />
              </StatIcon>
              <StatTitle>Tổng số tài liệu</StatTitle>
            </StatHeader>
            <StatValue>
              {loading ? <LoadingSpinner /> : stats.totalDocuments}
            </StatValue>
          </StatCard>
          
          <StatCard>
            <StatHeader>
              <StatIcon>
                <FiLayers />
              </StatIcon>
              <StatTitle>Tổng số bộ sưu tập</StatTitle>
            </StatHeader>
            <StatValue>
              {loading ? <LoadingSpinner /> : stats.totalCollections}
            </StatValue>
          </StatCard>
          
          <StatCard>
            <StatHeader>
              <StatIcon>
                <FiServer />
              </StatIcon>
              <StatTitle>Số bộ sưu tập hoạt động</StatTitle>
            </StatHeader>
            <StatValue>
              {loading ? <LoadingSpinner /> : stats.collections.length}
            </StatValue>
          </StatCard>
          
          <StatCard>
            <StatHeader>
              <StatIcon>
                <FiActivity />
              </StatIcon>
              <StatTitle>Trạng thái hệ thống</StatTitle>
            </StatHeader>
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
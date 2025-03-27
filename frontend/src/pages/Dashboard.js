import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FiDatabase, FiFileText, FiMessageSquare, FiSettings } from 'react-icons/fi';
import Layout from '../components/Layout';
import { useApi } from '../context/ApiContext';

const PageHeader = styled.div`
  margin-bottom: var(--spacing-xl);
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: var(--spacing-sm);
`;

const Subtitle = styled.p`
  color: var(--dark-gray);
  font-size: 1.1rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
`;

const StatCard = styled.div`
  background-color: var(--white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-md);
  
  display: flex;
  flex-direction: column;
`;

const StatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
`;

const StatIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background-color: ${props => props.color || 'var(--primary-light)'};
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    color: var(--white);
    font-size: 1.5rem;
  }
`;

const StatTitle = styled.h3`
  color: var(--dark-gray);
  font-size: 0.875rem;
  font-weight: 500;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: var(--spacing-xs);
`;

const StatFooter = styled.div`
  font-size: 0.875rem;
  color: var(--gray);
  margin-top: auto;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
  
  a {
    display: inline-flex;
    align-items: center;
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-md);
    background-color: var(--white);
    color: var(--almost-black);
    text-decoration: none;
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--mid-gray);
    transition: all 0.2s;
    
    &:hover {
      box-shadow: var(--shadow-md);
      border-color: var(--gray);
      transform: translateY(-1px);
      text-decoration: none;
    }
    
    svg {
      margin-right: var(--spacing-sm);
    }
  }
`;

const RecentUploadsSection = styled.div`
  background-color: var(--white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-md);
  margin-bottom: var(--spacing-xl);
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  margin-bottom: var(--spacing-md);
  display: flex;
  align-items: center;
  
  svg {
    margin-right: var(--spacing-sm);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--gray);
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--spacing-lg);
`;

const Dashboard = () => {
  const { getCollections, isLoading } = useApi();
  const [stats, setStats] = useState({
    collections: 0,
    documents: 0,
    documentTypes: {},
    recentUploads: [],
  });
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const collections = await getCollections();
        
        // Calculate stats
        const totalCollections = collections.length;
        let totalDocuments = 0;
        const documentTypes = {};
        
        collections.forEach(collection => {
          if (collection.document_count) {
            totalDocuments += collection.document_count;
          }
          
          if (collection.document_types) {
            Object.entries(collection.document_types).forEach(([type, count]) => {
              documentTypes[type] = (documentTypes[type] || 0) + count;
            });
          }
        });
        
        setStats({
          collections: totalCollections,
          documents: totalDocuments,
          documentTypes,
          recentUploads: [], // This would come from a different API call
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };
    
    fetchStats();
  }, [getCollections]);
  
  return (
    <Layout>
      <PageHeader>
        <Title>Dashboard</Title>
        <Subtitle>Overview of your RAG Chatbot system</Subtitle>
      </PageHeader>
      
      <ActionButtons>
        <Link to="/chat">
          <FiMessageSquare /> New Chat
        </Link>
        <Link to="/documents">
          <FiFileText /> Manage Documents
        </Link>
        <Link to="/settings">
          <FiSettings /> Settings
        </Link>
      </ActionButtons>
      
      {isLoading ? (
        <LoadingSpinner>
          <div className="spinner"></div>
        </LoadingSpinner>
      ) : (
        <>
          <StatsGrid>
            <StatCard>
              <StatHeader>
                <StatIcon color="var(--primary-color)">
                  <FiDatabase />
                </StatIcon>
                <StatTitle>COLLECTIONS</StatTitle>
              </StatHeader>
              <StatValue>{stats.collections}</StatValue>
              <StatFooter>Total document collections</StatFooter>
            </StatCard>
            
            <StatCard>
              <StatHeader>
                <StatIcon color="var(--secondary-color)">
                  <FiFileText />
                </StatIcon>
                <StatTitle>DOCUMENTS</StatTitle>
              </StatHeader>
              <StatValue>{stats.documents}</StatValue>
              <StatFooter>Total documents indexed</StatFooter>
            </StatCard>
            
            <StatCard>
              <StatHeader>
                <StatIcon color="var(--accent-color)">
                  <FiMessageSquare />
                </StatIcon>
                <StatTitle>TYPES</StatTitle>
              </StatHeader>
              <StatValue>{Object.keys(stats.documentTypes).length}</StatValue>
              <StatFooter>Different document types</StatFooter>
            </StatCard>
          </StatsGrid>
          
          <RecentUploadsSection>
            <SectionTitle>
              <FiFileText /> Recent Uploads
            </SectionTitle>
            
            {stats.recentUploads && stats.recentUploads.length > 0 ? (
              <div>
                {/* Recent uploads list would go here */}
                <p>List of recent uploads...</p>
              </div>
            ) : (
              <EmptyState>
                <p>No recent document uploads</p>
                <Link to="/documents" className="button mt-md">
                  Upload Documents
                </Link>
              </EmptyState>
            )}
          </RecentUploadsSection>
        </>
      )}
    </Layout>
  );
};

export default Dashboard; 
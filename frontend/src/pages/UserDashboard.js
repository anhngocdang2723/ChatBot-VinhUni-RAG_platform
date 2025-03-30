import React from 'react';
import styled from 'styled-components';
import UserLayout from '../components/UserLayout';
import { FiBook, FiMessageSquare, FiMail, FiHelpCircle, FiActivity } from 'react-icons/fi';

const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-lg);
`;

const HeroSection = styled.section`
  text-align: center;
  padding: var(--spacing-xl) 0;
  margin-bottom: var(--spacing-xl);
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: var(--almost-black);
  margin-bottom: var(--spacing-md);
`;

const Subtitle = styled.p`
  font-size: 1.25rem;
  color: var(--gray);
  max-width: 800px;
  margin: 0 auto;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
`;

const FeatureCard = styled.div`
  background: var(--white);
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-4px);
  }
`;

const FeatureIcon = styled.div`
  font-size: 2rem;
  color: var(--primary-color);
  margin-bottom: var(--spacing-md);
`;

const FeatureTitle = styled.h3`
  font-size: 1.25rem;
  color: var(--almost-black);
  margin-bottom: var(--spacing-sm);
`;

const FeatureDescription = styled.p`
  color: var(--gray);
  line-height: 1.6;
`;

const StartChatButton = styled.button`
  background: var(--primary-color);
  color: var(--white);
  border: none;
  margin-top: 2rem;
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--radius-md);
  font-size: 1.1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: var(--primary-dark);
  }
`;

const UserDashboard = () => {
  return (
    <UserLayout>
      <DashboardContainer>
        <HeroSection>
          <Title>Chào mừng đến với Chatbot VinhUni</Title>
          <Subtitle>
            Trợ lý thông minh của bạn trong việc truy cập và hiểu thông tin trường đại học. 
            Nhận ngay câu trả lời cho những thắc mắc của bạn về Đại học Vinh.
          </Subtitle>
          <StartChatButton onClick={() => window.location.href = '/user/chat'}>
            Bắt đầu cuộc trò chuyện
          </StartChatButton>
        </HeroSection>

        <FeaturesGrid>
          <FeatureCard>
            <FeatureIcon>
              <FiBook />
            </FeatureIcon>
            <FeatureTitle>Kiến thức toàn diện</FeatureTitle>
            <FeatureDescription>
              Truy cập thông tin về các khóa học, chương trình, chính sách và nhiều thông tin khác từ cơ sở kiến ​​thức sâu rộng của trường Đại học Vinh.
            </FeatureDescription>
          </FeatureCard>

          <FeatureCard>
            <FeatureIcon>
              <FiMessageSquare />
            </FeatureIcon>
            <FeatureTitle>Những cuộc trò chuyện tự nhiên</FeatureTitle>
            <FeatureDescription>
              Tương tác tự nhiên với chatbot bằng ngôn ngữ hàng ngày. Nhận được phản hồi rõ ràng, chính xác cho các câu hỏi của bạn.
            </FeatureDescription>
          </FeatureCard>

          <FeatureCard>
            <FeatureIcon>
              <FiHelpCircle />
            </FeatureIcon>
            <FeatureTitle>Hướng dẫn sử dụng</FeatureTitle>
            <FeatureDescription>
              Tìm hiểu cách tận dụng tối đa Chatbot với hướng dẫn sử dụng và mẹo toàn diện của chúng tôi.
            </FeatureDescription>
          </FeatureCard>

          <FeatureCard>
            <FeatureIcon>
              <FiMail />
            </FeatureIcon>
            <FeatureTitle>Liên hệ hỗ trợ</FeatureTitle>
            <FeatureDescription>
              Bạn cần trợ giúp? Hãy liên hệ với nhóm hỗ trợ của chúng tôi để được trợ giúp về bất kỳ câu hỏi hoặc vấn đề kỹ thuật nào.
            </FeatureDescription>
          </FeatureCard>

          <FeatureCard>
            <FeatureIcon>
              <FiActivity />
            </FeatureIcon>
            <FeatureTitle>Credit</FeatureTitle>
            <FeatureDescription>
              Penguin
            </FeatureDescription>
          </FeatureCard>
        </FeaturesGrid>
      </DashboardContainer>
    </UserLayout>
  );
};

export default UserDashboard; 
import React from 'react';
import styled from 'styled-components';
import UserLayout from '../components/UserLayout';
import { FiBook, FiMessageSquare, FiMail, FiHelpCircle, FiActivity, FiAward, FiClock } from 'react-icons/fi';
import { VINH_COLORS } from '../config/colors';

const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-lg);
`;

const HeroSection = styled.section`
  text-align: center;
  padding: var(--spacing-xl) 0;
  margin-bottom: var(--spacing-xl);
  background: ${VINH_COLORS.white};
  border-radius: var(--radius-lg);
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  font-size: 2rem;
  color: ${VINH_COLORS.primary};
  margin-bottom: var(--spacing-md);
  font-weight: 600;
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: ${VINH_COLORS.textLight};
  max-width: 800px;
  margin: 0 auto;
  line-height: 1.6;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const FeatureCard = styled.div`
  background: ${VINH_COLORS.white};
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 91, 170, 0.1);
  }
`;

const FeatureIcon = styled.div`
  font-size: 2rem;
  color: ${VINH_COLORS.primary};
  margin-bottom: var(--spacing-md);
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${VINH_COLORS.lightBlue};
  border-radius: 16px;
  transition: all 0.3s ease;

  ${FeatureCard}:hover & {
    background: ${VINH_COLORS.primary};
    color: ${VINH_COLORS.white};
  }
`;

const FeatureTitle = styled.h3`
  font-size: 1.25rem;
  color: ${VINH_COLORS.text};
  margin-bottom: var(--spacing-sm);
  font-weight: 500;
`;

const FeatureDescription = styled.p`
  color: ${VINH_COLORS.textLight};
  line-height: 1.6;
  font-size: 0.95rem;
`;

const StartChatButton = styled.button`
  background: ${VINH_COLORS.primary};
  color: ${VINH_COLORS.white};
  border: none;
  margin-top: 2rem;
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--radius-md);
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: ${VINH_COLORS.secondary};
    transform: translateY(-2px);
  }

  svg {
    width: 20px;
    height: 20px;
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
            <FiMessageSquare />
            Bắt đầu trò chuyện
          </StartChatButton>
        </HeroSection>

        <FeaturesGrid>
          <FeatureCard>
            <FeatureIcon>
              <FiBook />
            </FeatureIcon>
            <FeatureTitle>Kiến thức toàn diện</FeatureTitle>
            <FeatureDescription>
              Truy cập thông tin về các khóa học, chương trình, chính sách và nhiều thông tin khác từ cơ sở kiến ​​thức sâu rộng của trường.
            </FeatureDescription>
          </FeatureCard>

          <FeatureCard>
            <FeatureIcon>
              <FiMessageSquare />
            </FeatureIcon>
            <FeatureTitle>Tương tác thông minh</FeatureTitle>
            <FeatureDescription>
              Tương tác tự nhiên với chatbot bằng ngôn ngữ hàng ngày. Nhận được phản hồi rõ ràng, chính xác cho các câu hỏi của bạn.
            </FeatureDescription>
          </FeatureCard>

          <FeatureCard>
            <FeatureIcon>
              <FiHelpCircle />
            </FeatureIcon>
            <FeatureTitle>Hỗ trợ 24/7</FeatureTitle>
            <FeatureDescription>
              Luôn sẵn sàng hỗ trợ bạn mọi lúc, mọi nơi. Không giới hạn thời gian, không phải chờ đợi.
            </FeatureDescription>
          </FeatureCard>

          <FeatureCard>
            <FeatureIcon>
              <FiMail />
            </FeatureIcon>
            <FeatureTitle>Kết nối trực tiếp</FeatureTitle>
            <FeatureDescription>
              Dễ dàng chuyển tiếp đến bộ phận hỗ trợ khi cần thiết. Luôn có người sẵn sàng giúp đỡ bạn.
            </FeatureDescription>
          </FeatureCard>

          <FeatureCard>
            <FeatureIcon>
              <FiAward />
            </FeatureIcon>
            <FeatureTitle>Thông tin chính xác</FeatureTitle>
            <FeatureDescription>
              Cung cấp thông tin chính thống từ nguồn dữ liệu của trường, đảm bảo độ tin cậy và cập nhật thường xuyên.
            </FeatureDescription>
          </FeatureCard>

          <FeatureCard>
            <FeatureIcon>
              <FiClock />
            </FeatureIcon>
            <FeatureTitle>Phản hồi nhanh chóng</FeatureTitle>
            <FeatureDescription>
              Trả lời tức thì cho mọi thắc mắc của bạn, tiết kiệm thời gian và công sức tìm kiếm thông tin.
            </FeatureDescription>
          </FeatureCard>
        </FeaturesGrid>
      </DashboardContainer>
    </UserLayout>
  );
};

export default UserDashboard; 
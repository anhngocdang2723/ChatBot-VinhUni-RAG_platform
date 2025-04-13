import React from 'react';
import styled from 'styled-components';
import UserLayout from '../components/UserLayout';
import ReactMarkdown from 'react-markdown';

const PageContainer = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: var(--spacing-lg);
`;

const MarkdownContent = styled.div`
  color: #1F2937;
  line-height: 1.6;
  background: #FFFFFF;
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);

  h1 {
    font-size: 1.75rem;
    margin-bottom: var(--spacing-lg);
    color: #005BAA;
    font-weight: 600;
  }

  h2 {
    font-size: 1.4rem;
    margin: 2rem 0 1rem;
    color: #0277BD;
    font-weight: 500;
  }

  h3 {
    font-size: 1.2rem;
    margin: 1.5rem 0 0.75rem;
    color: #1F2937;
  }

  p {
    margin: 1rem 0;
    color: #6B7280;
    font-size: 0.95rem;
  }

  ul, ol {
    margin: 1rem 0;
    padding-left: 1.5rem;
    color: #6B7280;
  }

  li {
    margin: 0.75rem 0;
    font-size: 0.95rem;
  }

  code {
    background: #E6F7FF;
    padding: 0.2em 0.4em;
    border-radius: 4px;
    font-size: 0.9em;
    color: #005BAA;
  }

  blockquote {
    border-left: 4px solid #40A9FF;
    margin: 1.5rem 0;
    padding: 1rem;
    color: #6B7280;
    background: #E6F7FF;
    border-radius: 4px;
    font-size: 0.95rem;
  }

  strong {
    color: #1F2937;
    font-weight: 500;
  }
`;

const helpContent = `# Hướng dẫn sử dụng Chatbot VinhUni

## Giới thiệu
Chatbot VinhUni là trợ lý ảo được phát triển để hỗ trợ sinh viên và cán bộ của trường Đại học Vinh trong việc tìm kiếm thông tin và giải đáp các thắc mắc liên quan đến nhà trường.

## Các tính năng chính
- Trả lời câu hỏi về quy định, thông báo, thủ tục hành chính của trường
- Cung cấp thông tin về lịch học, lịch thi, điểm thi và các thông tin học vụ
- Hỗ trợ tìm kiếm tài liệu, giáo trình, và các văn bản liên quan

## Hướng dẫn sử dụng

### 1. Truy cập Chatbot
- Đăng nhập vào hệ thống bằng tài khoản sinh viên
- Chọn mục "Bắt đầu trò chuyện" trong menu

### 2. Đặt câu hỏi
- Sử dụng ngôn ngữ tự nhiên, rõ ràng
- Có thể đặt câu hỏi về nhiều chủ đề khác nhau
- Ví dụ: *"Quy trình đăng ký thi lại như thế nào?"*

### 3. Tương tác với câu trả lời
- Đọc kỹ thông tin được cung cấp
- Có thể đặt câu hỏi thêm để làm rõ
- Kiểm tra nguồn tài liệu tham khảo

## Một số lưu ý
> **Quan trọng**: Chatbot được thiết kế để hỗ trợ thông tin chung. Với các vấn đề cụ thể, vui lòng liên hệ trực tiếp với phòng/ban chức năng.

## Hỗ trợ thêm
Nếu gặp khó khăn trong quá trình sử dụng, vui lòng:
1. Tham khảo mục **Câu hỏi thường gặp**
2. Liên hệ support qua email: **support@vinhuni.edu.vn**
3. Gọi hotline: **0238.3855.452**

*Chúc bạn có trải nghiệm tốt với Chatbot VinhUni!*`;

const Help = () => {
  return (
    <UserLayout>
      <PageContainer>
        <MarkdownContent>
          <ReactMarkdown>{helpContent}</ReactMarkdown>
        </MarkdownContent>
      </PageContainer>
    </UserLayout>
  );
};

export default Help; 
import React from 'react';
import styled from 'styled-components';
import UserLayout from '../components/UserLayout';
import ReactMarkdown from 'react-markdown';

const PageContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: var(--spacing-lg);
`;

const MarkdownContent = styled.div`
  color: var(--almost-black);
  line-height: 1.6;

  h1 {
    font-size: 2rem;
    margin-bottom: var(--spacing-lg);
    color: var(--primary-color);
  }

  h2 {
    font-size: 1.5rem;
    margin: 2rem 0 1rem;
    color: var(--dark-gray);
  }

  h3 {
    font-size: 1.25rem;
    margin: 1.5rem 0 0.75rem;
  }

  p {
    margin: 1rem 0;
  }

  ul, ol {
    margin: 1rem 0;
    padding-left: 2rem;
  }

  li {
    margin: 0.5rem 0;
  }

  code {
    background: var(--light-gray);
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-size: 0.9em;
  }

  blockquote {
    border-left: 4px solid var(--primary-color);
    margin: 1rem 0;
    padding: 0.5rem 0 0.5rem 1rem;
    color: var(--gray);
    background: var(--background-color);
    border-radius: var(--radius-sm);
  }
`;

const helpContent = `# Hướng dẫn sử dụng Chatbot VinhUni

## Giới thiệu
Chatbot VinhUni là trợ lý ảo được phát triển để hỗ trợ sinh viên và cán bộ của trường Đại học Vinh trong việc tìm kiếm thông tin và giải đáp các thắc mắc liên quan đến nhà trường.

## Các tính năng chính
- Trả lời câu hỏi về quy định, thông báo, thủ tục hành chính của trường.
- Cung cấp thông tin về lịch học, lịch thi, điểm thi và các thông tin học vụ.
- Hỗ trợ tìm kiếm tài liệu, giáo trình, và các văn bản liên quan.

## Hướng dẫn sử dụng
1. **Truy cập Chatbot:**
   - Mở trang web của trường Đại học Vinh và chọn mục "Chatbot VinhUni".
   - Cửa sổ trò chuyện sẽ hiện ra ở góc phải màn hình.

2. **Nhập câu hỏi:**
   - Gõ câu hỏi hoặc từ khóa vào ô nhập liệu và nhấn "Gửi".
   - Ví dụ: "Lịch thi kỳ này như thế nào?", "Cách xin giấy xác nhận sinh viên?".

3. **Nhận câu trả lời:**
   - Chatbot sẽ tự động phân tích câu hỏi và hiển thị câu trả lời phù hợp.

## Một số lưu ý
- Sử dụng câu hỏi ngắn gọn, rõ ràng để chatbot hiểu nhanh hơn.
- Trong trường hợp không nhận được câu trả lời đúng, hãy thử đặt lại câu hỏi theo cách khác.

## Hỗ trợ thêm
Nếu gặp lỗi hoặc có góp ý về Chatbot VinhUni, vui lòng liên hệ với Trung tâm Công nghệ Thông tin qua email: cttt@vinhuni.edu.vn.

Chúc bạn sử dụng chatbot hiệu quả!`;

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
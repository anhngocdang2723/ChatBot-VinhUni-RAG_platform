import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FiSend, FiFile, FiChevronDown, FiImage, FiX } from 'react-icons/fi';
import { useApi } from '../context/ApiContext';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const ChatContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
`;

const ChatMessages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background-color: var(--background-color);

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--mid-gray);
    border-radius: 3px;
  }
`;

const Message = styled.div`
  max-width: 80%;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  font-size: 0.95rem;
  line-height: 1.5;

  ${props => props.isUser ? `
    align-self: flex-end;
    background-color: #0066b3;
    color: white;
    border-bottom-right-radius: 4px;
  ` : `
    align-self: flex-start;
    background-color: #f1f5f9;
    color: #1e293b;
    border-bottom-left-radius: 4px;
  `}
`;

const MessageContent = styled.div`
  .markdown-content {
    h1, h2, h3, h4, h5, h6 {
      margin: 1em 0 0.5em 0;
      font-weight: 600;
    }

    p {
      margin: 0.5em 0;
    }

    ul, ol {
      margin: 0.5em 0;
      padding-left: 1.5em;
    }

    li {
      margin: 0.25em 0;
    }

    code {
      background: var(--light-gray);
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-size: 0.9em;
    }

    pre {
      background: var(--light-gray);
      padding: var(--spacing-md);
      border-radius: var(--radius-md);
      overflow-x: auto;
      margin: 0.5em 0;
    }

    blockquote {
      border-left: 4px solid var(--primary-color);
      margin: 0.5em 0;
      padding-left: var(--spacing-md);
      color: var(--gray);
    }
  }
`;

const SourcesContainer = styled.div`
  margin-top: var(--spacing-md);
`;

const SourcesHeader = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--gray);
  cursor: pointer;
  padding: var(--spacing-xs) 0;
  
  &:hover {
    color: var(--dark-gray);
  }

  svg {
    transition: transform 0.2s ease;
    
    &.expanded {
      transform: rotate(180deg);
    }
  }
`;

const SourcesList = styled.div`
  margin-top: var(--spacing-sm);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  transition: all 0.3s ease;
  max-height: ${props => props.isExpanded ? '500px' : '0'};
  overflow: hidden;
  opacity: ${props => props.isExpanded ? '1' : '0'};
`;

const SourceItem = styled.div`
  display: flex;
  align-items: flex-start;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  background-color: var(--white);
  gap: var(--spacing-xs);
  border: 1px solid var(--light-gray);
  
  svg {
    margin-top: 3px;
    flex-shrink: 0;
    color: var(--primary-color);
  }
`;

const SourceText = styled.span`
  font-size: 0.75rem;
  color: var(--dark-gray);
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
`;

const InputContainer = styled.div`
  padding: 1rem;
  border-top: 1px solid #e2e8f0;
  background: white;
`;

const InputWrapper = styled.div`
  display: flex;
  gap: 0.5rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.5rem;
  transition: all 0.2s;

  &:focus-within {
    border-color: #0066b3;
    box-shadow: 0 0 0 2px rgba(0, 102, 179, 0.1);
  }
`;

const Input = styled.input`
  flex: 1;
  border: none;
  background: none;
  padding: 0.5rem;
  font-size: 0.95rem;
  color: #1e293b;

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: #94a3b8;
  }
`;

const SendButton = styled.button`
  background: #0066b3;
  color: white;
  border: none;
  border-radius: 6px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #005291;
  }

  &:disabled {
    background: #cbd5e1;
    cursor: not-allowed;
  }
`;

const CourseContext = styled.div`
  padding: 1rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-size: 0.9rem;
  color: #64748b;

  .context-header {
    font-weight: 500;
    color: #1e293b;
    margin-bottom: 0.5rem;
  }

  .context-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
`;

const LoadingIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md);
  gap: var(--spacing-sm);
  
  .loading-spinner {
    width: 24px;
    height: 24px;
    border: 3px solid var(--light-gray);
    border-top: 3px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  .loading-text {
    color: var(--gray);
    font-size: 0.875rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ImagePreview = styled.div`
  position: relative;
  margin-top: 0.5rem;
  max-width: 200px;
  
  img {
    max-width: 100%;
    border-radius: 8px;
    border: 1px solid var(--light-gray);
  }
  
  .remove-image {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border: 1px solid var(--light-gray);
    transition: all 0.2s;
    
    &:hover {
      background: white;
      transform: scale(1.1);
    }
  }
`;

const ImageUploadButton = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--gray);
  
  &:hover {
    background: var(--light-gray);
    color: var(--dark-gray);
  }
  
  input[type="file"] {
    display: none;
  }
`;

const MessageImage = styled.img`
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  margin-top: 0.5rem;
  border: 1px solid var(--light-gray);
`;

// Maximum image size in bytes (3MB)
const MAX_IMAGE_SIZE = 3 * 1024 * 1024;

const ElearningChatInterface = ({ selectedCourse }) => {
  const { queryRag } = useApi();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState(null);
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    if (selectedCourse) {
      // Add initial greeting message with course context
      setMessages([{
        type: 'bot',
        content: `Chào mừng bạn đến với trợ lý học tập cho môn ${selectedCourse.title}! Tôi sẽ tập trung trả lời các câu hỏi liên quan đến:
- Nội dung bài giảng và tài liệu học tập
- Bài tập và dự án của môn học
- Thông báo và thời hạn quan trọng
- Các vấn đề liên quan đến môn học

Bạn có thể hỏi bất cứ điều gì về môn học này!`,
        sources: []
      }]);
    }
  }, [selectedCourse]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Function to prepare image for API
  const prepareImageForApi = async (file, dataUrl) => {
    try {
      // Check file size
      if (file.size > MAX_IMAGE_SIZE) {
        throw new Error(`Kích thước ảnh quá lớn (tối đa ${MAX_IMAGE_SIZE / (1024 * 1024)}MB)`);
      }
      
      // Option 1: Return base64 without the prefix
      const base64Data = dataUrl.split(',')[1];
      return base64Data;
      
      // Option 2: If the API expects a File or Blob object
      // return file;
      
      // Option 3: If the API expects URL encoded binary
      // const response = await fetch(dataUrl);
      // const blob = await response.blob();
      // return blob;
    } catch (error) {
      console.error('Error preparing image:', error);
      throw error;
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Reset any previous errors
      setImageError(null);
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        setImageError('Chỉ hỗ trợ tập tin hình ảnh');
        return;
      }
      
      // Check file size
      if (file.size > MAX_IMAGE_SIZE) {
        setImageError(`Kích thước ảnh quá lớn (tối đa ${MAX_IMAGE_SIZE / (1024 * 1024)}MB)`);
        return;
      }
      
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.onerror = () => {
        setImageError('Không thể đọc tập tin ảnh');
        setSelectedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setImageError(null);
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if ((!input.trim() && !selectedImage) || !selectedCourse) return;
    
    if (imageError) {
      alert(imageError);
      return;
    }

    const userMessage = { 
      type: 'user', 
      content: input,
      image: selectedImage ? imagePreview : null
    };
    const loadingMessage = {
      type: 'bot',
      content: 'loading',
      sources: []
    };
    
    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let processedImage = null;
      
      // Process image if present
      if (selectedImage) {
        console.log('Processing image:', selectedImage.name, 'Size:', selectedImage.size);
        try {
          processedImage = await prepareImageForApi(selectedImage, imagePreview);
          console.log('Image processed successfully, data length:', processedImage?.length || 0);
        } catch (imgError) {
          throw new Error(`Lỗi xử lý ảnh: ${imgError.message}`);
        }
      }

      const queryData = {
        query: input,
        collection_names: [selectedCourse.id],
        context: {
          course_title: selectedCourse.title,
          course_code: selectedCourse.code,
          course_description: selectedCourse.description,
          chapters: selectedCourse.chapters,
          chat_history: messages.slice(-4).map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
          }))
        },
        image_data: processedImage,
        has_image: !!processedImage,
        fallback_to_llm: true,
        top_k: 5,
        top_n: 2,
        temperature: 0.5,
        model: processedImage ? 'grok-2-vision-latest' : 'grok',
        max_tokens: 2000
      };

      // Only include vision prompt when image is present
      if (processedImage) {
        queryData.prompt = `You are an AI assistant for educational support. Analyze the provided image and explain its significance in the context of the course. Focus on the following aspects:

1. **Visual Elements**: Identify and describe key features of the image.
2. **Educational Context**: Relate the image to relevant course topics or concepts.
3. **Insightful Explanation**: Provide a detailed analysis and interpretation.
4. **Supporting Examples**: Reference similar concepts or examples from the course material.

Your goal is to enhance the student's understanding through clear and informative responses.`;
      }

      console.log('Sending request with model:', queryData.model);
      console.log('Image included:', !!processedImage);

      const response = await queryRag(queryData);
      console.log('API response received:', !!response);
      
      if (response) {
        const botMessage = {
          type: 'bot',
          content: response.answer,
          sources: response.sources || [],
          is_fallback: response.is_fallback || false
        };
        setMessages(prev => prev.slice(0, -1).concat(botMessage));
      } else {
        throw new Error('Không nhận được phản hồi từ máy chủ');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      console.error('Error details:', error.response?.data || error);
      
      const errorMessage = {
        type: 'bot',
        content: `Đã xảy ra lỗi: ${error.message || 'Không thể xử lý yêu cầu của bạn'}. Vui lòng thử lại sau.`,
        sources: [],
        is_fallback: false
      };
      setMessages(prev => prev.slice(0, -1).concat(errorMessage));
    } finally {
      setIsLoading(false);
      setSelectedImage(null);
      setImagePreview(null);
      setImageError(null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleSources = (messageIndex) => {
    setExpandedSources(prev => ({
      ...prev,
      [messageIndex]: !prev[messageIndex]
    }));
  };

  return (
    <ChatContainer>
      {selectedCourse && (
        <CourseContext>
          <div className="context-header">Môn học: {selectedCourse.title}</div>
          <div className="context-info">
            <div>Mã môn: {selectedCourse.code}</div>
            <div>Giảng viên: {selectedCourse.instructor}</div>
            <div>Tiến độ: {selectedCourse.progress}</div>
          </div>
        </CourseContext>
      )}
      
      <ChatMessages>
        {messages.map((message, index) => {
          if (message.type === 'user') {
            return (
              <Message key={index} isUser={true}>
                <MessageContent>
                  {message.content}
                  {message.image && (
                    <MessageImage src={message.image} alt="Uploaded content" />
                  )}
                </MessageContent>
              </Message>
            );
          } else if (message.content === 'loading') {
            return (
              <Message key={index} isUser={false}>
                <MessageContent>
                  <LoadingIndicator>
                    <div className="loading-spinner" />
                    <span>Đang xử lý câu hỏi của bạn...</span>
                  </LoadingIndicator>
                </MessageContent>
              </Message>
            );
          } else {
            return (
              <Message key={index} isUser={false}>
                <MessageContent>
                  <div className="markdown-content">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {message.content}
                    </ReactMarkdown>
                    {message.is_fallback && (
                      <div style={{ 
                        fontSize: '0.8rem', 
                        color: 'var(--gray)', 
                        marginTop: '0.5rem',
                        fontStyle: 'italic'
                      }}>
                        (Câu trả lời được tạo bởi AI dựa trên kiến thức chung)
                      </div>
                    )}
                  </div>
                  
                  {message.sources && message.sources.length > 0 && (
                    <SourcesContainer>
                      <SourcesHeader onClick={() => toggleSources(index)}>
                        <FiChevronDown className={expandedSources[index] ? 'expanded' : ''} />
                        <span>Nguồn tham khảo ({message.sources.length})</span>
                      </SourcesHeader>
                      <SourcesList isExpanded={expandedSources[index]}>
                        {message.sources.map((source, idx) => (
                          <SourceItem key={idx}>
                            <FiFile />
                            <div>
                              <div style={{ fontSize: '0.8rem', fontWeight: '500', marginBottom: '2px' }}>
                                {source.metadata?.original_filename || 'Tài liệu'}
                              </div>
                              <SourceText>{source.text}</SourceText>
                            </div>
                          </SourceItem>
                        ))}
                      </SourcesList>
                    </SourcesContainer>
                  )}
                </MessageContent>
              </Message>
            );
          }
        })}
        <div ref={messagesEndRef} />
      </ChatMessages>

      <InputContainer>
        <InputWrapper>
          <Input
            type="text"
            placeholder="Nhập câu hỏi của bạn..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading || !selectedCourse}
          />
          <ImageUploadButton>
            <FiImage size={18} />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isLoading || !selectedCourse}
            />
          </ImageUploadButton>
          <SendButton onClick={handleSend} disabled={(!input.trim() && !selectedImage) || isLoading || !selectedCourse || imageError}>
            <FiSend size={18} />
          </SendButton>
        </InputWrapper>
        {imagePreview && (
          <ImagePreview>
            <img src={imagePreview} alt="Preview" />
            <div className="remove-image" onClick={removeImage}>
              <FiX size={14} />
            </div>
          </ImagePreview>
        )}
        {imageError && (
          <div style={{ color: 'red', fontSize: '0.8rem', marginTop: '0.5rem' }}>
            {imageError}
          </div>
        )}
      </InputContainer>
    </ChatContainer>
  );
};

export default ElearningChatInterface;
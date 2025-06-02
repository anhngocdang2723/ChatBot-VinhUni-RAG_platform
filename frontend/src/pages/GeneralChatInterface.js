import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FiSend, FiSettings, FiSearch, FiCornerDownRight, FiFile, FiChevronDown, FiChevronUp, FiBookmark, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import UserLayout from '../components/UserLayout';
import { useApi } from '../context/ApiContext';
import { checkSpecialQuery } from '../utils/specialQueries';
import ReactMarkdown from 'react-markdown';
import TypingMessage from '../components/TypingMessage';
import chatbotAvartar from '../assets/chatbot.png';
import userAvatar from '../assets/user.png';
import { VINH_COLORS } from '../config/colors';
// import userAvatar from '../assets/male-avatar-placeholder.png';

// Maximum number of messages to keep in chat history
const MAX_CHAT_HISTORY = 3;

const PageContainer = styled.div`
  height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const PageHeader = styled.div`
  padding: var(--spacing-md) var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  background: ${VINH_COLORS.white};
  border-bottom: 1px solid ${VINH_COLORS.gray};
  
  @media (max-width: 768px) {
    padding: var(--spacing-sm) var(--spacing-md);
    position: sticky;
    top: 0;
    z-index: 10;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
`;

const LogoContainer = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  background: ${VINH_COLORS.white};
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

const HeaderContent = styled.div`
  flex: 1;
`;

const Title = styled.h1`
  font-size: 1.25rem;
  margin: 0;
  color: ${VINH_COLORS.text};
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const Subtitle = styled.p`
  font-size: 0.875rem;
  color: ${VINH_COLORS.textLight};
  margin: 0;
  
  @media (max-width: 768px) {
    font-size: 0.75rem;
    display: none;
  }
`;

const ChatContainer = styled.div`
  display: flex;
  flex: 1;
  gap: var(--spacing-lg);
  min-height: 0;
  position: relative;
  padding: var(--spacing-md);
  
  @media (max-width: 768px) {
    gap: 0;
    padding: var(--spacing-xs);
    height: calc(100vh - 64px - 56px); /* Adjust for header and bottom safe area */
  }
`;

const MainChat = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: ${VINH_COLORS.white};
  border-radius: var(--radius-lg);
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
  min-width: 0;
  
  @media (max-width: 768px) {
    border-radius: 0;
    box-shadow: none;
  }
`;

const ChatMessages = styled.div`
  flex: 1;
  padding: var(--spacing-md);
  overflow-y: auto;
  background-color: ${VINH_COLORS.white};
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${VINH_COLORS.gray};
    border-radius: 3px;
  }
  
  @media (max-width: 768px) {
    padding: var(--spacing-sm);
  }
`;

const Message = styled.div`
  margin-bottom: var(--spacing-md);
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  justify-content: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  
  @media (max-width: 768px) {
    margin-bottom: var(--spacing-sm);
    gap: var(--spacing-sm);
  }
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  order: ${props => props.isUser ? 2 : 0};
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
  }
`;

const MessageContent = styled.div`
  background: ${props => props.isUser ? VINH_COLORS.lightBlue : VINH_COLORS.gray};
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  max-width: 70%;
  color: ${VINH_COLORS.text};
  line-height: 1.6;
  font-size: 0.95rem;
  order: ${props => props.isUser ? 1 : 0};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  border: 1px solid ${props => props.isUser ? 'rgba(37, 99, 235, 0.1)' : 'rgba(0, 0, 0, 0.05)'};

  @media (max-width: 768px) {
    max-width: 85%;
    padding: var(--spacing-sm);
    font-size: 0.9rem;
    line-height: 1.5;
  }

  pre {
    background: ${VINH_COLORS.white};
    padding: var(--spacing-md);
    border-radius: var(--radius-sm);
    overflow-x: auto;
    margin: var(--spacing-sm) 0;
    font-family: 'Courier New', Courier, monospace;
    
    @media (max-width: 768px) {
      padding: var(--spacing-sm);
      font-size: 0.85rem;
    }
  }

  .markdown-content {
    h1, h2, h3, h4, h5, h6 {
      margin: 1em 0 0.5em 0;
      font-weight: 600;
      
      @media (max-width: 768px) {
        font-size: 0.9em;
      }
    }

    p {
      margin: 0.5em 0;
      
      @media (max-width: 768px) {
        font-size: 0.9em;
      }
    }

    ul, ol {
      margin: 0.5em 0;
      padding-left: 1.5em;
      
      @media (max-width: 768px) {
        font-size: 0.9em;
      }
    }

    li {
      margin: 0.25em 0;
    }

    code {
      background: var(--light-gray);
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-size: 0.9em;
      
      @media (max-width: 768px) {
        font-size: 0.8em;
      }
    }

    blockquote {
      border-left: 4px solid var(--primary-color);
      margin: 0.5em 0;
      padding-left: var(--spacing-md);
      color: var(--gray);
      
      @media (max-width: 768px) {
        font-size: 0.9em;
      }
    }
  }
`;

const ChatInputContainer = styled.div`
  padding: var(--spacing-md);
  background-color: var(--white);
  border-top: 1px solid var(--light-gray);
  
  @media (max-width: 768px) {
    padding: var(--spacing-sm);
    position: sticky;
    bottom: 0;
    z-index: 10;
    box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.1);
  }
`;

const ChatInputForm = styled.form`
  display: flex;
  gap: var(--spacing-sm);
  
  @media (max-width: 768px) {
    gap: var(--spacing-xs);
  }
`;

const ChatInput = styled.input`
  flex: 1;
  padding: var(--spacing-md);
  border: 1px solid var(--light-gray);
  border-radius: var(--radius-full);
  font-size: 1rem;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px var(--primary-light);
  }

  &::placeholder {
    color: var(--gray);
  }
  
  @media (max-width: 768px) {
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: 0.9rem;
    border-radius: var(--radius-lg);
  }
`;

const SendButton = styled.button`
  background: ${props => props.variant === 'secondary' ? VINH_COLORS.gray : VINH_COLORS.primary};
  color: ${props => props.variant === 'secondary' ? VINH_COLORS.text : VINH_COLORS.white};
  border: none;
  padding: 0 var(--spacing-md);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  font-weight: 500;

  &:hover {
    background: ${props => props.variant === 'secondary' ? VINH_COLORS.lightBlue : VINH_COLORS.secondary};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const ErrorMessage = styled.div`
  color: #DC2626;
  background: #FEE2E2;
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);

  svg {
    width: 20px;
    height: 20px;
  }
`;

const Sidebar = styled.div`
  width: 280px;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  
  @media (max-width: 768px) {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    max-width: 320px;
    background: ${VINH_COLORS.white};
    padding: var(--spacing-md);
    transform: translateX(${props => props.isOpen ? '0' : '100%'});
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 1000;
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
`;

const MobileSidebarToggle = styled.button`
  display: none;
  position: fixed;
  bottom: calc(var(--spacing-lg) + 64px);
  right: var(--spacing-md);
  z-index: 1001;
  background: ${VINH_COLORS.primary};
  color: ${VINH_COLORS.white};
  border: none;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
  
  @media (max-width: 768px) {
    display: flex;
    transform: ${props => props.isOpen ? 'rotate(180deg)' : 'none'};
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const SidebarOverlay = styled.div`
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  opacity: ${props => props.isOpen ? 1 : 0};
  transition: opacity 0.3s ease;
  backdrop-filter: blur(2px);
  
  @media (max-width: 768px) {
    display: ${props => props.isOpen ? 'block' : 'none'};
  }
`;

const SidebarCard = styled.div`
  background-color: ${VINH_COLORS.white};
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  
  @media (max-width: 768px) {
    border-radius: var(--radius-md);
    padding: var(--spacing-sm);
    margin-bottom: var(--spacing-sm);
  }
`;

const CardHeader = styled.div`
  padding: var(--spacing-md);
  border-bottom: 1px solid ${VINH_COLORS.gray};
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: ${VINH_COLORS.text};
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;

  @media (max-width: 768px) {
    padding: var(--spacing-sm);
  }

  &:hover {
    background-color: ${VINH_COLORS.gray};
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);

    svg {
      color: ${VINH_COLORS.primary};
    }
  }

  .toggle-icon {
    color: ${VINH_COLORS.gray};
    transition: transform 0.3s ease;
    
    &.expanded {
      transform: rotate(180deg);
    }
  }
`;

const CardContent = styled.div`
  padding: var(--spacing-md);
  transition: all 0.3s ease;
  max-height: ${props => props.isExpanded ? '500px' : '0'};
  overflow: hidden;
  opacity: ${props => props.isExpanded ? '1' : '0'};
`;

const CollectionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  max-height: 400px;
  overflow-y: auto;
  padding-right: var(--spacing-xs);
  
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

const CollectionItem = styled.div`
  display: grid;
  grid-template-columns: 24px 1fr;
  padding: 8px var(--spacing-sm);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
  width: 100%;

  &:hover {
    background-color: var(--light-gray);
  }

  input[type="checkbox"] {
    margin: 0;
    cursor: pointer;
    width: 16px;
    height: 16px;
  }

  span {
    font-size: 0.875rem;
    color: var(--dark-gray);
    line-height: 1.4;
    word-break: break-word;
  }
`;

const SettingsFormItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.875rem;
  color: var(--dark-gray);

  span {
    margin-bottom: 4px;
  }

  input, select {
    padding: 8px;
    border: 1px solid var(--light-gray);
    border-radius: var(--radius-sm);
    font-size: 0.875rem;

    &:focus {
      outline: none;
      border-color: var(--primary-color);
    }
  }
`;

const SettingsForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--gray);
  text-align: center;
  padding: var(--spacing-xl);

  svg {
    font-size: 3rem;
    margin-bottom: var(--spacing-md);
    color: var(--primary-light);
  }

  h3 {
    margin-bottom: var(--spacing-sm);
    color: var(--almost-black);
  }

  p {
    color: var(--gray);
    font-size: 0.875rem;
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

const GeneralChatInterface = () => {
  const { queryRag, getCollections, isLoading } = useApi();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [collections, setCollections] = useState([]);
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [querySettings, setQuerySettings] = useState({
    topK: 15,
    topN: 5,
    temperature: 0.1,
    maxTokens: 1000,
    model: 'grok',
  });
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [expandedSources, setExpandedSources] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [error, setError] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  
  const chatHistoryRef = useRef(null);
  
  useEffect(() => {
    fetchCollections();
    // Add initial greeting message
    const initialMessage = {
      type: 'bot',
      content: 'Xin chào! Tôi là trợ lý AI của Trường Đại học Vinh. Tôi có thể giúp bạn trả lời các câu hỏi về trường. Hãy đặt câu hỏi của bạn, tôi sẽ tìm kiếm thông tin trong tài liệu của trường để trả lời bạn một cách chính xác nhất.',
      sources: [],
      isTyping: true
    };
    setMessages([initialMessage]);
    updateChatHistory({ role: 'assistant', content: initialMessage.content });
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const fetchCollections = async () => {
    try {
      const fetchedCollections = await getCollections();
      if (Array.isArray(fetchedCollections)) {
        // Sort collections by name
        const sortedCollections = fetchedCollections.sort((a, b) => 
          (a.display_name || a.name).localeCompare(b.display_name || b.name)
        );
        setCollections(sortedCollections);
        
        // Select all collections by default
        setSelectedCollections(sortedCollections.map(c => c.name));
      } else {
        console.error('Invalid collections data:', fetchedCollections);
        setCollections([]);
        setSelectedCollections([]);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
      setCollections([]);
      setSelectedCollections([]);
    }
  };
  
  const scrollToBottom = () => {
    chatHistoryRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Update chat history with limit
  const updateChatHistory = (newMessage) => {
    setChatHistory(prev => {
      const updatedHistory = [...prev, newMessage];
      // Keep only the most recent messages up to MAX_CHAT_HISTORY
      return updatedHistory.slice(-MAX_CHAT_HISTORY);
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { type: 'user', content: input };
    const loadingMessage = {
      type: 'bot',
      content: 'loading',
      sources: []
    };
    
    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInput('');
    setError(null);

    const specialQueryCheck = checkSpecialQuery(input);
    if (specialQueryCheck.isSpecial) {
      const botMessage = {
        type: 'bot',
        content: specialQueryCheck.response,
        sources: [],
        isTyping: true
      };
      setMessages(prev => prev.slice(0, -1).concat(botMessage));
      updateChatHistory({ role: 'user', content: input });
      updateChatHistory({ role: 'assistant', content: specialQueryCheck.response });
      scrollToBottom();
      return;
    }

    const queryData = {
      query: input,
      top_k: querySettings.topK,
      top_n: querySettings.topN,
      temperature: querySettings.temperature,
      max_tokens: querySettings.maxTokens,
      model: querySettings.model,
      chat_history: chatHistory
    };

    console.log('Selected model:', querySettings.model); // Debug log

    if (selectedCollections && selectedCollections.length > 0) {
      queryData.collection_names = selectedCollections;
    }

    try {
      updateChatHistory({ role: 'user', content: input });
      const response = await queryRag(queryData);
      
      if (response) {
        const botMessage = {
          type: 'bot',
          content: response.answer,
          sources: response.sources,
          isTyping: true
        };
        setMessages(prev => prev.slice(0, -1).concat(botMessage));
        updateChatHistory({ role: 'assistant', content: response.answer });
      } else {
        const errorMessage = {
          type: 'bot',
          content: 'Rất tiếc, đã xảy ra lỗi khi xử lý yêu cầu của bạn.',
          sources: [],
          isTyping: true
        };
        setMessages(prev => prev.slice(0, -1).concat(errorMessage));
        updateChatHistory({ role: 'assistant', content: errorMessage.content });
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại.');
    } finally {
      scrollToBottom();
    }
  };
  
  const handleCollectionSelect = (collectionName) => {
    setSelectedCollections(prev => {
      if (prev.includes(collectionName)) {
        return prev.filter(name => name !== collectionName);
      } else {
        return [...prev, collectionName];
      }
    });
  };
  
  const handleSettingChange = (e) => {
    const { name, value } = e.target;
    setQuerySettings(prev => ({
      ...prev,
      [name]: name === 'model' ? value : Number(value),
    }));
  };
  
  const toggleSources = (messageIndex) => {
    setExpandedSources(prev => ({
      ...prev,
      [messageIndex]: !prev[messageIndex]
    }));
  };
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  return (
    <UserLayout>
      <PageContainer>
        <PageHeader>
          <LogoContainer>
            <img src={chatbotAvartar} alt="VinhUni Bot Avatar" />
          </LogoContainer>
          <HeaderContent>
            <Title>Trợ lý thông tin chung</Title>
            <Subtitle>Đặt câu hỏi về thông tin chung của trường</Subtitle>
          </HeaderContent>
        </PageHeader>
        
        <ChatContainer>
          <MainChat>
            <ChatMessages>
              {messages.length > 0 ? (
                messages.map((message, index) => {
                  if (message.type === 'user') {
                    return (
                      <Message key={index} isUser={true}>
                        <Avatar isUser={true}>
                          <img src={userAvatar} alt="User" />
                        </Avatar>
                        <MessageContent isUser={true}>
                          {message.content}
                        </MessageContent>
                      </Message>
                    );
                  } else if (message.content === 'loading') {
                    return (
                      <Message key={index} isUser={false}>
                        <Avatar isUser={false}>
                          <img src={chatbotAvartar} alt="Bot" />
                        </Avatar>
                        <MessageContent isUser={false}>
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
                        <Avatar isUser={false}>
                          <img src={chatbotAvartar} alt="Bot" />
                        </Avatar>
                        <MessageContent isUser={false}>
                          {message.isTyping ? (
                            <TypingMessage content={message.content} />
                          ) : (
                            <div className="markdown-content">
                              <ReactMarkdown>{message.content}</ReactMarkdown>
                            </div>
                          )}
                          
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
                })
              ) : (
                <EmptyState>
                  <FiSearch />
                  <h3>Đặt câu hỏi về tài liệu của bạn</h3>
                  <p>Tôi sẽ tìm kiếm trong bộ sưu tập tài liệu của bạn và cung cấp câu trả lời.</p>
                </EmptyState>
              )}
              <div ref={chatHistoryRef} />
            </ChatMessages>
            
            <ChatInputContainer>
              <ChatInputForm onSubmit={handleSubmit}>
                <ChatInput
                  type="text"
                  placeholder="Đặt câu hỏi..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                />
                <SendButton type="submit" disabled={isLoading || !input.trim()}>
                  <FiSend />
                </SendButton>
              </ChatInputForm>
            </ChatInputContainer>
          </MainChat>

          <Sidebar isOpen={isSidebarOpen}>
            <SidebarCard>
              <CardHeader onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}>
                <div className="header-content">
                  <FiSettings />
                  <span>Cấu hình nâng cao</span>
                </div>
                <FiChevronDown className={`toggle-icon ${isSettingsExpanded ? 'expanded' : ''}`} />
              </CardHeader>
              <CardContent isExpanded={isSettingsExpanded}>
                <SettingsForm>
                  <SettingsFormItem>
                    <span>Mô hình AI</span>
                    <select
                      name="model"
                      value={querySettings.model}
                      onChange={handleSettingChange}
                    >
                      <option value="grok">Grok</option>
                      <option value="deepseek">Deepseek</option>
                    </select>
                  </SettingsFormItem>
                  
                  <SettingsFormItem>
                    <span>Số lượng tài liệu lấy về (retrieval)</span>
                    <input
                      type="number"
                      name="topK"
                      min="1"
                      max="300"
                      value={querySettings.topK}
                      onChange={handleSettingChange}
                    />
                  </SettingsFormItem>
                  
                  <SettingsFormItem>
                    <span>Số lượng tài liệu xếp hạng lại (reranking)</span>
                    <input
                      type="number"
                      name="topN"
                      min="1"
                      max="100"
                      value={querySettings.topN}
                      onChange={handleSettingChange}
                    />
                  </SettingsFormItem>
                  
                  <SettingsFormItem>
                    <span>Độ ngẫu nhiên (temperature)</span>
                    <input
                      type="number"
                      name="temperature"
                      min="0"
                      max="1"
                      step="0.1"
                      value={querySettings.temperature}
                      onChange={handleSettingChange}
                    />
                  </SettingsFormItem>
                  
                  <SettingsFormItem>
                    <span>Giới hạn số từ đầu ra (max_tokens)</span>
                    <input
                      type="number"
                      name="maxTokens"
                      min="100"
                      max="2000"
                      step="50"
                      value={querySettings.maxTokens}
                      onChange={handleSettingChange}
                    />
                  </SettingsFormItem>
                </SettingsForm>
              </CardContent>
            </SidebarCard>
            
            <SidebarCard>
              <CardHeader>
                <div className="header-content">
                  <FiBookmark />
                  <span>Nguồn tài liệu truy vấn</span>
                </div>
              </CardHeader>
              <CardContent isExpanded={true}>
                {collections.length > 0 ? (
                  <CollectionsContainer>
                    {collections.map(collection => (
                      <CollectionItem key={collection.name} onClick={() => handleCollectionSelect(collection.name)}>
                        <input
                          type="checkbox"
                          checked={selectedCollections.includes(collection.name)}
                          onChange={() => {}}
                        />
                        <span>{collection.display_name || collection.name}</span>
                      </CollectionItem>
                    ))}
                  </CollectionsContainer>
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--gray)', padding: 'var(--spacing-md)' }}>
                    Không có Collection nào sẵn sàng
                  </div>
                )}
              </CardContent>
            </SidebarCard>
          </Sidebar>
          
          <MobileSidebarToggle onClick={toggleSidebar}>
            <FiSettings size={24} />
          </MobileSidebarToggle>
        </ChatContainer>
      </PageContainer>
    </UserLayout>
  );
};

export default GeneralChatInterface; 
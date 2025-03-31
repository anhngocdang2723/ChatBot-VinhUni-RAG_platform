import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FiSend, FiSettings, FiSearch, FiCornerDownRight, FiFile, FiChevronDown, FiChevronUp, FiBookmark } from 'react-icons/fi';
import UserLayout from '../components/UserLayout';
import { useApi } from '../context/ApiContext';
import { checkSpecialQuery } from '../utils/specialQueries';
import ReactMarkdown from 'react-markdown';

const PageContainer = styled.div`
  padding: var(--spacing-lg);
  height: calc(100vh - 32px);
  display: flex;
  flex-direction: column;
  
  @media (max-width: 768px) {
    padding: var(--spacing-md);
    height: calc(100vh - 16px);
  }
`;

const PageHeader = styled.div`
  margin-bottom: var(--spacing-lg);
  
  @media (max-width: 768px) {
    margin-bottom: var(--spacing-md);
    padding-top: calc(var(--spacing-lg) + 36px);
  }
`;

const Title = styled.h1`
  font-size: 1.75rem;
  margin-bottom: var(--spacing-sm);
  color: var(--almost-black);
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const Subtitle = styled.p`
  color: var(--gray);
  font-size: 0.875rem;
`;

const ChatContainer = styled.div`
  display: flex;
  flex: 1;
  gap: var(--spacing-lg);
  min-height: 0;
  position: relative;
  
  @media (max-width: 768px) {
    gap: 0;
  }
`;

const MainChat = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  min-width: 0;
  margin-bottom: 0px;
  
  @media (max-width: 768px) {
    border-radius: var(--radius-md);
    margin-bottom: 40px;
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
    background: var(--white);
    padding: var(--spacing-md);
    transform: translateX(${props => props.isOpen ? '0' : '100%'});
    transition: transform 0.3s ease;
    z-index: 1000;
    box-shadow: var(--shadow-lg);
  }
`;

const MobileSidebarToggle = styled.button`
  display: none;
  position: fixed;
  top: var(--spacing-lg);
  right: var(--spacing-lg);
  z-index: 1001;
  background: var(--primary-color);
  color: var(--white);
  border: none;
  padding: var(--spacing-sm);
  border-radius: var(--radius-full);
  cursor: pointer;
  box-shadow: var(--shadow-lg);
  width: 48px;
  height: 48px;
  align-items: center;
  justify-content: center;
  
  @media (max-width: 768px) {
    display: flex;
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
  
  @media (max-width: 768px) {
    display: ${props => props.isOpen ? 'block' : 'none'};
  }
`;

const ChatMessages = styled.div`
  flex: 1;
  padding: var(--spacing-lg);
  overflow-y: auto;
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
  
  @media (max-width: 768px) {
    padding: var(--spacing-md);
  }
`;

const ChatInputContainer = styled.div`
  padding: var(--spacing-md);
  background-color: var(--white);
  border-top: 1px solid var(--light-gray);
  
  @media (max-width: 768px) {
    padding: var(--spacing-sm);
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
    font-size: 0.875rem;
  }
`;

const SendButton = styled.button`
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
  line-height: 1;

  &:hover {
    background-color: var(--primary-dark);
    transform: scale(1.05);
  }

  &:disabled {
    background-color: var(--gray);
    cursor: not-allowed;
    transform: none;
    opacity: 0.7;
  }

  svg {
    fill: currentColor;
    stroke: currentColor;
    width: 20px;
    height: 20px;
  }
`;

const Message = styled.div`
  margin-bottom: var(--spacing-lg);
  display: flex;
  flex-direction: column;
`;

const UserMessage = styled(Message)`
  align-items: flex-end;
  
  .message-content {
    background-color: var(--primary-color);
    color: var(--white);
    border-radius: var(--radius-lg) var(--radius-lg) 0 var(--radius-lg);
  }
`;

const BotMessage = styled(Message)`
  align-items: flex-start;
  
  .message-content {
    background-color: var(--light-gray);
    color: var(--almost-black);
    border-radius: var(--radius-lg) var(--radius-lg) var(--radius-lg) 0;
  }
`;

const MessageContent = styled.div`
  padding: var(--spacing-md) var(--spacing-lg);
  max-width: 70%;
  line-height: 1.5;
  
  @media (max-width: 768px) {
    max-width: 85%;
    padding: var(--spacing-sm) var(--spacing-md);
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

    pre {
      background: var(--light-gray);
      padding: var(--spacing-md);
      border-radius: var(--radius-md);
      overflow-x: auto;
      margin: 0.5em 0;
      
      @media (max-width: 768px) {
        padding: var(--spacing-sm);
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

const MessageSources = styled.div`
  margin-top: var(--spacing-sm);
  font-size: 0.875rem;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
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

const SidebarCard = styled.div`
  background-color: var(--white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-md);
  
  @media (max-width: 768px) {
    min-width: 200px;
    flex-shrink: 0;
    border-radius: var(--radius-md);
  }
`;

const CardHeader = styled.div`
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--light-gray);
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--almost-black);
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--light-gray);
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);

    svg {
      color: var(--primary-color);
    }
  }

  .toggle-icon {
    color: var(--gray);
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
  
  /* Thêm padding cho container của các collection items */
  > div {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }
`;

const SettingsForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);

  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 0.875rem;
    color: var(--dark-gray);
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

const CollectionItem = styled.label`
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

const ChatInterface = () => {
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
    model: 'deepseek',
  });
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [expandedSources, setExpandedSources] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    fetchCollections();
    // Add initial greeting message
    setMessages([{
      type: 'bot',
      content: 'Xin chào! Tôi là trợ lý AI của Trường Đại học Vinh. Tôi có thể giúp bạn trả lời các câu hỏi về trường. Hãy đặt câu hỏi của bạn, tôi sẽ tìm kiếm thông tin trong tài liệu của trường để trả lời bạn một cách chính xác nhất.',
      sources: []
    }]);
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const fetchCollections = async () => {
    try {
      const fetchedCollections = await getCollections();
      setCollections(fetchedCollections || []);
      if (Array.isArray(fetchedCollections) && fetchedCollections.length > 0) {
        setSelectedCollections(fetchedCollections.map(c => c.name));
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
      setCollections([]);
      setSelectedCollections([]);
    }
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { type: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    const specialQueryCheck = checkSpecialQuery(input);
    if (specialQueryCheck.isSpecial) {
      const botMessage = {
        type: 'bot',
        content: specialQueryCheck.response,
        sources: []
      };
      setMessages(prev => [...prev, botMessage]);
      scrollToBottom();
      return;
    }

    const queryData = {
      query: input,
      top_k: querySettings.topK,
      top_n: querySettings.topN,
      temperature: querySettings.temperature,
      max_tokens: querySettings.maxTokens,
      model: querySettings.model
    };

    console.log('Selected model:', querySettings.model); // Debug log

    if (selectedCollections && selectedCollections.length > 0) {
      queryData.collection_names = selectedCollections;
    }

    const response = await queryRag(queryData);
    
    if (response) {
      const botMessage = {
        type: 'bot',
        content: response.answer,
        sources: response.sources
      };
      setMessages(prev => [...prev, botMessage]);
    } else {
      const errorMessage = {
        type: 'bot',
        content: 'Rất tiếc, đã xảy ra lỗi khi xử lý yêu cầu của bạn.',
        sources: []
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    scrollToBottom();
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
  
  return (
    <UserLayout>
      <PageContainer>
        <PageHeader>
          <Title>Giao diện trò chuyện Chatbot</Title>
          <Subtitle>Đặt câu hỏi với tài liệu liên quan</Subtitle>
        </PageHeader>
        
        <ChatContainer>
          <SidebarOverlay isOpen={isSidebarOpen} onClick={toggleSidebar} />
          
          <MainChat>
            <ChatMessages>
              {messages.length > 0 ? (
                messages.map((message, index) => {
                  if (message.type === 'user') {
                    return (
                      <UserMessage key={index}>
                        <MessageContent className="message-content">
                          {message.content}
                        </MessageContent>
                      </UserMessage>
                    );
                  } else {
                    return (
                      <BotMessage key={index}>
                        <MessageContent className="message-content">
                          <div className="markdown-content">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
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
                      </BotMessage>
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
              <div ref={messagesEndRef} />
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
                  <FiSend size={20} />
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
                  <label>
                    Mô hình AI
                    <select
                      name="model"
                      value={querySettings.model}
                      onChange={handleSettingChange}
                    >
                      <option value="deepseek">Deepseek</option>
                      <option value="grok">Grok</option>
                    </select>
                  </label>
                  
                  <label>
                    Số lượng tài liệu lấy về (retrieval)
                    <input
                      type="number"
                      name="topK"
                      min="1"
                      max="300"
                      value={querySettings.topK}
                      onChange={handleSettingChange}
                    />
                  </label>
                  
                  <label>
                    Số lượng tài liệu xếp hạng lại (reranking)
                    <input
                      type="number"
                      name="topN"
                      min="1"
                      max="100"
                      value={querySettings.topN}
                      onChange={handleSettingChange}
                    />
                  </label>
                  
                  <label style={{ display: "none" }}>
                    Độ ngẫu nhiên (temperature)
                    <input
                      type="number"
                      name="temperature"
                      min="0"
                      max="1"
                      step="0.1"
                      value={querySettings.temperature}
                      onChange={handleSettingChange}
                    />
                  </label>
                  
                  <label>
                    Giới hạn số từ đầu ra (max_tokens)
                    <input
                      type="number"
                      name="maxTokens"
                      min="100"
                      max="2000"
                      step="50"
                      value={querySettings.maxTokens}
                      onChange={handleSettingChange}
                    />
                  </label>
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
                  collections.map(collection => (
                    <CollectionItem key={collection.name}>
                      <input
                        type="checkbox"
                        checked={selectedCollections.includes(collection.name)}
                        onChange={() => handleCollectionSelect(collection.name)}
                      />
                      <span>{collection.name}</span>
                    </CollectionItem>
                  ))
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

export default ChatInterface; 
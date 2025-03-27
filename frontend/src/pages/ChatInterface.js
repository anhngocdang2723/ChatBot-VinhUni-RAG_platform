import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FiSend, FiSettings, FiSearch, FiCornerDownRight, FiLink, FiFile, FiChevronDown, FiChevronUp, FiBookmark } from 'react-icons/fi';
import Layout from '../components/Layout';
import { useApi } from '../context/ApiContext';

const PageHeader = styled.div`
  margin-bottom: var(--spacing-lg);
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: var(--spacing-sm);
`;

const Subtitle = styled.p`
  color: var(--dark-gray);
`;

const ChatContainer = styled.div`
  display: flex;
  height: calc(100vh - 220px);
  min-height: 500px;
`;

const MainChat = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
`;

const Sidebar = styled.div`
  width: 300px;
  margin-right: var(--spacing-lg);
  background-color: var(--white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-md);
  overflow-y: auto;
`;

const ChatMessages = styled.div`
  flex: 1;
  padding: var(--spacing-lg);
  overflow-y: auto;
`;

const ChatInputContainer = styled.div`
  border-top: 1px solid var(--mid-gray);
  padding: var(--spacing-md);
  background-color: var(--white);
`;

const ChatInputForm = styled.form`
  display: flex;
  gap: var(--spacing-sm);
`;

const ChatInput = styled.input`
  flex: 1;
  padding: var(--spacing-md);
  border: 1px solid var(--mid-gray);
  border-radius: var(--radius-full);
  font-size: 1rem;
  
  &:focus {
    border-color: var(--primary-color);
  }
`;

const SendButton = styled.button`
  border-radius: var(--radius-full);
  width: 40px;
  height: 40px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Message = styled.div`
  margin-bottom: var(--spacing-lg);
  display: flex;
  flex-direction: column;
`;

const UserMessage = styled(Message)`
  align-items: flex-end;
  
  .message-content {
    background-color: var(--primary-light);
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
  max-width: 80%;
  line-height: 1.5;
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
  background-color: rgba(0, 0, 0, 0.05);
  gap: var(--spacing-xs);
  
  svg {
    margin-top: 3px;
    flex-shrink: 0;
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

const SettingsPanel = styled.div`
  margin-bottom: var(--spacing-lg);
`;

const SettingTitle = styled.div`
  font-weight: 500;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  margin-bottom: var(--spacing-sm);
`;

const SettingsContent = styled.div`
  padding-bottom: var(--spacing-sm);
`;

const CollectionsList = styled.div`
  margin-top: var(--spacing-md);
`;

const CollectionItem = styled.div`
  display: flex;
  align-items: center;
  padding: var(--spacing-xs) 0;
  
  input {
    margin-right: var(--spacing-sm);
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: var(--gray);
  text-align: center;
  padding: var(--spacing-xl);
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
    maxTokens: 500,
  });
  
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    fetchCollections();
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const fetchCollections = async () => {
    const fetchedCollections = await getCollections();
    setCollections(fetchedCollections || []);
    
    // Pre-select all collections
    if (fetchedCollections && fetchedCollections.length > 0) {
      setSelectedCollections(fetchedCollections.map(c => c.name));
    }
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage = { type: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Prepare query data
    const queryData = {
      query: input,
      top_k: querySettings.topK,
      top_n: querySettings.topN,
      temperature: querySettings.temperature,
      max_tokens: querySettings.maxTokens
    };

    // Only add collection_names if there are selected collections
    if (selectedCollections && selectedCollections.length > 0) {
      queryData.collection_names = selectedCollections;
    }

    // Get response from API
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
        content: 'Sorry, I encountered an error processing your request.',
        sources: []
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    // Scroll to bottom
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
      [name]: value,
    }));
  };
  
  return (
    <Layout>
      <PageHeader>
        <Title>Chat Interface</Title>
        <Subtitle>Ask questions about your documents</Subtitle>
      </PageHeader>
      
      <ChatContainer>
        <Sidebar>
          <SettingsPanel>
            <SettingTitle onClick={() => setShowAdvanced(!showAdvanced)}>
              <div>
                <FiSettings /> Advanced Settings
              </div>
              {showAdvanced ? <FiChevronUp /> : <FiChevronDown />}
            </SettingTitle>
            
            {showAdvanced && (
              <SettingsContent>
                <div className="mb-sm">
                  <label htmlFor="topK">Top K (retrieval)</label>
                  <input
                    type="number"
                    id="topK"
                    name="topK"
                    min="1"
                    max="100"
                    value={querySettings.topK}
                    onChange={handleSettingChange}
                  />
                </div>
                
                <div className="mb-sm">
                  <label htmlFor="topN">Top N (reranking)</label>
                  <input
                    type="number"
                    id="topN"
                    name="topN"
                    min="1"
                    max="50"
                    value={querySettings.topN}
                    onChange={handleSettingChange}
                  />
                </div>
                
                <div className="mb-sm">
                  <label htmlFor="temperature">Temperature</label>
                  <input
                    type="number"
                    id="temperature"
                    name="temperature"
                    min="0"
                    max="1"
                    step="0.1"
                    value={querySettings.temperature}
                    onChange={handleSettingChange}
                  />
                </div>
                
                <div className="mb-sm">
                  <label htmlFor="maxTokens">Max Tokens</label>
                  <input
                    type="number"
                    id="maxTokens"
                    name="maxTokens"
                    min="100"
                    max="2000"
                    step="50"
                    value={querySettings.maxTokens}
                    onChange={handleSettingChange}
                  />
                </div>
              </SettingsContent>
            )}
          </SettingsPanel>
          
          <div>
            <div className="mb-sm">
              <FiBookmark /> Collections to search
            </div>
            
            {collections.length > 0 ? (
              <CollectionsList>
                {collections.map(collection => (
                  <CollectionItem key={collection.name}>
                    <input
                      type="checkbox"
                      id={`collection-${collection.name}`}
                      checked={selectedCollections.includes(collection.name)}
                      onChange={() => handleCollectionSelect(collection.name)}
                    />
                    <label htmlFor={`collection-${collection.name}`}>{collection.name}</label>
                  </CollectionItem>
                ))}
              </CollectionsList>
            ) : (
              <div>No collections available</div>
            )}
          </div>
        </Sidebar>
        
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
                        {message.content}
                        
                        {message.sources && message.sources.length > 0 && (
                          <MessageSources>
                            <div><FiCornerDownRight /> Sources:</div>
                            {message.sources.slice(0, 3).map((source, idx) => (
                              <SourceItem key={idx}>
                                <FiFile />
                                <div>
                                  <div>{source.metadata?.original_filename || 'Document'}</div>
                                  <SourceText>{source.text}</SourceText>
                                </div>
                              </SourceItem>
                            ))}
                          </MessageSources>
                        )}
                      </MessageContent>
                    </BotMessage>
                  );
                }
              })
            ) : (
              <EmptyState>
                <FiSearch size={48} style={{ marginBottom: 'var(--spacing-md)' }} />
                <h3>Ask a question about your documents</h3>
                <p>I'll search through your document collections and provide answers.</p>
              </EmptyState>
            )}
            <div ref={messagesEndRef} />
          </ChatMessages>
          
          <ChatInputContainer>
            <ChatInputForm onSubmit={handleSubmit}>
              <ChatInput
                type="text"
                placeholder="Ask a question..."
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
      </ChatContainer>
    </Layout>
  );
};

export default ChatInterface; 
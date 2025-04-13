import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FiSend, FiFile, FiChevronDown, FiImage, FiX, FiCamera } from 'react-icons/fi';
import { useApi } from '../context/ApiContext';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import '../styles/katex.css';
import html2canvas from 'html2canvas';
import TypingMessage from './TypingMessage';

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
  scroll-behavior: smooth;

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

    /* Math formula styling */
    .math {
      display: block;
      margin: 1em 0;
      text-align: center;
    }

    .math-inline {
      display: inline;
      margin: 0;
    }

    .katex {
      font-size: 1.2em;
      line-height: 1.6;
    }

    .katex-display {
      display: block;
      margin: 1.5em 0;
      text-align: center;
      overflow-x: auto;
      overflow-y: hidden;
      padding: 0.5em 0;
    }

    .katex-display > .katex {
      display: inline-block;
      text-align: initial;
      max-width: 100%;
    }

    .katex-html {
      overflow-x: auto;
      overflow-y: hidden;
      padding: 0.5em;
    }

    .katex-html > .base {
      margin: 0;
      padding: 0;
    }

    /* Ensure proper spacing around math blocks */
    .katex-display + p {
      margin-top: 1.5em;
    }

    p + .katex-display {
      margin-top: 1.5em;
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
  padding: 0;

  svg {
    width: 20px;
    height: 20px;
    color: #005291;
  }

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

const CaptureButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--gray);
  background: none;
  border: none;
  position: relative;
  
  &:hover {
    background: var(--light-gray);
    color: var(--dark-gray);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .shortcut-hint {
    position: absolute;
    bottom: -20px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.7rem;
    white-space: nowrap;
    color: var(--gray);
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover .shortcut-hint {
    opacity: 1;
  }
`;

// Maximum image size in bytes (3MB)
const MAX_IMAGE_SIZE = 3 * 1024 * 1024;
// Maximum number of messages to keep in chat history
const MAX_CHAT_HISTORY = 3;

const ScreenCaptureOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.2);
  cursor: crosshair;
  z-index: 9999;
  display: ${props => props.visible ? 'block' : 'none'};
`;

const SelectionArea = styled.div`
  position: absolute;
  border: 2px solid #0066b3;
  background: rgba(0, 102, 179, 0.1);
  pointer-events: none;
`;

const CaptureInstructions = styled.div`
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 8px 16px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  font-size: 14px;
  color: #333;
  z-index: 10000;
`;

const ElearningChatInterface = ({ selectedCourse }) => {
  const { queryRag } = useApi();
  const [messages, setMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState(null);
  const messagesEndRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);
  const [currentSelection, setCurrentSelection] = useState(null);
  const overlayRef = useRef(null);
  const mediaStreamRef = useRef(null);
  
  useEffect(() => {
    setChatHistory([]);
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedCourse) {
      const initialMessage = {
        type: 'bot',
        content: `Chào mừng bạn đến với trợ lý học tập cho môn ${selectedCourse.title}! Tôi sẽ tập trung trả lời các câu hỏi liên quan đến:
- Nội dung bài giảng và tài liệu học tập
- Bài tập và dự án của môn học
- Thông báo và thời hạn quan trọng
- Các vấn đề liên quan đến môn học

Bạn có thể hỏi bất cứ điều gì về môn học này!`,
        sources: [],
        isTyping: true
      };
      setMessages([initialMessage]);
      setChatHistory([{ role: 'assistant', content: initialMessage.content }]);
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

  // Update chat history with limit
  const updateChatHistory = (newMessage) => {
    setChatHistory(prev => {
      const updatedHistory = [...prev, newMessage];
      // Keep only the most recent messages up to MAX_CHAT_HISTORY
      return updatedHistory.slice(-MAX_CHAT_HISTORY);
    });
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
      
      if (selectedImage) {
        try {
          processedImage = await prepareImageForApi(selectedImage, imagePreview);
        } catch (imgError) {
          throw new Error(`Lỗi xử lý ảnh: ${imgError.message}`);
        }
      }

      updateChatHistory({ role: 'user', content: input });

      const queryData = {
        query: input,
        collection_names: [selectedCourse.collectionName],
        context: {
          course_title: selectedCourse.title,
          course_code: selectedCourse.code,
          course_description: selectedCourse.description,
          chapters: selectedCourse.chapters,
          chat_history: chatHistory
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
          is_fallback: response.is_fallback || false,
          isTyping: true
        };
        setMessages(prev => prev.slice(0, -1).concat(botMessage));
        updateChatHistory({ role: 'assistant', content: response.answer });
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
        is_fallback: false,
        isTyping: true
      };
      setMessages(prev => prev.slice(0, -1).concat(errorMessage));
      updateChatHistory({ role: 'assistant', content: errorMessage.content });
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

  // Handle paste events
  useEffect(() => {
    const handlePaste = async (e) => {
      if (!selectedCourse || isLoading) return;

      const items = e.clipboardData.items;
      let imageFile = null;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          imageFile = items[i].getAsFile();
          break;
        }
      }

      if (imageFile) {
        try {
          // Reset any previous errors
          setImageError(null);
          
          // Check file size
          if (imageFile.size > MAX_IMAGE_SIZE) {
            setImageError(`Kích thước ảnh quá lớn (tối đa ${MAX_IMAGE_SIZE / (1024 * 1024)}MB)`);
            return;
          }
          
          setSelectedImage(imageFile);
          const reader = new FileReader();
          reader.onloadend = () => {
            setImagePreview(reader.result);
          };
          reader.onerror = () => {
            setImageError('Không thể đọc tập tin ảnh');
            setSelectedImage(null);
          };
          reader.readAsDataURL(imageFile);
        } catch (error) {
          console.error('Error handling pasted image:', error);
          setImageError('Lỗi xử lý ảnh được dán');
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [selectedCourse, isLoading]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyboardShortcut = (e) => {
      // Check if Ctrl+Shift+S is pressed and component is active
      if (e.ctrlKey && e.shiftKey && e.key === 'S' && selectedCourse && !isLoading) {
        e.preventDefault(); // Prevent default browser save action
        startScreenCapture();
      }
    };

    document.addEventListener('keydown', handleKeyboardShortcut);
    return () => document.removeEventListener('keydown', handleKeyboardShortcut);
  }, [selectedCourse, isLoading]); // Dependencies for the effect

  // Screen capture functionality
  const startScreenCapture = async () => {
    try {
      // Request screen capture with system picker
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always"
        },
        audio: false
      });
      
      mediaStreamRef.current = stream;
      setIsCapturing(true);
    } catch (error) {
      console.error('Error starting screen capture:', error);
      if (error.name === 'NotAllowedError') {
        setImageError('Người dùng đã hủy chụp màn hình');
      } else {
        setImageError('Lỗi khi bắt đầu chụp màn hình');
      }
    }
  };

  const handleMouseDown = (e) => {
    if (!isCapturing) return;
    
    const overlay = overlayRef.current;
    if (!overlay) return;

    const rect = overlay.getBoundingClientRect();
    setSelectionStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setSelectionEnd(null);
  };

  const handleMouseMove = (e) => {
    if (!isCapturing || !selectionStart) return;
    
    const overlay = overlayRef.current;
    if (!overlay) return;

    const rect = overlay.getBoundingClientRect();
    const end = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    setSelectionEnd(end);

    // Calculate selection rectangle
    const selection = {
      left: Math.min(selectionStart.x, end.x),
      top: Math.min(selectionStart.y, end.y),
      width: Math.abs(end.x - selectionStart.x),
      height: Math.abs(end.y - selectionStart.y)
    };
    setCurrentSelection(selection);
  };

  const handleMouseUp = async () => {
    if (!isCapturing || !selectionStart || !selectionEnd || !currentSelection || !mediaStreamRef.current) {
      resetCapture();
      return;
    }

    try {
      const stream = mediaStreamRef.current;
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;

      await video.play();

      // Create canvas for the selected area
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      // Set canvas size to selection size
      canvas.width = currentSelection.width;
      canvas.height = currentSelection.height;
      
      // Calculate the scale factor between video and screen coordinates
      const track = stream.getVideoTracks()[0];
      const settings = track.getSettings();
      const scaleX = settings.width / window.innerWidth;
      const scaleY = settings.height / window.innerHeight;

      // Draw the selected portion of the video frame to canvas
      context.drawImage(
        video,
        currentSelection.left * scaleX,
        currentSelection.top * scaleY,
        currentSelection.width * scaleX,
        currentSelection.height * scaleY,
        0,
        0,
        currentSelection.width,
        currentSelection.height
      );
      
      // Convert to blob
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
      
      // Stop all tracks
      stream.getTracks().forEach(track => track.stop());
      
      // Create file from blob
      const file = new File([blob], 'screenshot.jpg', { type: 'image/jpeg' });
      
      // Check file size
      if (file.size > MAX_IMAGE_SIZE) {
        setImageError(`Kích thước ảnh quá lớn (tối đa ${MAX_IMAGE_SIZE / (1024 * 1024)}MB)`);
        resetCapture();
        return;
      }
      
      // Set the captured image
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error('Error capturing screen area:', error);
      setImageError('Lỗi khi chụp màn hình');
    }
    
    resetCapture();
  };

  const resetCapture = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCapturing(false);
    setSelectionStart(null);
    setSelectionEnd(null);
    setCurrentSelection(null);
  };

  // Handle escape key to cancel capture
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isCapturing) {
        resetCapture();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isCapturing]);

  // Clean up media stream on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <>
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
        
        <ChatMessages className="chat-messages-container">
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
                    {message.isTyping ? (
                      <TypingMessage content={message.content} isMath={true} />
                    ) : (
                      <div className="markdown-content">
                        <ReactMarkdown
                          remarkPlugins={[remarkMath]}
                          rehypePlugins={[[rehypeKatex, {
                            strict: false,
                            throwOnError: false,
                            displayMode: true,
                            fleqn: false,
                            leqno: false,
                            minRuleThickness: 0.04,
                            macros: {
                              "\\text": "\\text",
                              "\\frac": "\\frac",
                              "\\displaystyle": "\\displaystyle"
                            }
                          }]]}
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
          })}
          <div ref={messagesEndRef} />
        </ChatMessages>

        <InputContainer>
          <InputWrapper>
            <Input
              type="text"
              placeholder="Nhập câu hỏi của bạn... (Ctrl+V để dán ảnh)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading || !selectedCourse}
            />
            <CaptureButton
              onClick={startScreenCapture}
              disabled={isLoading || !selectedCourse}
              title="Chụp màn hình (Ctrl+Shift+S)"
            >
              <FiCamera size={18} />
              <span className="shortcut-hint">Ctrl+Shift+S</span>
            </CaptureButton>
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
              <FiSend size={20} />
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

      <ScreenCaptureOverlay
        ref={overlayRef}
        visible={isCapturing}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <CaptureInstructions>
          Kéo chuột để chọn vùng muốn chụp. Nhấn ESC để hủy.
        </CaptureInstructions>
        {currentSelection && (
          <SelectionArea
            style={{
              left: currentSelection.left + 'px',
              top: currentSelection.top + 'px',
              width: currentSelection.width + 'px',
              height: currentSelection.height + 'px'
            }}
          />
        )}
      </ScreenCaptureOverlay>
    </>
  );
};

export default ElearningChatInterface;
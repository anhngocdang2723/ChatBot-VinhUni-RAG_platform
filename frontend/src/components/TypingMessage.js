import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import '../styles/math.css';

const TypingMessage = ({ content, isMath = false }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const messageRef = useRef(null);

  useEffect(() => {
    if (currentIndex < content.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + content[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 20); // Adjust typing speed here (lower number = faster) now is 15ms

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, content]);

  // Auto-scroll when new content is displayed
  useEffect(() => {
    if (messageRef.current) {
      const container = messageRef.current.closest('.chat-messages-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [displayedText]);

  return (
    <div className="markdown-content" ref={messageRef}>
      {isMath ? (
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            math: ({ node, ...props }) => (
              <span className="math-inline" {...props} />
            ),
            inlineMath: ({ node, ...props }) => (
              <span className="math-inline" {...props} />
            ),
            mathBlock: ({ node, ...props }) => (
              <div className="math-display" {...props} />
            ),
            blockMath: ({ node, ...props }) => (
              <div className="math-display" {...props} />
            )
          }}
        >
          {displayedText}
        </ReactMarkdown>
      ) : (
        <ReactMarkdown>{displayedText}</ReactMarkdown>
      )}
    </div>
  );
};

export default TypingMessage; 
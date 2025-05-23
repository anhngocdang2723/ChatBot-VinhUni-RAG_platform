from underthesea import word_tokenize, pos_tag, text_normalize
import re
from typing import Optional, List
import logging

# Configure logging
logger = logging.getLogger(__name__)

class QueryProcessor:
    """
    A class to preprocess and clean user queries before sending to the RAG system.
    Uses underthesea for Vietnamese text processing.
    Optimized for Truong Dai hoc Vinh data queries.
    """
    
    # Common Vietnamese stopwords
    STOP_WORDS = {
        'và', 'hoặc', 'nhưng', 'mà', 'nếu', 'thì', 'là', 'của', 'trong', 'ngoài',
        'trên', 'dưới', 'trước', 'sau', 'giữa', 'bên', 'cạnh', 'đối', 'với',
        'theo', 'từ', 'đến', 'ở', 'tại', 'về', 'để', 'cho', 'vì', 'do', 'bởi',
        'nên', 'đã', 'đang', 'sẽ', 'được', 'bị', 'phải', 'có', 'không', 'chưa',
        'rất', 'quá', 'lắm', 'nhiều', 'ít', 'mấy', 'bao', 'nào', 'gì', 'đâu',
        'nào', 'sao', 'thế', 'vậy', 'này', 'kia', 'đó', 'đây', 'ấy', 'nọ',
        'tôi', 'tao', 'mày', 'bạn', 'các', 'những', 'cái', 'con', 'người', 'việc',
        'điều', 'câu', 'chuyện', 'lúc', 'khi', 'nơi', 'chỗ', 'đâu', 'đấy', 'đó',
        'này', 'kia', 'ấy', 'nọ', 'đây', 'đấy', 'đó', 'này', 'kia', 'ấy', 'nọ'
    }
    
    # Domain-specific keywords to preserve
    DOMAIN_KEYWORDS = {
        'mã hp', 'lớp học phần', 'khóa học', 'số tc', 'số sv', 'hình thức học',
        'tuần học', 'thứ', 'tiết', 'phòng học', 'cơ sở', 'giáo viên', 'khoa', 'viện',
        'thông báo', 'quyết định', 'văn bản', 'nghị quyết', 'kế hoạch', 'lịch',
        'đào tạo', 'sinh viên', 'học phí', 'học bổng', 'tốt nghiệp', 'thi',
        'điểm', 'kỳ', 'học kỳ', 'năm học', 'chương trình', 'ngành'
    }
    
    # Maximum query length
    MAX_QUERY_LENGTH = 1000
    
    @staticmethod
    def normalize_vietnamese(text: str) -> str:
        """Normalize Vietnamese text using underthesea."""
        try:
            return text_normalize(text)
        except Exception as e:
            logger.warning(f"Error normalizing text: {str(e)}")
            return text
    
    @staticmethod
    def extract_keywords(text: str) -> List[str]:
        """Extract important keywords from text."""
        try:
            # Tokenize and POS tag
            tokens = word_tokenize(text)
            pos_tags = pos_tag(text)
            
            keywords = []
            for word, pos in pos_tags:
                # Keep domain keywords regardless of POS
                is_domain_keyword = any(keyword in word.lower() for keyword in QueryProcessor.DOMAIN_KEYWORDS)
                
                # Keep words based on POS or domain relevance
                if (is_domain_keyword or 
                    pos.startswith('N') or  # Nouns
                    pos.startswith('V') or  # Verbs
                    pos.startswith('A') or  # Adjectives
                    (word.lower() not in QueryProcessor.STOP_WORDS and len(word) > 1)):
                    keywords.append(word)
            
            return keywords
        except Exception as e:
            logger.error(f"Error extracting keywords: {str(e)}")
            return []
    
    @staticmethod
    def clean_query(query: str) -> str:
        """
        Clean and preprocess the query:
        1. Validate and truncate if too long
        2. Normalize Vietnamese text
        3. Remove special characters and extra spaces
        4. Extract and preserve important keywords
        5. Remove stop words while preserving domain-specific keywords
        """
        try:
            if not query or not query.strip():
                raise ValueError("Empty query")
            
            # Truncate if too long
            if len(query) > QueryProcessor.MAX_QUERY_LENGTH:
                query = query[:QueryProcessor.MAX_QUERY_LENGTH]
                logger.warning(f"Query truncated to {QueryProcessor.MAX_QUERY_LENGTH} characters")
            
            # Normalize Vietnamese text
            query = QueryProcessor.normalize_vietnamese(query)
            
            # Remove special characters and extra spaces
            query = re.sub(r'[^\w\s]', ' ', query)
            query = re.sub(r'\s+', ' ', query).strip()
            
            # Convert to lowercase
            query = query.lower()
            
            # Extract keywords
            keywords = QueryProcessor.extract_keywords(query)
            
            if not keywords:
                # If no keywords found, return normalized original query
                return query
            
            # Join keywords back into query
            processed_query = ' '.join(keywords)
            
            logger.debug(f"Processed query: {processed_query}")
            return processed_query
            
        except Exception as e:
            logger.error(f"Error processing query: {str(e)}")
            return query  # Return original query if processing fails
    
    @staticmethod
    def extract_metadata_filters(query: str) -> Optional[dict]:
        """Extract metadata filters from query if present."""
        try:
            filters = {}
            
            # Extract document type
            doc_types = ['thông báo', 'quyết định', 'văn bản', 'kế hoạch']
            for doc_type in doc_types:
                if doc_type in query.lower():
                    filters['document_type'] = doc_type.upper()
                    break
            
            # Extract department if mentioned
            departments = ['đào tạo', 'công tác sinh viên', 'khảo thí', 'tài chính']
            for dept in departments:
                if dept in query.lower():
                    filters['department'] = dept.upper()
                    break
            
            # Extract date ranges if present
            date_pattern = r'(từ|trong|sau|trước)\s+(\d{1,2}[-/]\d{1,2}[-/]\d{4})'
            date_matches = re.findall(date_pattern, query)
            if date_matches:
                # Process date filters...
                pass
            
            return filters if filters else None
            
        except Exception as e:
            logger.error(f"Error extracting metadata filters: {str(e)}")
            return None 
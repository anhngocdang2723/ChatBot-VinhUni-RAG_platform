from underthesea import word_tokenize, pos_tag
import re

class QueryProcessor:
    """
    A class to preprocess and clean user queries before sending to the RAG system.
    Uses underthesea for Vietnamese text processing.
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
    
    @staticmethod
    def clean_query(query: str) -> str:
        """
        Clean and preprocess the query:
        1. Remove special characters and extra spaces
        2. Convert to lowercase
        3. Remove stop words
        4. Keep only meaningful words (nouns, verbs, adjectives)
        """
        # Remove special characters and extra spaces
        query = re.sub(r'[^\w\s]', ' ', query)
        query = re.sub(r'\s+', ' ', query).strip()
        
        # Convert to lowercase
        query = query.lower()
        
        # Tokenize and POS tag
        tokens = word_tokenize(query)
        pos_tags = pos_tag(query)
        
        # Filter meaningful words
        meaningful_words = []
        for word, pos in pos_tags:
            # Keep nouns, verbs, adjectives, and words not in stop words
            if (pos.startswith('N') or pos.startswith('V') or pos.startswith('A') or 
                (word not in QueryProcessor.STOP_WORDS and len(word) > 1)):
                meaningful_words.append(word)
        
        # Join words back into a query
        processed_query = ' '.join(meaningful_words)
        
        return processed_query if processed_query else query 
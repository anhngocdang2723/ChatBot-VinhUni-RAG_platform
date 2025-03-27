from typing import Optional, Dict, List, Any
import logging
import json
import requests
from openai import OpenAI
from requests.exceptions import RequestException

# Configure logger
logger = logging.getLogger(__name__)

def create_llm_provider(provider_name: str, api_key: str):
    """Create a provider configuration dictionary"""
    return {"provider": provider_name, "api_key": api_key}

class RAGPromptManager:
    """
    Manages prompt generation and LLM interactions for RAG.
    Supports OpenAI and Deepseek APIs.
    """
    
    def __init__(self, provider: dict):
        """
        Initialize with a provider configuration.
        
        Args:
            provider: Dictionary with provider details (provider name and API key)
        """
        self.provider = provider
        self.api_key = provider["api_key"]
        self.provider_name = provider["provider"].lower()
        
        # Initialize based on provider
        if self.provider_name == "openai":
            self.client = OpenAI(api_key=self.api_key)
            self.api_url = None
        elif self.provider_name == "deepseek":
            self.client = None
            self.api_url = "https://api.deepseek.com/v1/chat/completions"
        else:
            raise ValueError(f"Unsupported provider: {provider['provider']}")
    
    def _create_prompt(self, query: str, documents: List[Dict[str, Any]]) -> str:
        """
        Create a prompt for the LLM using the query and retrieved documents.
        
        Args:
            query: User's question
            documents: List of retrieved documents with text and metadata
        """
        # Start with system context
        prompt = "Bạn là một trợ lý AI thông minh. Hãy trả lời câu hỏi dựa trên các tài liệu được cung cấp.\n\n"
        
        # Add retrieved documents as context
        prompt += "Dựa trên các tài liệu sau:\n"
        for i, doc in enumerate(documents, 1):
            # Add metadata if available
            metadata = doc.get("metadata", {})
            source = metadata.get("source_collection", metadata.get("collection_name", "unknown"))
            doc_type = metadata.get("document_type", "unknown")
            
            prompt += f"\nTài liệu {i} (Nguồn: {source}, Loại: {doc_type}):\n{doc['text']}\n"
            
        # Add the query
        prompt += f"\nCâu hỏi: {query}\n"
        prompt += "\nTrả lời chi tiết và chính xác dựa trên thông tin từ các tài liệu trên:"
        
        return prompt
        
    def _call_openai(self, prompt: str, temperature: float, max_tokens: int) -> str:
        """Call OpenAI API"""
        response = self.client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "Bạn là một trợ lý AI thông minh, nhiệm vụ của bạn là trả lời câu hỏi dựa trên các tài liệu được cung cấp một cách chính xác và đầy đủ."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=temperature,
            max_tokens=max_tokens
        )
        return response.choices[0].message.content

    def _call_deepseek(self, prompt: str, temperature: float, max_tokens: int) -> str:
        """Call Deepseek API"""
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        data = {
            "model": "deepseek-chat",
            "messages": [
                {
                    "role": "system",
                    "content": "Bạn là một trợ lý AI thông minh, nhiệm vụ của bạn là trả lời câu hỏi dựa trên các tài liệu được cung cấp một cách chính xác và đầy đủ. Luôn trả lời bằng tiếng Việt."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        response = requests.post(
            self.api_url,
            headers=headers,
            json=data,
            timeout=30
        )
        
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]

    def generate_answer(
        self,
        query: str,
        documents: List[Dict[str, Any]],
        temperature: float = 0.1,
        max_tokens: int = 500
    ) -> Dict[str, Any]:
        """
        Generate an answer using the LLM based on retrieved documents.
        
        Args:
            query: User's question
            documents: List of retrieved documents
            temperature: LLM temperature parameter
            max_tokens: Maximum tokens in response
            
        Returns:
            Dictionary containing the answer and source information
        """
        try:
            # Create the prompt
            prompt = self._create_prompt(query, documents)
            
            # Call appropriate API based on provider
            if self.provider_name == "openai":
                answer = self._call_openai(prompt, temperature, max_tokens)
            else:  # deepseek
                answer = self._call_deepseek(prompt, temperature, max_tokens)
            
            # Format sources with enhanced metadata
            sources = []
            for doc in documents:
                metadata = doc.get("metadata", {})
                source = {
                    "text": doc["text"],
                    "metadata": metadata,
                    "score": doc.get("rerank_score", doc.get("score", 0.0)),
                    "source": metadata.get("source_collection", metadata.get("collection_name", "unknown")),
                    "document_type": metadata.get("document_type", "unknown")
                }
                sources.append(source)
            
            return {
                "answer": answer,
                "sources": sources
            }
            
        except RequestException as e:
            logger.error(f"API request error: {str(e)}")
            return {
                "answer": "Xin lỗi, không thể kết nối với dịch vụ AI lúc này. Vui lòng thử lại sau.",
                "sources": []
            }
        except Exception as e:
            logger.error(f"Error generating answer: {str(e)}")
            return {
                "answer": "Xin lỗi, tôi không thể tạo câu trả lời lúc này. Vui lòng thử lại sau.",
                "sources": []
            } 
import os
import logging
from typing import List, Dict, Any, Optional
from abc import ABC, abstractmethod
from openai import OpenAI
import json

# Configure logging
logging.basicConfig(level=logging.INFO,
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class LLMProvider(ABC):
    """Abstract base class for LLM providers."""
    
    @abstractmethod
    def generate_response(self, messages: List[Dict[str, str]], **kwargs) -> str:
        """Generate response from the LLM."""
        pass

class DeepSeekProvider(LLMProvider):
    """DeepSeek LLM provider implementation."""
    
    def __init__(self, api_key: str):
        self.client = OpenAI(
            api_key=api_key,
            base_url="https://api.deepseek.com/v1"
        )
    
    def generate_response(self, messages: List[Dict[str, str]], **kwargs) -> str:
        try:
            response = self.client.chat.completions.create(
                model="deepseek-chat",
                messages=messages,
                temperature=kwargs.get('temperature', 0.1),
                max_tokens=kwargs.get('max_tokens', 500)
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"DeepSeek API error: {str(e)}")
            return f"Error generating response: {str(e)}"

class GrokProvider(LLMProvider):
    """Grok LLM provider implementation."""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        # Initialize Grok client when API becomes available
    
    def generate_response(self, messages: List[Dict[str, str]], **kwargs) -> str:
        # Implement when Grok API becomes available
        raise NotImplementedError("Grok API integration not yet implemented")

class RAGPromptManager:
    """
    Manages RAG prompts and interfaces with different LLM providers.
    """
    
    def __init__(self, provider: LLMProvider):
        self.provider = provider
    
    def format_context(self, documents: List[Dict]) -> str:
        """Format retrieved documents into context string."""
        context_parts = []
        for doc in documents:
            text = doc['text']
            metadata = doc['metadata']
            source_info = f"Source: {metadata.get('source', 'Unknown')}"
            if 'page' in metadata:
                source_info += f", Page: {metadata['page']}"
            context_parts.append(f"{source_info}\n{text}")
        
        return "\n\n---\n\n".join(context_parts)
    
    def create_prompt(self, query: str, context: str) -> List[Dict[str, str]]:
        """Create a structured prompt for the LLM."""
        return [
            {
                "role": "system",
                "content": """You are a helpful assistant that answers questions based on the provided context. 
                Follow these rules:
                1. Only use information from the provided context
                2. If the answer cannot be found in the context, say so
                3. Cite sources when possible
                4. Be concise but thorough
                5. If the context contains technical information, maintain its technical accuracy"""
            },
            {
                "role": "user",
                "content": f"""Context:
                ---
                {context}
                ---

                Question: {query}

                Please provide a clear and accurate answer based solely on the above context."""
            }
        ]
    
    def generate_answer(
        self,
        query: str,
        documents: List[Dict],
        temperature: float = 0.1,
        max_tokens: int = 500
    ) -> Dict[str, Any]:
        """
        Generate an answer using the LLM based on retrieved documents.
        
        Args:
            query: User's question
            documents: Retrieved and reranked documents
            temperature: LLM temperature parameter
            max_tokens: Maximum tokens in response
            
        Returns:
            Dictionary containing answer and source information
        """
        try:
            # Format context from documents
            context = self.format_context(documents)
            
            # Create prompt
            messages = self.create_prompt(query, context)
            
            # Generate response
            answer = self.provider.generate_response(
                messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            return {
                "answer": answer,
                "sources": documents
            }
            
        except Exception as e:
            logger.error(f"Error generating answer: {str(e)}")
            return {
                "answer": f"Error generating answer: {str(e)}",
                "sources": documents
            }

def create_llm_provider(provider_name: str, api_key: str) -> LLMProvider:
    """Factory function to create LLM provider instances."""
    providers = {
        "deepseek": DeepSeekProvider,
        "grok": GrokProvider
        # Add more providers here
    }
    
    provider_class = providers.get(provider_name.lower())
    if not provider_class:
        raise ValueError(f"Unknown provider: {provider_name}")
    
    return provider_class(api_key) 
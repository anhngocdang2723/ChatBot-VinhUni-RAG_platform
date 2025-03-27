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
        Create an advanced prompt in English for the LLM using the query and retrieved documents,
        specifying it's a chatbot for Vinh University, and instructing it to provide a 
        concise, accurate answer in Vietnamese based ONLY on the context.

        Args:
            query: User's question (will be included in the prompt)
            documents: List of retrieved documents with text and metadata
        """

        # --- English Prompt Construction ---

        # System Role and Core Instruction - NOW INCLUDES VINH UNIVERSITY CONTEXT
        prompt = "You are a specialized AI assistant for Vinh University. Your primary role is to provide accurate and concise answers to questions specifically related to Vinh University, based *strictly* on the provided context documents (likely originating from Vinh University's knowledge base). Do not add information not present in these documents. Avoid interpretation beyond the text. Your final answer *must* be in Vietnamese."

        # Context Section
        prompt += "\n\n<context>"
        prompt += "\nBased on the following documents (relevant to Vinh University):" # Added context hint
        if not documents:
            prompt += "\nNo documents provided."
        else:
            for i, doc in enumerate(documents, 1):
                metadata = doc.get("metadata", {})
                # Prioritize more specific source identifiers if available
                source_info = metadata.get("source_id", metadata.get("source_collection", metadata.get("collection_name", "unknown")))
                doc_type = metadata.get("document_type", "unknown")

                prompt += f"\n\nDocument {i} (Source: {source_info}, Type: {doc_type}):"
                prompt += f"\n```\n{doc['text']}\n```" # Using triple backticks for better block separation

        prompt += "\n</context>"

        # Query Section
        prompt += "\n\n<query>"
        prompt += f"\nUser Question (likely about Vinh University): {query}" # Added context hint
        prompt += "\n</query>"

        # Final Instruction and Output Formatting
        prompt += "\n\n<instructions>"
        prompt += "\n1. Analyze the provided documents within the <context> section, considering they relate to Vinh University."
        prompt += "\n2. Identify the information directly relevant to answering the User Question in the <query> section."
        prompt += "\n3. Synthesize a concise and accurate answer based *only* on the relevant information found within the documents."
        prompt += "\n4. If the documents do not contain the answer, state clearly in Vietnamese that the information is not available in the provided context (e.g., 'Thông tin này không có trong tài liệu được cung cấp liên quan đến Trường Đại học Vinh.')." # Slightly more specific refusal
        prompt += "\n5. Do *not* use any prior knowledge or external information unrelated to the provided documents."
        prompt += "\n6. Do *not* provide lengthy explanations or interpretations unless explicitly asked by the query."
        prompt += "\n7. Ensure the final output is *only* the answer in Vietnamese."
        prompt += "\n</instructions>"

        # Answer Placeholder
        prompt += "\n\nVietnamese Answer:"
        # The LLM response should start directly after this line.

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
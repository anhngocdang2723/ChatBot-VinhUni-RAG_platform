from typing import Optional, Dict, List, Any
import logging
import json
import requests
import os
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
    Supports OpenAI, Deepseek, and Grok APIs.
    """
    
    def __init__(self, provider: dict):
        """
        Initialize with a provider configuration.
        
        Args:
            provider: Dictionary with provider details (provider name and API key)
        """
        self.provider = provider
        self.provider_name = provider["provider"].lower()
        
        # Initialize based on provider
        if self.provider_name == "openai":
            self.client = OpenAI(api_key=provider["api_key"])
            self.api_url = None
        elif self.provider_name == "deepseek":
            self.client = OpenAI(api_key=provider["api_key"], base_url="https://api.deepseek.com")
            self.api_url = None
        elif self.provider_name == "grok":
            self.client = OpenAI(api_key=provider["api_key"], base_url="https://api.x.ai/v1")
            self.api_url = None
        else:
            raise ValueError(f"Unsupported provider: {provider['provider']}")
    
    def _create_prompt(self, query: str, documents: List[Dict[str, Any]]) -> str:
        """
        Create an advanced prompt in English for the LLM using the query and retrieved documents,
        specifying it's a chatbot for Vinh University, and instructing it to provide a 
        concise, accurate answer in Vietnamese based on both context and general knowledge.

        Args:
            query: User's question (will be included in the prompt)
            documents: List of retrieved documents with text and metadata
        """

        # --- English Prompt Construction ---

        # System Role and Core Instruction
        prompt = "You are a specialized AI assistant for Vinh University. Your primary role is to provide accurate and concise answers to questions related to Vinh University. You can answer based on both provided context documents and your general knowledge about university policies and procedures. However, you must refuse to answer questions that are completely unrelated to Vinh University or university education in general. Your final answer *must* be in Vietnamese."

        # Context Section
        prompt += "\n\n<context>"
        prompt += "\nBased on the following documents (relevant to Vinh University):"
        if not documents:
            prompt += "\nNo documents provided."
        else:
            for i, doc in enumerate(documents, 1):
                metadata = doc.get("metadata", {})
                source_info = metadata.get("source_id", metadata.get("source_collection", metadata.get("collection_name", "unknown")))
                doc_type = metadata.get("document_type", "unknown")

                prompt += f"\n\nDocument {i} (Source: {source_info}, Type: {doc_type}):"
                prompt += f"\n```\n{doc['text']}\n```"

        prompt += "\n</context>"

        # Query Section
        prompt += "\n\n<query>"
        prompt += f"\nUser Question: {query}"
        prompt += "\n</query>"

        # Final Instruction and Output Formatting
        prompt += "\n\n<instructions>"
        prompt += "\n1. First, determine if the question is related to Vinh University or university education in general."
        prompt += "\n2. If the question is completely unrelated to university education, respond with: 'Câu hỏi này không liên quan đến Trường Đại học Vinh hoặc giáo dục đại học. Vui lòng hỏi câu hỏi khác.'"
        prompt += "\n3. If the question is about Vinh University or university education:"
        prompt += "\n   a. If relevant documents are provided, prioritize using information from those documents."
        prompt += "\n   b. If no documents are provided or if the documents don't contain the answer, you may use your general knowledge about university policies and procedures to provide a reasonable answer."
        prompt += "\n4. If using general knowledge, clearly state in Vietnamese that you're providing a general answer based on typical university policies."
        prompt += "\n5. Keep answers concise and focused on the specific question."
        prompt += "\n6. Ensure the final output is *only* the answer in Vietnamese."
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
        response = self.client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {
                    "role": "system",
                    "content": "Bạn là một trợ lý AI thông minh, nhiệm vụ của bạn là trả lời câu hỏi dựa trên các tài liệu được cung cấp một cách chính xác và đầy đủ. Luôn trả lời bằng tiếng Việt."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=temperature,
            max_tokens=max_tokens,
            stream=False
        )
        return response.choices[0].message.content

    def _call_grok(self, prompt: str, temperature: float, max_tokens: int) -> str:
        """Call Grok API"""
        response = self.client.chat.completions.create(
            model="grok-2-latest",
            messages=[
                {
                    "role": "system",
                    "content": "Bạn là một trợ lý AI thông minh, nhiệm vụ của bạn là trả lời câu hỏi dựa trên các tài liệu được cung cấp một cách chính xác và đầy đủ. Luôn trả lời bằng tiếng Việt."
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

    def generate_answer(
        self,
        query: str,
        documents: List[Dict[str, Any]],
        temperature: float = 0.1,
        max_tokens: int = 500,
        model: str = None
    ) -> Dict[str, Any]:
        """
        Generate an answer using the LLM based on retrieved documents.
        
        Args:
            query: User's question
            documents: List of retrieved documents
            temperature: LLM temperature parameter
            max_tokens: Maximum tokens in response
            model: Model to use (overrides provider's default model)
            
        Returns:
            Dictionary containing the answer and source information
        """
        try:
            # Create the prompt
            prompt = self._create_prompt(query, documents)
            
            # Use provided model or default based on provider
            current_provider = model.lower() if model else self.provider_name
            logger.info(f"Using provider: {current_provider} (requested model: {model}, default provider: {self.provider_name})")
            
            # Create a new client based on the current provider
            if current_provider == "openai":
                client = OpenAI(api_key=self.provider["api_key"])
            elif current_provider == "deepseek":
                client = OpenAI(api_key=self.provider["api_key"], base_url="https://api.deepseek.com")
            else:  # grok
                client = OpenAI(api_key=os.getenv("GROK_API_KEY"), base_url="https://api.x.ai/v1")
            
            # Call appropriate API based on provider
            if current_provider == "openai":
                response = client.chat.completions.create(
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
                answer = response.choices[0].message.content
            elif current_provider == "deepseek":
                response = client.chat.completions.create(
                    model="deepseek-chat",
                    messages=[
                        {
                            "role": "system",
                            "content": "Bạn là một trợ lý AI thông minh, nhiệm vụ của bạn là trả lời câu hỏi dựa trên các tài liệu được cung cấp một cách chính xác và đầy đủ. Luôn trả lời bằng tiếng Việt."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    temperature=temperature,
                    max_tokens=max_tokens,
                    stream=False
                )
                answer = response.choices[0].message.content
            else:  # grok
                response = client.chat.completions.create(
                    model="grok-2-latest",
                    messages=[
                        {
                            "role": "system",
                            "content": "Bạn là một trợ lý AI thông minh, nhiệm vụ của bạn là trả lời câu hỏi dựa trên các tài liệu được cung cấp một cách chính xác và đầy đủ. Luôn trả lời bằng tiếng Việt."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                answer = response.choices[0].message.content
            
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
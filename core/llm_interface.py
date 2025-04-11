from typing import Optional, Dict, List, Any
import logging
import json
import requests
import os
import base64
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

    def _encode_image(self, image_data: str) -> str:
        """
        Encode image data to base64 string.
        
        Args:
            image_data: Base64 string of the image
            
        Returns:
            Base64 encoded string with proper format
        """
        logger.info(f"Encoding image data. Length: {len(image_data)}")
        # If image_data is already a base64 string without prefix
        if not image_data.startswith('data:image'):
            encoded = f"data:image/jpeg;base64,{image_data}"
            logger.info("Added data:image/jpeg;base64 prefix to image data")
            return encoded
        logger.info("Image data already has proper format")
        return image_data

    def _create_image_prompt(self, query: str, image_data: str) -> List[Dict[str, Any]]:
        """
        Create a prompt for image analysis.
        
        Args:
            query: User's question about the image
            image_data: Base64 encoded image data
            
        Returns:
            List of message dictionaries for the API
        """
        logger.info("Creating image prompt")
        encoded_image = self._encode_image(image_data)
        logger.info(f"Image prompt created with query: {query}")
        
        return [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": encoded_image,
                            "detail": "high"
                        }
                    },
                    {
                        "type": "text",
                        "text": query
                    }
                ]
            }
        ]

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
        prompt = "You are a specialized AI assistant for Vinh University. Your primary role is to provide accurate and concise answers to questions related to education, particularly about Vinh University. You can answer questions about:"
        prompt += "\n- Academic schedules and timetables"
        prompt += "\n- Classroom locations and facilities"
        prompt += "\n- Faculty members and teaching staff"
        prompt += "\n- Course information and curriculum"
        prompt += "\n- Student services and support"
        prompt += "\n- University policies and procedures"
        prompt += "\n- General educational information and best practices"
        prompt += "\n- Analysis of educational materials, diagrams, charts, and other visual content"
        prompt += "\n- Explanation of mathematical formulas, scientific concepts, and technical diagrams"
        prompt += "\n- Interpretation of graphs, tables, and data visualizations"
        prompt += "\n\nYou can answer based on both provided context documents, your general knowledge about education, and any visual content provided. Your final answer *must* be in Vietnamese."

        # Context Section
        prompt += "\n\n<context>"
        prompt += "\nBased on the following documents (relevant to education and Vinh University):"
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
        prompt += "\n1. First, determine if the question is related to education, academic matters, university life, or educational content analysis."
        prompt += "\n2. If the question is completely unrelated to education or academic matters, respond with: 'Câu hỏi này không liên quan đến giáo dục hoặc vấn đề học tập. Vui lòng hỏi câu hỏi khác.'"
        prompt += "\n3. If the question is about education, academic matters, or educational content analysis:"
        prompt += "\n   a. If relevant documents are provided, prioritize using information from those documents."
        prompt += "\n   b. If no documents are provided or if the documents don't contain the answer, you may use your general knowledge about education to provide a reasonable answer."
        prompt += "\n   c. If the question involves visual content (images, diagrams, etc.):"
        prompt += "\n      - Analyze the visual elements and their educational significance"
        prompt += "\n      - Explain how the visual content relates to the course material"
        prompt += "\n      - Provide clear and detailed explanations of any technical or academic concepts shown"
        prompt += "\n      - Use appropriate educational terminology while keeping explanations accessible"
        prompt += "\n4. If using general knowledge, clearly state in Vietnamese that you're providing a general answer based on typical educational practices."
        prompt += "\n5. Keep answers concise and focused on the specific question."
        prompt += "\n6. Ensure the final output is *only* the answer in Vietnamese."
        prompt += "\n</instructions>"

        # Answer Placeholder
        prompt += "\n\nVietnamese Answer:"
        # The LLM response should start directly after this line.

        return prompt

    def generate_answer(
        self,
        query: str,
        documents: List[Dict[str, Any]],
        temperature: float = 0.1,
        max_tokens: int = 500,
        model: str = None,
        image_data: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate an answer using the LLM based on retrieved documents and/or image.
        
        Args:
            query: User's question
            documents: List of retrieved documents
            temperature: LLM temperature parameter
            max_tokens: Maximum tokens in response
            model: Model to use (overrides provider's default model)
            image_data: Optional base64 encoded image data
            
        Returns:
            Dictionary containing the answer and source information
        """
        try:
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
            
            # Handle image analysis if image_data is provided
            if image_data:
                logger.info("Image data detected, processing image analysis request")
                if current_provider != "grok-2-vision-latest":
                    logger.error("Image analysis requested but provider is not Grok")
                    raise ValueError("Image analysis is only supported with Grok provider")
                
                messages = self._create_image_prompt(query, image_data)
                logger.info(f"Sending image analysis request to Grok with model: grok-2-vision-latest")
                response = client.chat.completions.create(
                    model="grok-2-vision-latest",
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                answer = response.choices[0].message.content
                logger.info("Image analysis completed successfully")
                return {
                    "answer": answer,
                    "sources": []
                }
            
            # Handle text-based query
            logger.info("Processing text-based query")
            prompt = self._create_prompt(query, documents)
            logger.info(f"Created prompt with query: {query}")
            
            # Call appropriate API based on provider
            if current_provider == "openai":
                logger.info("Using OpenAI API")
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
                logger.info("Using Deepseek API")
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
                logger.info("Using Grok API")
                response = client.chat.completions.create(
                    model="grok-3-beta", #Stable version: grok-2-latest #Image Understanding: grok-2-vision-latest #New version: grok-3-beta
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
            
            logger.info("Text-based query processing completed successfully")
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
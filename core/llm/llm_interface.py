from typing import Optional, Dict, List, Any, cast
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
        
        # Initialize client based on provider
        if self.provider_name == "qwen":
            # Qwen3-Max via Alibaba Cloud DashScope
            self.client = OpenAI(
                api_key=provider["api_key"],
                base_url="https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
            )
            logger.info("Initialized Qwen3-Max client")
        elif self.provider_name == "openai":
            self.client = OpenAI(api_key=provider["api_key"])
            logger.info("Initialized OpenAI client")
        else:
            # Default to Qwen
            logger.warning(f"Unknown provider {self.provider_name}, defaulting to Qwen3-Max")
            self.client = OpenAI(
                api_key=provider["api_key"],
                base_url="https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
            )
            self.provider_name = "qwen"

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

    # def _create_prompt(self, query: str, documents: List[Dict[str, Any]], context: Optional[Dict[str, Any]] = None) -> str:
        """
        Create an advanced prompt in English for the LLM using the query and retrieved documents,
        specifying it's a chatbot for Vinh University, and instructing it to provide a 
        concise, accurate answer in Vietnamese based on both context and general knowledge.

        Args:
            query: User's question (will be included in the prompt)
            documents: List of retrieved documents with text and metadata
            context: Optional dictionary containing chat history and course info
        """
        # Maximum number of chat history messages to include in prompt
        MAX_HISTORY_IN_PROMPT = 3

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

        # Add course context if available
        if context:
            prompt += "\n\n<course_context>"
            if "course_title" in context:
                prompt += f"\nCourse Title: {context['course_title']}"
            if "course_code" in context:
                prompt += f"\nCourse Code: {context['course_code']}"
            if "course_description" in context:
                prompt += f"\nCourse Description: {context['course_description']}"
            prompt += "\n</course_context>"

        # Add chat history if available, limiting to most recent messages
        if context and "chat_history" in context:
            chat_history = context["chat_history"]
            if len(chat_history) > 0:
                prompt += "\n\n<chat_history>"
                prompt += "\nRecent conversation context:"
                # Take only the most recent messages up to MAX_HISTORY_IN_PROMPT
                recent_history = chat_history[-MAX_HISTORY_IN_PROMPT:]
                for msg in recent_history:
                    role = "User" if msg["role"] == "user" else "Assistant"
                    prompt += f"\n{role}: {msg['content']}"
                prompt += "\n</chat_history>"

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
        prompt += "\n3. If you're unsure or the information is missing or ambiguous in the documents and your general knowledge, say so clearly in Vietnamese (e.g., 'Hiện tại tôi không có đủ thông tin để trả lời chính xác câu hỏi này')."
        prompt += "\n4. If the question is about education, academic matters, or educational content analysis:"
        prompt += "\n   a. If relevant documents are provided, prioritize using information from those documents."
        prompt += "\n   b. If no documents are provided or if the documents don't contain the answer, you may use your general knowledge about education to provide a reasonable answer."
        prompt += "\n   c. Consider the chat history to maintain context and provide consistent answers."
        prompt += "\n   d. If the question involves visual content (images, diagrams, etc.):"
        prompt += "\n      - Analyze the visual elements and their educational significance"
        prompt += "\n      - Explain how the visual content relates to the course material"
        prompt += "\n      - Provide clear and detailed explanations of any technical or academic concepts shown"
        prompt += "\n      - Use appropriate educational terminology while keeping explanations accessible"
        prompt += "\n5. If using general knowledge, clearly state in Vietnamese that you're providing a general answer based on typical educational practices."
        prompt += "\n6. Keep answers concise and focused on the specific question."
        prompt += "\n7. Ensure the final output is *only* the answer in Vietnamese."
        prompt += "\n8. If the answer includes multiple steps, present them as a bullet list in Vietnamese. Use bold formatting for important terms."
        prompt += "\n9. If the user follows up with a request to explain further or clarify something, continue the answer based on the same context. Do not repeat the full previous answer unless necessary."
        # prompt += "\n10. The answer should typically be around 3-6 sentences. Only go longer if the topic requires it (e.g., explanation of formulas or diagrams)."
        prompt += "\n</instructions>"

        # Answer Placeholder
        prompt += "\n\nVietnamese Answer (Please respond in a polite, informative, and student-friendly tone. Do not include English in the answer. Format with bullet points if needed. Bold important terms.)"
        # The LLM response should start directly after this line.

        return prompt

    def _create_prompt(self, query: str, documents: List[Dict[str, Any]], context: Optional[Dict[str, Any]] = None) -> str:
        """
        Create an advanced prompt in English for the LLM using the query and retrieved documents,
        specifying it's a chatbot for Vinh University, and instructing it to provide a 
        concise, accurate answer in Vietnamese based on both context and general knowledge.

        Args:
            query: User's question (will be included in the prompt)
            documents: List of retrieved documents with text and metadata
            context: Optional dictionary containing chat history and course info
        """
        # Maximum number of chat history messages to include in prompt
        MAX_HISTORY_IN_PROMPT = 3  # Increased to 5 for complex queries

        # --- English Prompt Construction ---

        # System Role and Core Instruction
        prompt = "You are a specialized AI assistant for Vinh University. Your primary role is to provide accurate and concise answers to questions related to education, university life, and academic support at Vinh University. You can answer questions about:"
        prompt += "\n- Academic information (schedules, courses, faculty)"
        prompt += "\n- Student services and university facilities"
        prompt += "\n- University policies and campus life (e.g., events, clubs)"
        prompt += "\n- Educational content analysis (formulas, diagrams, data visualizations)"
        prompt += "\n\nYou have access to Vinh University’s academic calendar, faculty directory, and student handbook as primary sources. Answer based on provided documents, these resources, or general educational knowledge. Your final answer *must* be in Vietnamese, using simple language for general queries and precise terminology for advanced topics."

        # Add course context if available (unchanged)
        if context:
            prompt += "\n\n<course_context>"
            if "course_title" in context:
                prompt += f"\nCourse Title: {context['course_title']}"
            if "course_code" in context:
                prompt += f"\nCourse Code: {context['course_code']}"
            if "course_description" in context:
                prompt += f"\nCourse Description: {context['course_description']}"
            prompt += "\n</course_context>"

        # Add chat history if available, with dynamic limit
        if context and "chat_history" in context:
            chat_history = context["chat_history"]
            if len(chat_history) > 0:
                prompt += "\n\n<chat_history>"
                prompt += "\nRecent conversation context:"
                # Increase history for complex queries (e.g., containing 'explain', 'calculate')
                max_history = 5 if any(keyword in query.lower() for keyword in ["explain", "calculate", "analyze"]) else MAX_HISTORY_IN_PROMPT
                recent_history = chat_history[-max_history:]
                for msg in recent_history:
                    role = "User" if msg["role"] == "user" else "Assistant"
                    prompt += f"\n{role}: {msg['content']}"
                prompt += "\n</chat_history>"

        # Context Section (unchanged)
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
                prompt += f"\n\n{doc['text']}\n\n"
        prompt += "\n</context>"

        # Query Section (unchanged)
        prompt += "\n\n<query>"
        prompt += f"\nUser Question: {query}"
        prompt += "\n</query>"

        # Final Instruction and Output Formatting
        prompt += "\n\n<instructions>"
        prompt += "\n1. Determine if the question relates to education, academic matters, university life, or educational content analysis."
        prompt += "\n2. If the question is unrelated to these areas, respond with: ‘Câu hỏi này không thuộc phạm vi hỗ trợ của tôi. Vui lòng hỏi về học tập, dịch vụ sinh viên, hoặc hoạt động tại Đại học Vinh.’"
        prompt += "\n3. If information is missing or ambiguous, respond clearly in Vietnamese (e.g., ‘Hiện tại tôi không có đủ thông tin để trả lời chính xác câu hỏi này’)."
        prompt += "\n4. For relevant questions:"
        prompt += "\n   a. Prioritize information from provided documents or Vinh University’s official resources; if insufficient, use general educational knowledge, stating so in Vietnamese."
        prompt += "\n   b. Consider chat history for context and consistency."
        prompt += "\n   c. For visual content (e.g., diagrams, charts):"
        prompt += "\n      - Analyze educational significance and relation to course material."
        prompt += "\n      - Provide clear explanations of technical concepts."
        prompt += "\n      - If visuals are ambiguous, respond: ‘Hình ảnh không rõ ràng hoặc thiếu thông tin. Vui lòng cung cấp thêm chi tiết hoặc hình ảnh khác.’"
        prompt += "\n5. Aim for 3-6 sentences per answer, extending only for complex topics (e.g., formula explanations, data analysis)."
        prompt += "\n6. Ensure answers are polite, student-friendly, and accessible, tailoring language complexity to the user’s inferred expertise."
        prompt += "\n7. Format answers in Vietnamese with bullet points for multi-step responses and bold important terms."
        prompt += "\n</instructions>"

        # Answer Placeholder
        prompt += "\n\nVietnamese Answer (Respond directly in Vietnamese with a polite, informative, and student-friendly tone. Do not include English.)"
        
        return prompt

    def generate_answer(
        self,
        query: str,
        documents: List[Dict[str, Any]],
        temperature: float = 0.1,
        max_tokens: int = 500,
        model: str = "qwen3-max",
        image_data: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate an answer using Qwen3-Max LLM based on retrieved documents.
        
        Args:
            query: User's question
            documents: List of retrieved documents
            temperature: LLM temperature parameter
            max_tokens: Maximum tokens in response
            model: Model to use (default: qwen3-max)
            image_data: Optional base64 encoded image data (not supported yet)
            context: Optional dictionary containing chat history and course info
            
        Returns:
            Dictionary containing the answer and source information
        """
        try:
            logger.info(f"Using Qwen3-Max model: {model}")
            
            # Handle text-based query
            logger.info("Processing text-based query")
            prompt = self._create_prompt(query, documents, context)
            logger.info(f"Created prompt with query: {query}")
            
            # Prepare messages for Qwen3-Max
            messages = [
                {
                    "role": "system",
                    "content": "Bạn là một trợ lý AI thông minh, nhiệm vụ của bạn là trả lời câu hỏi dựa trên các tài liệu được cung cấp một cách chính xác và đầy đủ. Luôn trả lời bằng tiếng Việt."
                }
            ]
            
            # Add chat history if available
            if context and "chat_history" in context:
                for msg in context["chat_history"]:
                    messages.append({
                        "role": msg["role"],
                        "content": msg["content"]
                    })
            
            # Add current query
            messages.append({
                "role": "user",
                "content": prompt
            })
            
            # Call Qwen3-Max API via OpenAI SDK with timeout
            logger.info(f"Calling Qwen3-Max API with model: {model}")
            response = self.client.chat.completions.create(
                model=model,
                messages=cast(Any, messages),  # Type cast for OpenAI SDK compatibility
                temperature=temperature,
                max_tokens=max_tokens,
                timeout=30  # 30 second timeout
            )
            answer = response.choices[0].message.content
            logger.info("LLM response received successfully")
            
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
            
            logger.info("Query processing completed successfully")
            return {
                "answer": answer,
                "sources": sources
            }
            
        except Exception as e:
            logger.error(f"Error generating answer with Qwen3-Max: {str(e)}")
            return {
                "answer": "Xin lỗi, tôi không thể tạo câu trả lời lúc này. Vui lòng thử lại sau.",
                "sources": []
            } 
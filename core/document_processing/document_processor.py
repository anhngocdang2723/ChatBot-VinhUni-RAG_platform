import os
import logging
import hashlib
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional, Union
import fitz
import pdfplumber
import re
from langchain_text_splitters import RecursiveCharacterTextSplitter
from docx import Document
from openpyxl import load_workbook
import pandas as pd
from bs4 import BeautifulSoup
import tabula
import json
from enum import Enum
import numpy as np
from fastapi import UploadFile
from core.document_processing.vector_store import VectorStore
from core.llm.config import settings
from core.document_processing.text_splitter import TextSplitter
from core.document_processing.file_processor import FileProcessor
from core.database.database import get_db
import time
import shutil
from sqlalchemy.orm import Session
from core.database.models import Document as DBDocument, DocumentType, Department

# Configure logging
logger = logging.getLogger(__name__)

class ChunkingStrategy(Enum):
    """Defines different strategies for chunking tabular data."""
    NO_CHUNK = "no_chunk"  # Keep all records together
    FIXED_SIZE = "fixed_size"  # Split into fixed-size chunks
    SMART_CHUNK = "smart_chunk"  # Use smart chunking based on data characteristics

class TabularDataProcessor:
    """Handles processing and structuring of tabular data from various sources."""
    
    def __init__(
        self,
        chunk_size: int = 100,
        chunking_strategy: ChunkingStrategy = ChunkingStrategy.SMART_CHUNK,
        min_chunk_size: int = 50,
        max_chunk_size: int = 500
    ):
        """
        Initialize TabularDataProcessor.
        
        Args:
            chunk_size: Target number of records per chunk for table data
            chunking_strategy: Strategy to use for chunking table data
            min_chunk_size: Minimum records per chunk for SMART_CHUNK strategy
            max_chunk_size: Maximum records per chunk for SMART_CHUNK strategy
        """
        self.chunk_size = chunk_size
        self.chunking_strategy = chunking_strategy
        self.min_chunk_size = min_chunk_size
        self.max_chunk_size = max_chunk_size
    
    def _record_to_flat_text(self, record: Dict[str, Any]) -> str:
        """
        Convert a record dictionary to flat text format including field names.
        
        Args:
            record: Dictionary containing the record data
            
        Returns:
            A flat text representation of the record with field names
        """
        try:
            # Convert special types to string with field names
            text_parts = []
            for key, value in record.items():
                if pd.isna(value):
                    text_parts.append(f"{key}: ")
                elif isinstance(value, pd.Timestamp):
                    text_parts.append(f"{key}: {value.strftime('%Y-%m-%d %H:%M:%S')}")
                elif isinstance(value, (pd.Series, pd.DataFrame)):
                    text_parts.append(f"{key}: {str(value.to_dict())}")
                elif isinstance(value, np.integer):
                    text_parts.append(f"{key}: {str(int(value))}")
                elif isinstance(value, np.floating):
                    text_parts.append(f"{key}: {str(float(value))}")
                else:
                    text_parts.append(f"{key}: {str(value)}")
            
            # Join all field-value pairs with commas
            return ", ".join(text_parts)
            
        except Exception as e:
            logger.error(f"Error converting record to flat text: {str(e)}")
            return str(record)

    def process_excel(self, file_path: str) -> List[Dict[str, Any]]:
        """Process Excel files and extract structured table data."""
        try:
            tables = []
            excel_data = pd.read_excel(file_path, sheet_name=None, engine='openpyxl')
            
            for sheet_name, df in excel_data.items():
                if not df.empty:
                    # Clean column names
                    df.columns = [str(col).strip() if str(col).strip() else f"Column_{i+1}" 
                                for i, col in enumerate(df.columns)]
                    
                    # Convert each record to flat text
                    records = df.replace({pd.NA: None}).to_dict('records')
                    for record in records:
                        # Convert record to flat text
                        description = self._record_to_flat_text(record)
                        
                        table_data = {
                            "description": description,
                            "original_record": record
                        }
                        tables.append(table_data)
            
            return tables
            
        except Exception as e:
            logger.error(f"Error processing Excel file: {str(e)}")
            return []

    def process_csv(self, file_path: str) -> List[Dict[str, Any]]:
        """Process CSV files and convert records to flat text."""
        try:
            tables = []
            # Read CSV in chunks to handle large files
            for chunk in pd.read_csv(file_path, chunksize=self.chunk_size):
                if not chunk.empty:
                    # Clean column names
                    chunk.columns = [str(col).strip() if str(col).strip() else f"Column_{i+1}" 
                                   for i, col in enumerate(chunk.columns)]
                    
                    # Process each record
                    records = chunk.replace({pd.NA: None}).to_dict('records')
                    for record in records:
                        # Convert record to flat text
                        description = self._record_to_flat_text(record)
                        
                        table_data = {
                            "description": description,
                            "original_record": record
                        }
                        tables.append(table_data)
            
            return tables
            
        except Exception as e:
            logger.error(f"Error processing CSV file: {str(e)}")
            return []

    def process_pdf_tables(self, file_path: str) -> List[Dict[str, Any]]:
        """Extract tables from PDF files."""
        try:
            tables = []
            # Try lattice mode first
            pdf_tables = tabula.read_pdf(file_path, pages='all', multiple_tables=True, 
                                       lattice=True, stream=False, silent=True)
            
            # If no tables found, try stream mode
            if not pdf_tables:
                pdf_tables = tabula.read_pdf(file_path, pages='all', multiple_tables=True,
                                           lattice=False, stream=True, silent=True)
            
            for page_num, df in enumerate(pdf_tables):
                if isinstance(df, pd.DataFrame) and not df.empty:
                    # Clean column names
                    df.columns = [str(col).strip() if str(col).strip() else f"Column_{i+1}" 
                                for i, col in enumerate(df.columns)]
                    
                    # Convert DataFrame to records and chunk them
                    chunks = self._chunk_dataframe(df)
                    
                    for chunk_idx, chunk_records in enumerate(chunks):
                        # Create a description from the chunk records
                        description = ""
                        for record in chunk_records:
                            description += self._record_to_flat_text(record) + "\n"
                        
                        table_data = {
                            "type": "pdf_table",
                            "page_number": page_num + 1,
                            "chunk_index": chunk_idx,
                            "total_chunks": len(chunks),
                            "headers": list(df.columns),
                            "records": chunk_records,
                            "row_count": len(chunk_records),
                            "column_count": len(df.columns),
                            "description": description.strip()  # Always include description
                        }
                        tables.append(table_data)
            
            # If no tables were found, create a single entry with the PDF text
            if not tables:
                try:
                    doc = fitz.open(file_path)
                    text = ""
                    for page_num in range(len(doc)):
                        page = doc.load_page(page_num)
                        text += page.get_text() + "\n\n"
                    doc.close()
                    
                    # Create a single table entry with the text content
                    table_data = {
                        "type": "pdf_text",
                        "page_number": 1,
                        "chunk_index": 0,
                        "total_chunks": 1,
                        "headers": [],
                        "records": [],
                        "row_count": 0,
                        "column_count": 0,
                        "description": text.strip()
                    }
                    tables.append(table_data)
                except Exception as e:
                    logger.warning(f"Failed to extract text from PDF: {str(e)}")
            
            return tables
            
        except Exception as e:
            logger.error(f"Error extracting tables from PDF: {str(e)}")
            # Return empty list instead of None
            return []
    
    def process_docx_tables(self, file_path: str) -> List[Dict[str, Any]]:
        """Extract tables from Word documents."""
        try:
            tables = []
            doc = Document(file_path)
            
            for table_num, table in enumerate(doc.tables):
                data = []
                headers = []
                
                # Process headers
                if table.rows:
                    header_row = table.rows[0]
                    headers = [cell.text.strip() if cell.text.strip() else f"Column_{i+1}"
                             for i, cell in enumerate(header_row.cells)]
                
                # Process data rows
                for row in table.rows[1:]:
                    row_data = [cell.text.strip() for cell in row.cells]
                    if any(row_data) and len(row_data) == len(headers):
                        data.append(row_data)
                
                if headers and data:
                    # Convert to DataFrame for consistent processing
                    df = pd.DataFrame(data, columns=headers)
                    chunks = self._chunk_dataframe(df)
                    
                    for chunk_idx, chunk_records in enumerate(chunks):
                        table_data = {
                            "type": "docx_table",
                            "table_number": table_num + 1,
                            "chunk_index": chunk_idx,
                            "total_chunks": len(chunks),
                            "headers": headers,
                            "records": chunk_records,
                            "row_count": len(chunk_records),
                            "column_count": len(headers)
                        }
                        tables.append(table_data)
            
            return tables
            
        except Exception as e:
            logger.error(f"Error extracting tables from Word document: {str(e)}")
            return []

    def _chunk_dataframe(self, df: pd.DataFrame) -> List[List[Dict[str, Any]]]:
        """
        Chunk a DataFrame into smaller chunks based on the chunking strategy.
        
        Args:
            df: DataFrame to chunk
            
        Returns:
            List of lists of dictionaries, where each inner list represents a chunk
        """
        try:
            if self.chunking_strategy == ChunkingStrategy.NO_CHUNK:
                # Return all records as one chunk
                return [df.to_dict('records')]
            
            elif self.chunking_strategy == ChunkingStrategy.FIXED_SIZE:
                # Split into fixed-size chunks
                chunks = []
                for i in range(0, len(df), self.chunk_size):
                    chunk_df = df.iloc[i:i + self.chunk_size]
                    chunks.append(chunk_df.to_dict('records'))
                return chunks
            
            else:  # SMART_CHUNK
                # Use smart chunking based on data characteristics
                chunks = []
                current_chunk = []
                current_size = 0
                
                for _, row in df.iterrows():
                    record = row.to_dict()
                    record_size = len(str(record))
                    
                    if current_size + record_size > self.max_chunk_size and current_chunk:
                        chunks.append(current_chunk)
                        current_chunk = []
                        current_size = 0
                    
                    current_chunk.append(record)
                    current_size += record_size
                
                if current_chunk:
                    chunks.append(current_chunk)
                
                return chunks
                
        except Exception as e:
            logger.error(f"Error chunking DataFrame: {str(e)}")
            # Fallback to fixed-size chunking
            chunks = []
            for i in range(0, len(df), self.chunk_size):
                chunk_df = df.iloc[i:i + self.chunk_size]
                chunks.append(chunk_df.to_dict('records'))
            return chunks

class DocumentProcessor:
    """
    Handles document processing for various file types, including:
    - Text extraction
    - Document chunking with configurable overlap
    - Metadata extraction and management
    - Tabular data processing
    """
    
    SUPPORTED_EXTENSIONS = {
        'pdf': ['pdf'],
        'document': ['doc', 'docx', 'txt', 'rtf'],
        'presentation': ['ppt', 'pptx'],
        'spreadsheet': ['xls', 'xlsx', 'csv'],
        'web': ['html', 'htm'],
    }

    # Maximum file size (50MB)
    MAX_FILE_SIZE = 50 * 1024 * 1024
    
    def __init__(
        self,
        db: Session,
        chunk_size: int = settings.DEFAULT_CHUNK_SIZE,
        chunk_overlap: int = settings.DEFAULT_CHUNK_OVERLAP,
        min_chunk_size: int = settings.MIN_CHUNK_SIZE,
        verbose: bool = False
    ):
        """
        Initialize DocumentProcessor.
        
        Args:
            db: Database session
            chunk_size: Size of text chunks for processing
            chunk_overlap: Overlap between chunks
            min_chunk_size: Minimum records per chunk for SMART_CHUNK strategy
            verbose: Whether to enable verbose logging
        """
        self.db = db
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.min_chunk_size = min_chunk_size
        self.verbose = verbose
        self.text_splitter = TextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        self.file_processor = FileProcessor()
        # Get db session
        self.db = next(get_db())
        self.vector_store = VectorStore(
            qdrant_url=settings.QDRANT_URL,
            qdrant_api_key=settings.QDRANT_API_KEY,
            db=self.db,
            verbose=self.verbose,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )
        self.tabular_processor = TabularDataProcessor()
        
        # Create upload directory if it doesn't exist
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    def process_file(
        self, 
        file_path: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Tuple[List[Union[str, Dict[str, Any]]], List[Dict[str, Any]]]:
        """
        Process a file and return its chunks and associated metadata.
        
        Args:
            file_path: Path to the file to process
            metadata: Additional metadata to include with each chunk
            
        Returns:
            Tuple containing:
                - List of text chunks (for text files) or descriptions (for tabular data)
                - List of metadata dictionaries for each chunk
                
        Raises:
            ValueError: If file is invalid or too large
            FileNotFoundError: If file doesn't exist
            Exception: For other processing errors
        """
        try:
            # Validate file exists
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"File not found: {file_path}")
                
            # Validate file size
            file_size = os.path.getsize(file_path)
            if file_size > self.MAX_FILE_SIZE:
                raise ValueError(f"File too large: {file_size} bytes. Maximum size: {self.MAX_FILE_SIZE} bytes")
                
            # Extract file extension
            file_ext = os.path.splitext(file_path)[1].lower().replace('.', '')
            
            # Validate file type
            if not self._is_supported_file_type(file_ext):
                raise ValueError(f"Unsupported file type: {file_ext}")
            
            # Generate file hash for identification
            file_hash = self._generate_file_hash(file_path)
            
            # Extract basic metadata
            base_metadata = self._extract_metadata(file_path, file_ext)
            base_metadata["file_hash"] = file_hash
            
            # Merge with provided metadata
            if metadata:
                base_metadata.update(metadata)
            
            content = []
            metadata_list = []
            
            try:
                # Process based on file type
                if file_ext in self.SUPPORTED_EXTENSIONS['spreadsheet']:
                    # For spreadsheet files, process as tabular data
                    if file_ext in ['xlsx', 'xls']:
                        tables = self.tabular_processor.process_excel(file_path)
                    elif file_ext == 'csv':
                        tables = self.tabular_processor.process_csv(file_path)
                    
                    # Each table record becomes a separate content piece
                    for table in tables:
                        # Ensure description exists and is properly formatted
                        if "description" not in table:
                            table["description"] = str(table.get("records", []))
                        
                        # Only store the description as content
                        content.append(table["description"])
                        
                        # Enhanced metadata for table records
                        record_metadata = base_metadata.copy()
                        record_metadata.update({
                            "content_type": "table_record",
                            "table_info": {
                                "row_count": len(table.get("records", [])),
                                "headers": table.get("headers", []),
                                "table_index": len(content) - 1
                            }
                        })
                        metadata_list.append(record_metadata)
                
                else:
                    # For non-spreadsheet files, process text and embedded tables
                    
                    # Extract text content
                    text = self._extract_text(file_path, file_ext)
                    if not text.strip():
                        logger.warning(f"No text content extracted from file: {file_path}")
                    
                    # Process any tables in the document
                    tables = self._extract_tables(file_path, file_ext)
                    
                    # Add table records first
                    for table in tables:
                        # Ensure description exists and is properly formatted
                        if "description" not in table:
                            table["description"] = str(table.get("records", []))
                        
                        # Only store the description as content
                        content.append(table["description"])
                        
                        # Enhanced metadata for table records
                        record_metadata = base_metadata.copy()
                        record_metadata.update({
                            "content_type": "table_record",
                            "table_info": {
                                "row_count": len(table.get("records", [])),
                                "headers": table.get("headers", []),
                                "table_index": len(content) - 1
                            }
                        })
                        metadata_list.append(record_metadata)
                    
                    # Then add text chunks
                    if text:
                        chunks = self.text_splitter.split_text(text)
                        for i, chunk in enumerate(chunks):
                            content.append(chunk)
                            chunk_metadata = base_metadata.copy()
                            chunk_metadata.update({
                                "content_type": "text",
                                "chunk_info": {
                                    "chunk_id": i,
                                    "total_chunks": len(chunks),
                                    "chunk_size": len(chunk),
                                    "chunk_overlap": self.chunk_overlap
                                }
                            })
                            metadata_list.append(chunk_metadata)
                
                if not content:
                    logger.warning(f"No content extracted from file: {file_path}")
                    return [], []
                
                logger.info(f"Processed {file_path} into {len(content)} content pieces")
                return content, metadata_list
                
            except Exception as e:
                logger.error(f"Error processing file content: {str(e)}")
                raise
                
        except Exception as e:
            logger.error(f"Error processing file {file_path}: {str(e)}")
            raise
        finally:
            # Cleanup any temporary files if needed
            self._cleanup_temp_files(file_path)
    
    def _cleanup_temp_files(self, file_path: str):
        """Clean up any temporary files created during processing."""
        try:
            temp_dir = os.path.join(os.path.dirname(file_path), "temp")
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
        except Exception as e:
            logger.warning(f"Error cleaning up temporary files: {str(e)}")
    
    def _extract_tables(self, file_path: str, file_ext: str) -> List[Dict[str, Any]]:
        """Extract tables from various file types."""
        try:
            if file_ext in ['xlsx', 'xls']:
                return self.tabular_processor.process_excel(file_path)
            elif file_ext == 'pdf':
                return self.tabular_processor.process_pdf_tables(file_path)
            elif file_ext in ['html', 'htm']:
                return self.tabular_processor.process_html_tables(file_path)
            elif file_ext in ['doc', 'docx']:
                return self.tabular_processor.process_docx_tables(file_path)
            else:
                return []
        except Exception as e:
            logger.error(f"Error extracting tables: {str(e)}")
            return []
    
    def _extract_text(self, file_path: str, file_ext: str) -> str:
        """Extract text from a file based on its extension."""
        try:
            if file_ext in self.SUPPORTED_EXTENSIONS['pdf']:
                return self._extract_pdf_text(file_path)
            elif file_ext in self.SUPPORTED_EXTENSIONS['document']:
                return self._extract_document_text(file_path, file_ext)
            elif file_ext in self.SUPPORTED_EXTENSIONS['spreadsheet']:
                return self._extract_spreadsheet_text(file_path, file_ext)
            elif file_ext in self.SUPPORTED_EXTENSIONS['web']:
                return self._extract_html_text(file_path)
            else:
                # For unsupported types, return empty string
                return ""
        except Exception as e:
            logger.error(f"Error extracting text from {file_path}: {str(e)}")
            return ""
    
    def _extract_pdf_text(self, file_path: str) -> str:
        """Extract text from PDF files using multiple libraries for better results."""
        try:
            # Try PyMuPDF first (better for most PDFs)
            text = ""
            try:
                doc = fitz.open(file_path)
                for page_num in range(len(doc)):
                    page = doc.load_page(page_num)
                    text += page.get_text() + "\n\n"
                doc.close()
            except Exception as e:
                logger.warning(f"PyMuPDF extraction failed: {str(e)}. Trying pdfplumber.")
                
            # If PyMuPDF fails or text is too short, try pdfplumber
            if len(text) < 100:
                text = ""
                with pdfplumber.open(file_path) as pdf:
                    for page in pdf.pages:
                        page_text = page.extract_text() or ""
                        text += page_text + "\n\n"
            
            # Clean up the text
            text = self._clean_text(text)
            return text
        
        except Exception as e:
            logger.error(f"Error extracting PDF text from {file_path}: {str(e)}")
            return ""
    
    def _extract_document_text(self, file_path: str, file_ext: str) -> str:
        """Extract text from document files (txt, doc, docx, rtf)."""
        try:
            if file_ext == 'txt':
                try:
                    with open(file_path, 'r', encoding='utf-8') as file:
                        text = file.read()
                    return self._clean_text(text)
                except UnicodeDecodeError:
                    # Try with different encoding if utf-8 fails
                    with open(file_path, 'r', encoding='latin-1') as file:
                        text = file.read()
                    return self._clean_text(text)
            elif file_ext in ['doc', 'docx']:
                doc = Document(file_path)
                text = "\n\n".join([paragraph.text for paragraph in doc.paragraphs])
                return self._clean_text(text)
            else:
                logger.warning(f"Document type {file_ext} not fully supported yet")
                return ""
        except Exception as e:
            logger.error(f"Error extracting document text: {str(e)}")
            return ""
    
    def _extract_spreadsheet_text(self, file_path: str, file_ext: str) -> str:
        """Extract text from spreadsheet files (xlsx, xls, csv)."""
        try:
            if file_ext in ['xlsx', 'xls']:
                workbook = load_workbook(filename=file_path, read_only=True)
                text_parts = []
                
                for sheet in workbook.sheetnames:
                    worksheet = workbook[sheet]
                    sheet_text = []
                    sheet_text.append(f"Sheet: {sheet}")
                    
                    for row in worksheet.iter_rows(values_only=True):
                        # Filter out None values and convert all to strings
                        row_text = [str(cell) for cell in row if cell is not None]
                        if row_text:  # Only add non-empty rows
                            sheet_text.append("\t".join(row_text))
                    
                    text_parts.append("\n".join(sheet_text))
                
                workbook.close()
                return self._clean_text("\n\n".join(text_parts))
            elif file_ext == 'csv':
                with open(file_path, 'r', encoding='utf-8') as file:
                    return self._clean_text(file.read())
            else:
                logger.warning(f"Spreadsheet type {file_ext} not fully supported yet")
                return ""
        except Exception as e:
            logger.error(f"Error extracting spreadsheet text: {str(e)}")
            return ""
    
    def _extract_html_text(self, file_path: str) -> str:
        """Extract text from HTML files."""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                html_content = file.read()
            
            # Simple HTML tag removal - can be improved with BeautifulSoup
            text = re.sub(r'<[^>]+>', ' ', html_content)
            text = re.sub(r'\s+', ' ', text)
            return self._clean_text(text)
        except Exception as e:
            logger.error(f"Error extracting HTML text: {str(e)}")
            return ""
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize extracted text."""
        if not text:
            return ""
        
        # Replace multiple newlines with double newline
        text = re.sub(r'\n{3,}', '\n\n', text)
        
        # Replace multiple spaces with single space
        text = re.sub(r' {2,}', ' ', text)
        
        # Remove non-printable characters
        text = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', text)
        
        return text.strip()
    
    def _is_supported_file_type(self, file_ext: str) -> bool:
        """Check if the file extension is supported."""
        for category, extensions in self.SUPPORTED_EXTENSIONS.items():
            if file_ext in extensions:
                return True
        return False
    
    def _generate_file_hash(self, file_path: str) -> str:
        """Generate a hash for the file to use as a unique identifier."""
        try:
            hasher = hashlib.md5()
            with open(file_path, 'rb') as file:
                # Read file in chunks to handle large files
                for chunk in iter(lambda: file.read(4096), b""):
                    hasher.update(chunk)
            return hasher.hexdigest()
        except Exception as e:
            logger.error(f"Error generating file hash: {str(e)}")
            # Return a timestamp-based fallback hash
            return f"hash_{int(datetime.now().timestamp())}"
    
    def _extract_metadata(self, file_path: str, file_ext: str) -> Dict[str, Any]:
        """Extract metadata from the file."""
        try:
            file_name = os.path.basename(file_path)
            file_size = os.path.getsize(file_path)
            creation_time = os.path.getctime(file_path)
            modification_time = os.path.getmtime(file_path)
            
            metadata = {
                "file_name": file_name,
                "file_type": file_ext,
                "file_size": file_size,
                "creation_date": datetime.fromtimestamp(creation_time).isoformat(),
                "modification_date": datetime.fromtimestamp(modification_time).isoformat(),
                "source_path": file_path,
            }
            
            # Add category based on file extension
            for category, extensions in self.SUPPORTED_EXTENSIONS.items():
                if file_ext in extensions:
                    metadata["document_type"] = category
                    break
            
            return metadata
        except Exception as e:
            logger.error(f"Error extracting metadata: {str(e)}")
            return {
                "file_name": os.path.basename(file_path),
                "file_type": file_ext,
                "error": str(e)
            }

    async def process_upload(
        self,
        file: UploadFile,
        metadata: Dict[str, Any]
    ) -> bool:
        """
        Process an uploaded file with proper transaction handling.
        
        Args:
            file: The uploaded file
            metadata: Document metadata including display_name, document_type, etc.
            
        Returns:
            bool: True if successful, False otherwise
        """
        temp_file_path = None
        try:
            # Step 1: Save uploaded file to temp location
            file_ext = os.path.splitext(file.filename)[1].lower().replace('.', '')
            temp_file_path = os.path.join(settings.UPLOAD_DIR, f"temp_{int(time.time())}_{file.filename}")
            
            with open(temp_file_path, "wb") as buffer:
                buffer.write(await file.read())
            
            # Step 2: Begin database transaction
            self.db.begin()
            
            # Step 3: Create Document record first
            timestamp = int(time.time() * 1000)
            document_id = f"doc_{timestamp}"
            
            new_document = DBDocument(
                document_id=document_id,
                display_name=metadata.get("display_name", file.filename),
                file_name=file.filename,
                file_type=file_ext,
                document_type=metadata.get("document_type", "NOTICE"),
                department=metadata.get("department", "GENERAL"),
                description=metadata.get("description", ""),
                reference_number=metadata.get("reference_number", ""),
                impact_date=metadata.get("impact_date"),
                effective_date=metadata.get("effective_date"),
                expiry_date=metadata.get("expiry_date"),
                created_by=metadata.get("upload_by", 1)
            )
            
            # Add to session but don't commit yet
            self.db.add(new_document)
            
            # Step 4: Process file content
            content, chunk_metadata = self.process_file(temp_file_path, metadata)
            
            if not content:
                raise Exception("No content extracted from file")
            
            # Update document with chunk count
            new_document.total_chunks = len(content)
            
            # Step 5: Store in vector database
            success = self.vector_store.store_documents(
                collection_name=settings.STORAGE_NAME,
                texts=content,
                metadata_list=[{
                    "document_id": document_id,
                    "display_name": new_document.display_name,
                    "document_type": new_document.document_type,
                    "department": new_document.department,
                    "description": new_document.description,
                    "reference_number": new_document.reference_number,
                    "impact_date": new_document.impact_date.isoformat() if new_document.impact_date else None,
                    "effective_date": new_document.effective_date.isoformat() if new_document.effective_date else None,
                    "expiry_date": new_document.expiry_date.isoformat() if new_document.expiry_date else None,
                    "original_filename": new_document.file_name
                }]
            )
            
            if not success:
                raise Exception("Failed to store document in vector database")
            
            # Step 6: If everything is successful, commit the transaction
            self.db.commit()
            
            logger.info(f"Successfully processed and stored document: {document_id}")
            return True
            
        except Exception as e:
            # Rollback database transaction
            self.db.rollback()
            
            logger.error(f"Error processing upload: {str(e)}")
            return False
            
        finally:
            # Clean up temp file
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                except Exception as e:
                    logger.warning(f"Failed to remove temp file: {str(e)}") 
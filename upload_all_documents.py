"""
Upload all PDF and DOCX files from data/file directory to Pinecone
Automatically processes and indexes documents for RAG
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import time

# Load environment variables
load_dotenv()

print("=" * 80)
print("BATCH DOCUMENT UPLOAD TO PINECONE")
print("=" * 80)

# Configuration
FILE_DIR = "data/file"
NAMESPACE = "vinhuni_documents"
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200

# Supported file types
SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.doc']

# Step 1: Find all documents
print(f"\n[1/6] Scanning directory: {FILE_DIR}")
if not os.path.exists(FILE_DIR):
    print(f"❌ Directory not found: {FILE_DIR}")
    sys.exit(1)

files_to_process = []
for file_path in Path(FILE_DIR).iterdir():
    if file_path.is_file() and file_path.suffix.lower() in SUPPORTED_EXTENSIONS:
        files_to_process.append(file_path)

if not files_to_process:
    print(f"❌ No PDF or DOCX files found in {FILE_DIR}")
    sys.exit(1)

print(f"✅ Found {len(files_to_process)} documents to process:")
for i, file_path in enumerate(files_to_process, 1):
    size_mb = file_path.stat().st_size / (1024 * 1024)
    print(f"   {i}. {file_path.name} ({size_mb:.2f} MB)")

# Step 2: Check environment variables
print("\n[2/6] Checking environment variables...")
required_vars = ["PINECONE_API_KEY", "DASHSCOPE_API_KEY"]
for var in required_vars:
    value = os.getenv(var)
    if value:
        masked = f"{value[:8]}...{value[-4:]}" if len(value) > 12 else "***"
        print(f"  ✅ {var}: {masked}")
    else:
        print(f"  ❌ {var}: NOT SET")
        sys.exit(1)

# Step 3: Import services
print("\n[3/6] Importing services...")
try:
    from core.pinecone.pinecone_service import PineconeService
    import fitz  # PyMuPDF for PDF
    import docx  # python-docx for DOCX
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    
    print("✅ Successfully imported all required modules")
except ImportError as e:
    print(f"❌ Failed to import: {str(e)}")
    print("\nMissing dependencies? Install with:")
    print("  pip install PyMuPDF python-docx langchain-text-splitters")
    sys.exit(1)

# Step 4: Initialize services
print("\n[4/6] Initializing Pinecone service...")
try:
    pinecone_api_key = os.getenv("PINECONE_API_KEY")
    
    # Pinecone service
    pinecone_service = PineconeService(
        api_key=pinecone_api_key,
        environment="us-east-1"
    )
    pinecone_service.setup_indexes()
    print("✅ Pinecone service initialized")
    
    # Text splitter
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    print(f"✅ Text splitter initialized (size={CHUNK_SIZE}, overlap={CHUNK_OVERLAP})")
    
except Exception as e:
    print(f"❌ Failed to initialize services: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Step 5: Ask about existing data
print("\n[5/6] Data Management")
print(f"   Target namespace: {NAMESPACE}")
print("\n   ⚠️  Do you want to delete existing vectors in this namespace first?")
print("   This will remove all previous uploads.")
user_input = input("   Delete existing data? (y/N): ").strip().lower()

if user_input == 'y':
    print("\n   🗑️  Deleting existing vectors...")
    try:
        # Delete from dense index
        if pinecone_service.dense_index:
            pinecone_service.dense_index.delete(
                namespace=NAMESPACE,
                delete_all=True
            )
            print(f"   ✅ Deleted vectors from dense index")
        
        # Delete from sparse index
        if pinecone_service.sparse_index:
            pinecone_service.sparse_index.delete(
                namespace=NAMESPACE,
                delete_all=True
            )
            print(f"   ✅ Deleted vectors from sparse index")
        
        print("   Waiting 2 seconds for deletion to complete...")
        time.sleep(2)
    except Exception as delete_error:
        if "not found" in str(delete_error).lower():
            print(f"   ℹ️  Namespace doesn't exist yet (will be created)")
        else:
            print(f"   ⚠️  Deletion warning: {delete_error}")

# Step 6: Process and upload each file
print("\n[6/6] Processing and uploading documents...")
print("=" * 80)

all_documents = []
total_chunks = 0
successful_files = 0
failed_files = []

for idx, file_path in enumerate(files_to_process, 1):
    print(f"\n📄 [{idx}/{len(files_to_process)}] Processing: {file_path.name}")
    print("-" * 80)
    
    try:
        # Extract text based on file type
        text = ""
        
        if file_path.suffix.lower() == '.pdf':
            # Extract from PDF
            print("   📖 Extracting text from PDF...")
            with fitz.open(str(file_path)) as doc:
                total_pages = len(doc)
                for page_num, page in enumerate(doc, 1):
                    page_text = page.get_text()
                    text += page_text
                    if page_num % 10 == 0:
                        print(f"      Processed {page_num}/{total_pages} pages...")
                print(f"   ✅ Extracted {len(text):,} characters from {total_pages} pages")
        
        elif file_path.suffix.lower() in ['.docx', '.doc']:
            # Extract from DOCX
            print("   📖 Extracting text from DOCX...")
            doc = docx.Document(str(file_path))
            paragraphs = []
            for para in doc.paragraphs:
                if para.text.strip():
                    paragraphs.append(para.text)
            text = "\n\n".join(paragraphs)
            print(f"   ✅ Extracted {len(text):,} characters from {len(paragraphs)} paragraphs")
        
        if not text or len(text) < 100:
            print(f"   ⚠️  Warning: Document seems empty or too short ({len(text)} chars)")
            print("   Skipping this file...")
            failed_files.append((file_path.name, "Empty or too short"))
            continue
        
        # Split into chunks
        print("   ✂️  Splitting text into chunks...")
        chunks = text_splitter.split_text(text)
        print(f"   ✅ Split into {len(chunks)} chunks")
        
        # Prepare documents for upload
        # Convert filename to ASCII-safe format (Pinecone requirement)
        import unicodedata
        import re
        
        # Normalize Vietnamese characters to ASCII
        normalized = unicodedata.normalize('NFKD', file_path.stem)
        ascii_safe = normalized.encode('ascii', 'ignore').decode('ascii')
        # Replace any remaining special chars with underscore
        ascii_safe = re.sub(r'[^a-zA-Z0-9_-]', '_', ascii_safe)
        # Remove multiple underscores
        ascii_safe = re.sub(r'_+', '_', ascii_safe).strip('_')
        
        # Add file index prefix to ensure uniqueness
        file_safe_name = f"doc{idx}_{ascii_safe}"
        
        for i, chunk in enumerate(chunks):
            doc_id = f"{file_safe_name}_chunk_{i}"
            all_documents.append({
                "id": doc_id,
                "chunk_text": chunk,
                "source": file_path.name,  # Keep original filename in metadata
                "document_type": file_path.suffix[1:],  # Remove the dot
                "chunk_index": i,
                "total_chunks": len(chunks),
                "upload_date": "2025-10-08"
            })
        
        total_chunks += len(chunks)
        successful_files += 1
        print(f"   ✅ Prepared {len(chunks)} chunks from {file_path.name}")
        
    except Exception as e:
        print(f"   ❌ Failed to process {file_path.name}: {str(e)}")
        failed_files.append((file_path.name, str(e)))
        continue

# Upload all documents to Pinecone
if all_documents:
    print("\n" + "=" * 80)
    print(f"📤 UPLOADING {len(all_documents)} chunks to Pinecone...")
    print(f"   Namespace: {NAMESPACE}")
    print(f"   Total chunks: {total_chunks}")
    print("=" * 80)
    
    try:
        # Upload in batches
        print("\n   ⬆️  Uploading to Pinecone (this may take several minutes)...")
        pinecone_service.upsert_documents(
            documents=all_documents,
            namespace=NAMESPACE
        )
        
        print("\n   ✅ Upload complete!")
        print("   Waiting 5 seconds for indexing...")
        time.sleep(5)
        
        # Check index stats
        if pinecone_service.dense_index:
            stats = pinecone_service.dense_index.describe_index_stats()
            namespace_stats = stats.get('namespaces', {}).get(NAMESPACE, {})
            vector_count = namespace_stats.get('vector_count', 0)
            
            print(f"\n   📊 Index Statistics:")
            print(f"   - Namespace: {NAMESPACE}")
            print(f"   - Vectors uploaded: {len(all_documents)}")
            print(f"   - Vectors in index: {vector_count}")
            
            if vector_count >= len(all_documents):
                print("   ✅ All chunks uploaded successfully!")
            else:
                print(f"   ⚠️  Some vectors may still be indexing...")
        
    except Exception as e:
        print(f"\n   ❌ Failed to upload to Pinecone: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
else:
    print("\n❌ No documents to upload!")
    sys.exit(1)

# Final Summary
print("\n" + "=" * 80)
print("UPLOAD SUMMARY")
print("=" * 80)
print(f"✅ Successfully processed: {successful_files}/{len(files_to_process)} files")
print(f"✅ Total chunks uploaded: {total_chunks}")
print(f"✅ Namespace: {NAMESPACE}")

if failed_files:
    print(f"\n⚠️  Failed files ({len(failed_files)}):")
    for filename, error in failed_files:
        print(f"   - {filename}: {error}")

print("\n🎉 Batch upload complete!")
print(f"\nDocuments are now searchable in namespace: '{NAMESPACE}'")
print("\nYou can now query these documents through the RAG API!")
print("=" * 80)

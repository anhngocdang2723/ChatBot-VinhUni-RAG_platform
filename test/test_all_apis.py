"""
Complete API Test Suite - Test all endpoints before frontend integration
"""
import requests
import json
import time
from typing import Dict, Any

BASE_URL = "http://127.0.0.1:8000"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_header(text: str):
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*80}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.CYAN}{text.center(80)}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.CYAN}{'='*80}{Colors.END}\n")

def print_test(test_name: str):
    print(f"{Colors.BOLD}{Colors.BLUE}[TEST] {test_name}{Colors.END}")

def print_success(message: str):
    print(f"{Colors.GREEN}✅ {message}{Colors.END}")

def print_error(message: str):
    print(f"{Colors.RED}❌ {message}{Colors.END}")

def print_info(message: str):
    print(f"{Colors.YELLOW}ℹ️  {message}{Colors.END}")

# Test Results Tracker
test_results = {
    "passed": 0,
    "failed": 0,
    "total": 0
}

def test_health_endpoint():
    """Test 1: Health Check"""
    test_results["total"] += 1
    print_test("Health Check Endpoint")
    
    try:
        response = requests.get(f"{BASE_URL}/api/health", timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Status: {data.get('status')}")
            print_info(f"Collection: {data.get('collection', {}).get('name')}")
            test_results["passed"] += 1
            return True
        else:
            print_error(f"Failed with status {response.status_code}")
            test_results["failed"] += 1
            return False
    except Exception as e:
        print_error(f"Exception: {e}")
        test_results["failed"] += 1
        return False

def test_upload_document():
    """Test 2: Document Upload"""
    test_results["total"] += 1
    print_test("Document Upload Endpoint")
    
    try:
        files = {'file': open('data/file/lsptdhv.docx', 'rb')}
        data = {
            'chunk_size': '1000',
            'chunk_overlap': '200',
            'user_id': '1'
        }
        
        print_info("Uploading lsptdhv.docx...")
        response = requests.post(
            f"{BASE_URL}/api/documents/upload",
            files=files,
            data=data,
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            print_success(f"Upload status: {result.get('status')}")
            print_info(f"File ID: {result.get('file_id')}")
            print_info(f"Message: {result.get('message')}")
            test_results["passed"] += 1
            return result.get('file_id')
        elif response.status_code in [400, 409]:
            # Duplicate is also acceptable (both 400 and 409)
            result = response.json()
            if "Duplicate" in str(result) or "duplicate" in str(result).lower():
                print_success("Document already exists (duplicate - expected)")
                doc_id = result.get('detail', {}).get('existing_document', {}).get('document_id')
                print_info(f"Existing document ID: {doc_id}")
                test_results["passed"] += 1
                return doc_id
        
        print_error(f"Failed with status {response.status_code}")
        print_error(f"Response: {response.text}")
        test_results["failed"] += 1
        return None
        
    except Exception as e:
        print_error(f"Exception: {e}")
        test_results["failed"] += 1
        return None

def test_document_status(file_id: str):
    """Test 3: Check Document Status"""
    if not file_id:
        print_info("Skipping status check (no file_id)")
        return False
    
    test_results["total"] += 1
    print_test("Document Status Check")
    
    try:
        print_info(f"Checking status for file_id: {file_id}")
        time.sleep(2)  # Wait for processing
        
        response = requests.get(
            f"{BASE_URL}/api/documents/status/{file_id}",
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print_success(f"Status: {result.get('status')}")
            print_info(f"Filename: {result.get('filename')}")
            print_info(f"Chunks: {result.get('chunks_count')}")
            test_results["passed"] += 1
            return True
        else:
            print_error(f"Failed with status {response.status_code}")
            test_results["failed"] += 1
            return False
            
    except Exception as e:
        print_error(f"Exception: {e}")
        test_results["failed"] += 1
        return False

def test_retrieve_endpoint():
    """Test 4: Retrieve Documents (No LLM)"""
    test_results["total"] += 1
    print_test("Retrieve Documents Endpoint")
    
    try:
        payload = {
            "query": "tuyển sinh 2025",
            "top_k": 12,
            "top_n": 4
        }
        
        print_info(f"Query: {payload['query']}")
        response = requests.post(
            f"{BASE_URL}/api/query/retrieve",
            json=payload,
            timeout=15
        )
        
        if response.status_code == 200:
            result = response.json()
            docs = result.get('documents', [])
            print_success(f"Retrieved {len(docs)} documents")
            
            if docs:
                print_info(f"Top document score: {docs[0].get('score', 'N/A')}")
                metadata = docs[0].get('metadata', {})
                print_info(f"Source: {metadata.get('original_filename', 'N/A')}")
            
            test_results["passed"] += 1
            return True
        else:
            print_error(f"Failed with status {response.status_code}")
            test_results["failed"] += 1
            return False
            
    except Exception as e:
        print_error(f"Exception: {e}")
        test_results["failed"] += 1
        return False

def test_rag_query(model: str = "qwen3-max"):
    """Test 5: RAG Query with LLM"""
    test_results["total"] += 1
    print_test(f"RAG Query Endpoint (model: {model})")
    
    try:
        payload = {
            "query": "Điều kiện tuyển sinh đại học năm 2025 của trường là gì?",
            "top_k": 12,
            "top_n": 4,
            "temperature": 0.2,
            "max_tokens": 600,
            "model": model
        }
        
        print_info(f"Query: {payload['query']}")
        print_info(f"Parameters: top_k={payload['top_k']}, top_n={payload['top_n']}")
        
        start_time = time.time()
        response = requests.post(
            f"{BASE_URL}/api/query/rag",
            json=payload,
            timeout=30
        )
        end_time = time.time()
        
        if response.status_code == 200:
            result = response.json()
            answer = result.get('answer', '')
            sources = result.get('sources', [])
            
            elapsed = end_time - start_time
            print_success(f"Query completed in {elapsed:.2f}s")
            print_success(f"Found {len(sources)} sources")
            print_info(f"\nAnswer preview:\n{answer[:200]}...")
            
            if sources:
                print_info(f"\nTop source:")
                metadata = sources[0].get('metadata', {})
                print_info(f"  File: {metadata.get('original_filename', 'N/A')}")
                print_info(f"  Score: {sources[0].get('score', 'N/A')}")
                print_info(f"  Chunk: {metadata.get('chunk_id')}/{metadata.get('total_chunks')}")
            
            test_results["passed"] += 1
            return True
        else:
            print_error(f"Failed with status {response.status_code}")
            print_error(f"Response: {response.text[:200]}")
            test_results["failed"] += 1
            return False
            
    except Exception as e:
        print_error(f"Exception: {e}")
        test_results["failed"] += 1
        return False

def test_rag_query_default_model():
    """Test 6: RAG Query with Default Model"""
    test_results["total"] += 1
    print_test("RAG Query with Default Model (no model specified)")
    
    try:
        payload = {
            "query": "Trường Đại học Vinh có bao nhiêu khoa?",
            "top_k": 12,
            "top_n": 4
        }
        
        print_info(f"Query: {payload['query']}")
        print_info("Using default model settings")
        
        start_time = time.time()
        response = requests.post(
            f"{BASE_URL}/api/query/rag",
            json=payload,
            timeout=30
        )
        end_time = time.time()
        
        if response.status_code == 200:
            result = response.json()
            answer = result.get('answer', '')
            sources = result.get('sources', [])
            
            elapsed = end_time - start_time
            print_success(f"Query completed in {elapsed:.2f}s")
            print_success(f"Found {len(sources)} sources")
            
            if answer and answer != "No relevant documents found for your query.":
                print_info(f"\nAnswer preview:\n{answer[:200]}...")
                test_results["passed"] += 1
                return True
            else:
                print_error("No answer generated")
                test_results["failed"] += 1
                return False
        else:
            print_error(f"Failed with status {response.status_code}")
            test_results["failed"] += 1
            return False
            
    except Exception as e:
        print_error(f"Exception: {e}")
        test_results["failed"] += 1
        return False

def print_summary():
    """Print test summary"""
    print_header("TEST SUMMARY")
    
    total = test_results["total"]
    passed = test_results["passed"]
    failed = test_results["failed"]
    pass_rate = (passed / total * 100) if total > 0 else 0
    
    print(f"Total Tests: {total}")
    print(f"{Colors.GREEN}Passed: {passed}{Colors.END}")
    print(f"{Colors.RED}Failed: {failed}{Colors.END}")
    print(f"Pass Rate: {pass_rate:.1f}%")
    
    if failed == 0:
        print(f"\n{Colors.GREEN}{Colors.BOLD}🎉 ALL TESTS PASSED! System ready for frontend integration.{Colors.END}")
    else:
        print(f"\n{Colors.YELLOW}⚠️  Some tests failed. Please review before frontend integration.{Colors.END}")

def main():
    print_header("COMPLETE API TEST SUITE")
    print_info("Testing all endpoints before frontend integration...")
    
    # Test 1: Health Check
    test_health_endpoint()
    
    # Test 2: Document Upload
    file_id = test_upload_document()
    
    # Test 3: Document Status
    if file_id:
        test_document_status(file_id)
    
    # Test 4: Retrieve (No LLM)
    test_retrieve_endpoint()
    
    # Test 5: RAG Query with qwen3-max
    test_rag_query("qwen3-max")
    
    # Test 6: RAG Query with Default Model
    test_rag_query_default_model()
    
    # Print Summary
    print_summary()
    
    return test_results["failed"] == 0

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)

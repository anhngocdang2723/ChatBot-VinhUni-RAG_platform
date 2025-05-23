import threading

_collection_cache = None
_collection_cache_lock = threading.Lock()

def get_collection_cache(vector_store):
    global _collection_cache
    with _collection_cache_lock:
        if _collection_cache is None:
            print("[CollectionCache] Load collections from Qdrant (cache miss)")
            _collection_cache = vector_store.list_collections()
        else:
            print("[CollectionCache] Return collections from cache (cache hit)")
    return _collection_cache

def refresh_collection_cache(vector_store):
    global _collection_cache
    with _collection_cache_lock:
        print("[CollectionCache] Refresh cache from Qdrant (admin trigger)")
        _collection_cache = vector_store.list_collections() 
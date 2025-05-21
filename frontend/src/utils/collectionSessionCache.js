export const COLLECTIONS_KEY = 'collections';

export function getCachedCollections() {
  const cached = sessionStorage.getItem(COLLECTIONS_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      console.log('[SessionCache] Lấy collections từ sessionStorage:', parsed);
      return parsed;
    } catch {
      sessionStorage.removeItem(COLLECTIONS_KEY);
    }
  }
  console.log('[SessionCache] Không có collections trong sessionStorage');
  return null;
}

export function setCachedCollections(collections) {
  console.log('[SessionCache] Lưu collections vào sessionStorage:', collections);
  sessionStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
}

export function clearCachedCollections() {
  console.log('[SessionCache] Xóa collections khỏi sessionStorage');
  sessionStorage.removeItem(COLLECTIONS_KEY);
} 
/**
 * IndexedDB 图片存储模块
 * 
 * 设计：localStorage 只存元数据（id/topic/type/cardType...），
 * 图片 dataUrl 存入 IndexedDB，解决 localStorage 5MB 配额限制。
 * IndexedDB 配额通常在磁盘的 50%，足够存储数百张课件图片。
 */

const DB_NAME = 'SmartTeachingDB';
const DB_VERSION = 1;
const STORE_NAME = 'images';

/** 打开/创建数据库 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** 存储图片 */
export async function storeImage(id, dataUrl) {
  if (!id || !dataUrl) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ id, dataUrl, createdAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** 批量存储图片 */
export async function storeImages(entries) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    for (const { id, dataUrl } of entries) {
      if (id && dataUrl) store.put({ id, dataUrl, createdAt: Date.now() });
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** 读取单张图片 */
export async function getImage(id) {
  if (!id) return null;
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result?.dataUrl || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

/** 批量读取图片（返回 Map<id, dataUrl>） */
export async function getImages(ids) {
  if (!ids || ids.length === 0) return new Map();
  try {
    const db = await openDB();
    const map = new Map();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      let pending = ids.length;
      let failed = false;

      for (const id of ids) {
        const req = store.get(id);
        req.onsuccess = () => {
          if (req.result?.dataUrl) map.set(id, req.result.dataUrl);
          pending--;
          if (pending === 0) resolve(map);
        };
        req.onerror = () => {
          pending--;
          failed = true;
          if (pending === 0) resolve(map);
        };
      }
    });
  } catch {
    return new Map();
  }
}

/** 删除图片 */
export async function deleteImage(id) {
  if (!id) return;
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch { /* ignore */ }
}

/** 批量删除图片 */
export async function deleteImages(ids) {
  if (!ids || ids.length === 0) return;
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const id of ids) store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch { /* ignore */ }
}

/** 清空所有图片 */
export async function clearAll() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch { /* ignore */ }
}

// ======================== 图片压缩工具 ========================

/**
 * 将 PNG base64 dataUrl 转为 JPEG
 * @param {string} dataUrl - 原始 PNG dataUrl
 * @param {number} quality - JPEG 质量 0-1，默认 0.92
 * @returns {Promise<string>} JPEG dataUrl
 */
function convertToJPEG(dataUrl, quality = 0.92) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = dataUrl;
  });
}

/**
 * 获取所有图片的 key 列表
 */
async function getAllKeys() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAllKeys();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

/**
 * 批量压缩 IndexedDB 中的所有 PNG 图片
 * 仅处理未压缩过的 PNG 图片，转为 JPEG 并替换
 * @returns {Promise<{total: number, compressed: number, skipped: number, savedBytes: number}>}
 */
export async function compressAllImages() {
  const db = await openDB();
  const keys = await getAllKeys();
  const stats = { total: keys.length, compressed: 0, skipped: 0, savedBytes: 0 };

  // 分批处理，每批 5 张，避免长时间锁定
  const BATCH_SIZE = 5;
  for (let i = 0; i < keys.length; i += BATCH_SIZE) {
    const batch = keys.slice(i, i + BATCH_SIZE);

    // 读取批次
    const txRead = db.transaction(STORE_NAME, 'readonly');
    const storeRead = txRead.objectStore(STORE_NAME);
    const entries = await Promise.all(
      batch.map(id => new Promise(resolve => {
        const req = storeRead.get(id);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      }))
    );

    // 压缩
    const updates = [];
    for (const entry of entries) {
      if (!entry || entry.compressed) { stats.skipped++; continue; }
      if (!entry.dataUrl || !entry.dataUrl.startsWith('data:image/png')) { stats.skipped++; continue; }

      try {
        const originalSize = entry.dataUrl.length;
        const jpegUrl = await convertToJPEG(entry.dataUrl, 0.92);
        const newSize = jpegUrl.length;
        stats.savedBytes += originalSize - newSize;
        updates.push({ id: entry.id, dataUrl: jpegUrl, createdAt: entry.createdAt, compressed: true });
        stats.compressed++;
      } catch {
        stats.skipped++;
      }
    }

    // 写入批次
    if (updates.length > 0) {
      await new Promise((resolve, reject) => {
        const txWrite = db.transaction(STORE_NAME, 'readwrite');
        const storeWrite = txWrite.objectStore(STORE_NAME);
        for (const u of updates) storeWrite.put(u);
        txWrite.oncomplete = () => resolve();
        txWrite.onerror = () => reject(txWrite.error);
      });
    }
  }

  return stats;
}

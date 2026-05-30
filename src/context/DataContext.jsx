import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { storeImage, deleteImage, deleteImages } from '../store/imageStore';

const DataContext = createContext(null);

// 从 localStorage 安全读取
function safeGetItem(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch { return []; }
}

// 安全写入 localStorage
function safeSetItem(key, value) {
  try { localStorage.setItem(key, value); }
  catch (e) {
    if (e.name === 'QuotaExceededError') {
      console.warn('LocalStorage 配额已满');
    }
  }
}

// 启动时清理旧格式的 base64 图片数据（从 localStorage 迁移到 IndexedDB）
async function migrateOldData(uid) {
  const histKey = `st_hist_${uid}`;
  const favKey = `st_fav_${uid}`;

  for (const key of [histKey, favKey]) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const items = JSON.parse(raw);
      const hasOldImages = items.some(i => i.imageDataUrl && i.imageDataUrl.length > 5000);

      if (hasOldImages) {
        console.log(`检测到旧格式数据 (${key})，迁移到 IndexedDB...`);
        // 把图片迁移到 IndexedDB
        for (const item of items) {
          if (item.imageDataUrl && item.id) {
            await storeImage(item.id, item.imageDataUrl);
          }
        }
        // localStorage 中只保留元数据（去掉 imageDataUrl）
        const cleaned = items.map(({ imageDataUrl, data, ...rest }) => rest);
        safeSetItem(key, JSON.stringify(cleaned));
        console.log(`迁移完成: ${key}, 共 ${cleaned.length} 条`);
      }
    } catch (e) {
      console.warn('数据迁移失败:', e.message);
    }
  }
}

export function DataProvider({ children }) {
  const { user } = useAuth();
  const uid = user?.phone || 'guest';

  // 启动时迁移旧数据
  useEffect(() => { migrateOldData(uid); }, [uid]);

  const [favorites, setFavorites] = useState(() => safeGetItem(`st_fav_${uid}`));
  const [history, setHistory] = useState(() => safeGetItem(`st_hist_${uid}`));

  // 用户切换时重载
  useEffect(() => {
    setFavorites(safeGetItem(`st_fav_${uid}`));
    setHistory(safeGetItem(`st_hist_${uid}`));
  }, [uid]);

  const addFavorite = useCallback(async (item) => {
    const id = Date.now().toString();
    const { imageDataUrl, ...meta } = item;
    const newItem = { ...meta, id, savedAt: Date.now() };

    // 图片存入 IndexedDB
    if (imageDataUrl) {
      await storeImage(id, imageDataUrl);
    }

    setFavorites(prev => {
      const next = [newItem, ...prev];
      safeSetItem(`st_fav_${uid}`, JSON.stringify(next));
      return next;
    });
  }, [uid]);

  const removeFavorite = useCallback((id) => {
    // 同步删除 IndexedDB 中的图片
    deleteImage(id);
    setFavorites(prev => {
      const next = prev.filter(f => f.id !== id);
      safeSetItem(`st_fav_${uid}`, JSON.stringify(next));
      return next;
    });
  }, [uid]);

  const isFavorited = useCallback((type, topic) => {
    return favorites.some(f => f.type === type && f.topic === topic);
  }, [favorites]);

  const addHistory = useCallback(async (item) => {
    const id = Date.now().toString();
    const { imageDataUrl, ...meta } = item;
    const newItem = { ...meta, id, createdAt: Date.now() };

    // 图片存入 IndexedDB
    if (imageDataUrl) {
      await storeImage(id, imageDataUrl);
    }

    setHistory(prev => {
      const next = [newItem, ...prev];
      safeSetItem(`st_hist_${uid}`, JSON.stringify(next));
      return next;
    });
  }, [uid]);

  const clearHistory = useCallback(() => {
    // 清理 IndexedDB 中的历史图片
    const ids = history.map(h => h.id).filter(Boolean);
    if (ids.length > 0) deleteImages(ids);
    setHistory([]);
    try { localStorage.removeItem(`st_hist_${uid}`); } catch {}
  }, [history, uid]);

  // 清除所有历史但保留 IndexedDB 图片（供配额紧张时使用）
  const clearHistoryKeepImages = useCallback(() => {
    setHistory([]);
    try { localStorage.removeItem(`st_hist_${uid}`); } catch {}
  }, [uid]);

  return (
    <DataContext.Provider value={{
      favorites, history,
      addFavorite, removeFavorite, isFavorited,
      addHistory, clearHistory, clearHistoryKeepImages,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be inside DataProvider');
  return ctx;
}

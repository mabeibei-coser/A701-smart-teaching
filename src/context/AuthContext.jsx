import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiUrl } from '../api/base';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // 启动时正在用 cookie 向后端确认登录态

  // 启动时用 cookie 向后端确认是否已登录（替代旧的 localStorage 读取）
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(apiUrl('/api/me'));
        if (alive && res.ok) {
          const data = await res.json();
          setUser({ phone: data.phone, userId: data.userId });
        }
      } catch {
        // 网络异常时按未登录处理
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const login = async (phone) => {
    const res = await fetch(apiUrl('/api/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || '登录失败');
    }
    const data = await res.json();
    setUser({ phone: data.phone, userId: data.userId });
  };

  const logout = async () => {
    try {
      await fetch(apiUrl('/api/logout'), { method: 'POST' });
    } catch {
      // 忽略登出网络错误，前端状态照常清空
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

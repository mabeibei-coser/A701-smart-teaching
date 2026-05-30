import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, Typography, CircularProgress } from '@mui/material';
import theme from './theme';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import CoursewarePage from './pages/CoursewarePage';
import InteractionPage from './pages/InteractionPage';
import ProfilePage from './pages/ProfilePage';
import ToolsPage from './pages/ToolsPage';
import TextbookPage from './pages/TextbookPage';

function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();
  if (loading) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }
  if (!isLoggedIn) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/courseware" element={<ProtectedRoute><CoursewarePage /></ProtectedRoute>} />
        <Route path="/interaction" element={<ProtectedRoute><InteractionPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/textbook" element={<ProtectedRoute><TextbookPage /></ProtectedRoute>} />
        <Route path="/tools" element={<ProtectedRoute><ToolsPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Box sx={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: 26,
        bgcolor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(6px)',
        borderTop: '1px solid rgba(0,0,0,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1200, px: 2, gap: 2,
      }}>
        <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 500 }}>
          谨世ATA研究院大模型中心 2013-{new Date().getFullYear()}
        </Typography>
        <Typography variant="caption" sx={{ color: '#B0BEC5' }}>
          最新数据库版本 {new Date().getFullYear()}年{new Date().getMonth() + 1}月
        </Typography>
      </Box>
    </ThemeProvider>
  );
}

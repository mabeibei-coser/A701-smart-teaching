import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box, Typography, Paper, AppBar, Toolbar, IconButton, Chip,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import FolderCopyOutlinedIcon from '@mui/icons-material/FolderCopyOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';

export default function HomePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // 手机号中间6位打码
  const maskPhone = (phone) => {
    if (!phone || phone.length !== 11) return phone;
    return phone.slice(0, 3) + '******' + phone.slice(9);
  };

  const menus = [
    { label: '我的资料', icon: <FolderCopyOutlinedIcon sx={{ fontSize: 56, opacity: 0.55 }} />, path: '/profile', color: '#A0B4C8' },
    { label: '课件创作', icon: <DashboardOutlinedIcon sx={{ fontSize: 56, opacity: 0.55 }} />, path: '/courseware', color: '#A0B4C8' },
    { label: '课堂互动', icon: <SchoolOutlinedIcon sx={{ fontSize: 56, opacity: 0.55 }} />, path: '/interaction', color: '#A0B4C8' },
    { label: '课堂工具', note: '（开发中）', icon: <BuildOutlinedIcon sx={{ fontSize: 56, opacity: 0.55 }} />, path: '/tools', color: '#A0B4C8' },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F5F7FA' }}>
      {/* 顶栏 - 浅色背景 */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#FFFFFF', borderBottom: '1px solid #E0E4EA' }}>
        <Toolbar sx={{ justifyContent: 'center', position: 'relative' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1A1A2E' }}>
              智能课件创作平台2.0
            </Typography>
            <Chip label="专业版" size="small"
              sx={{ bgcolor: '#4A90A4', color: '#FFF', fontWeight: 700, height: 26, fontSize: '0.75rem' }} />
          </Box>

          <Box sx={{ position: 'absolute', right: 24, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
              {maskPhone(user?.phone)}
            </Typography>
            <IconButton onClick={() => { logout(); navigate('/'); }} sx={{ color: '#9CA3AF' }}>
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* 5个按钮并排 */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: 'calc(100vh - 64px)', px: 4, gap: 3, flexWrap: 'wrap',
      }}>
        {menus.map((m) => (
          <Paper
            key={m.path}
            elevation={0}
            onClick={() => navigate(m.path)}
            sx={{
              width: 200, height: 300,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 2, cursor: 'pointer',
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.75)',
              backdropFilter: 'blur(14px)',
              border: '1px solid rgba(0,0,0,0.06)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px) scale(1.03)',
                bgcolor: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.1)',
                borderColor: '#A0B4C8',
              },
            }}
          >
            <Box sx={{ color: m.color }}>{m.icon}</Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1A1A2E' }}>
                {m.label}
              </Typography>
              {m.note && (
                <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 500 }}>
                  {m.note}
                </Typography>
              )}
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}

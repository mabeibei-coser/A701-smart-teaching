import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CountdownTimer from '../components/CountdownTimer';
import QRQuiz from '../components/QRQuiz';
import TextbookPage from './TextbookPage';
import {
  Box, Typography, AppBar, Toolbar,
  IconButton, ToggleButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TimerIcon from '@mui/icons-material/Timer';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import MenuBookIcon from '@mui/icons-material/MenuBook';

const TOOLS = [
  { key: 'timer', label: '倒计时', icon: <TimerIcon sx={{ fontSize: 16 }} /> },
  { key: 'quiz', label: '扫码答题', icon: <QrCode2Icon sx={{ fontSize: 16 }} /> },
  { key: 'textbook', label: '教科书设置', icon: <MenuBookIcon sx={{ fontSize: 16 }} /> },
];

export default function ToolsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTool, setActiveTool] = useState('timer');

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#FFFFFF', borderBottom: '1px solid #E0E4EA' }}>
        <Toolbar variant="dense" sx={{ justifyContent: 'center', position: 'relative' }}>
          <IconButton onClick={() => navigate('/home')} sx={{ position: 'absolute', left: 8, color: '#9CA3AF' }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1A1A2E' }}>课堂工具</Typography>
          <Box sx={{ position: 'absolute', right: 24, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
              {user?.phone ? user.phone.slice(0,3) + '******' + user.phone.slice(9) : ''}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 左侧工具选择 */}
        <Box sx={{
          width: '22%', minWidth: 270, bgcolor: '#FFF',
          borderRight: '1px solid #E0E4EA', overflowY: 'auto', p: 2,
          display: 'flex', flexDirection: 'column', gap: 1.5,
        }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>工具选择</Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5 }}>
            {TOOLS.map(t => (
              <ToggleButton key={t.key} value={t.key}
                selected={activeTool === t.key}
                onClick={() => setActiveTool(t.key)}
                sx={{
                  py: 1, fontSize: '0.8rem', fontWeight: 500,
                  textTransform: 'none', gap: 0.5,
                  border: '1px solid #E0E4EA !important',
                  borderRadius: '4px !important',
                  '&.Mui-selected': {
                    bgcolor: '#E8F5E9',
                    color: '#2E7D32',
                    borderColor: '#66BB6A !important',
                  },
                }}
              >
                {t.icon}
                {t.label}
              </ToggleButton>
            ))}
          </Box>

          {/* 当前工具的说明 */}
          <Box sx={{ p: 1.5, bgcolor: '#F5F7FA', borderRadius: 1, mt: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
              {activeTool === 'timer' ? '⏱ 倒计时' : activeTool === 'quiz' ? '📱 扫码答题' : '📚 教科书设置'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#5A6D7E', lineHeight: 1.5 }}>
              {activeTool === 'timer'
                ? '设置课堂讨论、小组活动等环节的时间限制，支持1-60分钟倒计时，带颜色提醒。'
                : activeTool === 'quiz'
                ? '快速创建随堂测验，生成答题链接/二维码，学生扫码即可作答。（答题入口开发中）'
                : '添加和管理教学用教材，支持录入书名、出版社、ISBN等信息，方便课件创作时引用。'}
            </Typography>
          </Box>
        </Box>

        {/* 右侧工具区 */}
        <Box sx={{
          flex: 1, overflowY: 'auto', bgcolor: '#F5F7FA', p: 3,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <Box sx={{ maxWidth: 600, width: '100%' }}>
            {activeTool === 'timer' ? <CountdownTimer fullPage /> : activeTool === 'quiz' ? <QRQuiz fullPage /> : <TextbookPage embed />}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

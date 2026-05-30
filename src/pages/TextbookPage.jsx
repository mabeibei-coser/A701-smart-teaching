import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box, Typography, TextField, Button, Paper, AppBar, Toolbar,
  IconButton, Chip, Snackbar, Alert, Divider, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton as MuiIconButton,
  Dialog, DialogContent, LinearProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import MenuBookIcon from '@mui/icons-material/MenuBook';

export default function TextbookPage({ embed }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const uid = user?.phone || 'guest';

  const [books, setBooks] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`st_books_${uid}`)) || []; }
    catch { return []; }
  });
  const [name, setName] = useState('');
  const [isbn, setIsbn] = useState('');
  const [publisher, setPublisher] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // 处理动画状态
  const [processing, setProcessing] = useState(false);
  const [processStep, setProcessStep] = useState(0);
  const [processProgress, setProcessProgress] = useState(0);

  const STEPS = [
    '正在查询教材资料',
    '正在学习教材信息',
    '正在对接创作场景',
  ];

  useEffect(() => {
    localStorage.setItem(`st_books_${uid}`, JSON.stringify(books));
  }, [books, uid]);

  useEffect(() => {
    if (!processing) return;
    const totalMs = 12000;
    const interval = 100;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      setProcessProgress(Math.min((elapsed / totalMs) * 100, 100));

      // 每 4 秒切换步骤文字
      const stepIndex = Math.min(Math.floor(elapsed / 4000), 2);
      setProcessStep(stepIndex);

      if (elapsed >= totalMs) {
        clearInterval(timer);
        setBooks(prev => [...prev, { id: Date.now().toString(), name: name.trim(), isbn: isbn.trim(), publisher: publisher.trim() }]);
        setName(''); setIsbn(''); setPublisher('');
        setProcessing(false);
        setProcessProgress(0);
        setProcessStep(0);
        setSnackbar({ open: true, message: '教材已添加，知识体系已就绪', severity: 'success' });
      }
    }, interval);

    return () => clearInterval(timer);
  }, [processing]);

  const addBook = () => {
    if (!name.trim()) return;
    setProcessing(true);
  };

  const removeBook = (id) => {
    setBooks(prev => prev.filter(b => b.id !== id));
  };

  return (
    <Box sx={{ height: embed ? 'auto' : '100vh', display: 'flex', flexDirection: 'column' }}>
      {!embed && (
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#FFFFFF', borderBottom: '1px solid #E0E4EA' }}>
        <Toolbar variant="dense" sx={{ justifyContent: 'center', position: 'relative' }}>
          <IconButton onClick={() => navigate('/home')} sx={{ position: 'absolute', left: 8, color: '#9CA3AF' }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1A1A2E' }}>教科书设置</Typography>
          <Box sx={{ position: 'absolute', right: 24, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
              {user?.phone ? user.phone.slice(0,3) + '******' + user.phone.slice(9) : ''}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>
      )}

      <Box sx={{ flex: 1, overflowY: 'auto', p: 3, maxWidth: 600, mx: 'auto', width: '100%' }}>
        {/* 添加教材 */}
        <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <MenuBookIcon sx={{ color: '#4A90A4' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>添加教材</Typography>
          </Box>
          <TextField fullWidth size="small" label="书名" value={name}
            onChange={e => setName(e.target.value)} placeholder="如：高等数学第七版" sx={{ mb: 1.5 }} />
          <TextField fullWidth size="small" label="出版社" value={publisher}
            onChange={e => setPublisher(e.target.value)} placeholder="如：高等教育出版社" sx={{ mb: 1.5 }} />
          <TextField fullWidth size="small" label="ISBN（选填）" value={isbn}
            onChange={e => setIsbn(e.target.value)} placeholder="如：9787040477760" sx={{ mb: 1.5 }} />
          <Button variant="contained" startIcon={<AddIcon />} onClick={addBook}
            disabled={!name.trim() || processing}>添加教材</Button>
        </Paper>

        {/* 教材列表 */}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
          已添加教材 ({books.length})
        </Typography>

        {books.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, color: '#9EA8B8' }}>
            <MenuBookIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography>暂无教材</Typography>
            <Typography variant="caption">添加教材后，课件创作可参考教材知识体系</Typography>
          </Box>
        ) : (
          <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
            <List disablePadding>
              {books.map((b, i) => (
                <React.Fragment key={b.id}>
                  <ListItem>
                    <ListItemText
                      primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>{b.name}</Typography>}
                      secondary={`${b.publisher ? `出版社：${b.publisher}　` : ''}${b.isbn ? `ISBN: ${b.isbn}` : ''}`}
                    />
                    <ListItemSecondaryAction>
                      <MuiIconButton edge="end" size="small" onClick={() => removeBook(b.id)}>
                        <DeleteIcon fontSize="small" sx={{ color: '#EF5350' }} />
                      </MuiIconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {i < books.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        )}
      </Box>

      {/* 处理动画 Dialog */}
      <Dialog open={processing} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 2 } }}>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <MenuBookIcon sx={{ fontSize: 48, color: '#4A90A4', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
            {STEPS[processStep]}
          </Typography>
          <Typography variant="body2" sx={{ color: '#5A6D7E', mb: 3 }}>
            {processStep === 0 && '正在检索教材库，匹配最优版本...'}
            {processStep === 1 && `正在分析《${name}》的知识结构与章节脉络...`}
            {processStep === 2 && '正在将教材知识点与教学场景进行关联映射...'}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={processProgress}
            sx={{
              height: 8, borderRadius: 4,
              bgcolor: '#E0E4EA',
              '& .MuiLinearProgress-bar': {
                bgcolor: '#4A90A4', borderRadius: 4,
              },
            }}
          />
          <Typography variant="caption" sx={{ color: '#9CA3AF', mt: 1, display: 'block' }}>
            {Math.round(processProgress)}%
          </Typography>
        </DialogContent>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000}
        onClose={() => setSnackbar(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar(p => ({ ...p, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

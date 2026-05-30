import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { generateInteraction } from '../api/xfyun';
import { DISCUSSION_TYPES } from '../prompts/systemPrompts';
import DiscussionRenderer from '../components/DiscussionRenderer';
import html2canvas from 'html2canvas';
import {
  Box, Typography, TextField, ToggleButton,
  Button, CircularProgress, Snackbar, Alert, AppBar, Toolbar,
  IconButton, Chip, Fab, Tooltip,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';

export default function InteractionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addFavorite, removeFavorite, isFavorited, addHistory, favorites } = useData();
  const contentRef = useRef(null);

  const [topic, setTopic] = useState('');
  const [supplement, setSupplement] = useState('');
  const [caseType, setCaseType] = useState('案例分析');
  const [difficulty, setDifficulty] = useState('进阶');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // 教科书选择
  const uid = user?.phone || 'guest';
  const savedBooks = useMemo(() => {
    try { return JSON.parse(localStorage.getItem(`st_books_${uid}`)) || []; }
    catch { return []; }
  }, [uid]);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [bookContext, setBookContext] = useState('');

  const handleBookChange = (e) => {
    const id = e.target.value;
    setSelectedBookId(id);
    if (id) {
      const book = savedBooks.find(b => b.id === id);
      setBookContext(book?.name || '');
    } else {
      setBookContext('');
    }
  };

  // 倒计时
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (!loading) { setCountdown(60); return; }
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [loading]);

  const showMsg = (msg, sev = 'info') => setSnackbar({ open: true, message: msg, severity: sev });

  // 截图 ref：用于在 result 渲染后保存快照
  const pendingSaveRef = useRef(null);
  // 截图模式：展开所有折叠面板
  const [screenshotMode, setScreenshotMode] = useState(false);

  // 当 result 渲染完成后截图并存入历史
  useEffect(() => {
    if (!result || loading) return;
    // 先展开所有面板再截图
    setScreenshotMode(true);
    const timer = setTimeout(async () => {
      if (!contentRef.current) return;
      try {
        const canvas = await html2canvas(contentRef.current, { backgroundColor: '#FFFFFF', scale: 2, useCORS: true, logging: false });
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        const info = pendingSaveRef.current;
        if (info) {
          addHistory({ type: 'discussion', ...info, imageDataUrl });
        }
      } catch {}
      setScreenshotMode(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [result, loading, addHistory]);

  const fav = isFavorited('discussion', topic);

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) { showMsg('请输入互动主题', 'error'); return; }
    setLoading(true);
    const startTime = Date.now();
    try {
      const res = await generateInteraction({ topic: topic.trim(), supplement, caseType, difficulty, bookContext });
      const duration = Math.round((Date.now() - startTime) / 1000);
      setResult(res);

      // 保存信息留待 useEffect 截图后使用
      pendingSaveRef.current = {
        topic: topic.trim(),
        caseType,
        difficulty,
        data: res,
        duration,
      };

      showMsg('生成成功', 'success');
    } catch (err) {
      showMsg(err.message || '生成失败', 'error');
    } finally { setLoading(false); }
  }, [topic, supplement, caseType, difficulty, bookContext, addHistory]);

  const handleDownload = async () => {
    if (!contentRef.current) return;
    try {
      const canvas = await html2canvas(contentRef.current, { backgroundColor: '#FFFFFF', scale: 2, useCORS: true, logging: false });
      const link = document.createElement('a');
      link.download = `互动-${topic}-${Date.now()}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();
      showMsg('下载成功', 'success');
    } catch { showMsg('下载失败', 'error'); }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      showMsg('已复制', 'success');
    } catch { showMsg('复制失败', 'error'); }
  };

  const handleFav = () => {
    if (fav) {
      const existingFav = favorites.find(f => f.topic === topic);
      if (existingFav) removeFavorite(existingFav.id);
      showMsg('已取消收藏');
    } else {
      addFavorite({ type: 'discussion', topic: topic.trim(), caseType, data: result });
      showMsg('已收藏', 'success');
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#FFFFFF', borderBottom: '1px solid #E0E4EA' }}>
        <Toolbar variant="dense" sx={{ justifyContent: 'center', position: 'relative' }}>
          <IconButton onClick={() => navigate('/home')} sx={{ position: 'absolute', left: 8, color: '#9CA3AF' }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1A1A2E' }}>课堂互动</Typography>
          <Box sx={{ position: 'absolute', right: 24, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
              {user?.phone ? user.phone.slice(0,3) + '******' + user.phone.slice(9) : ''}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 左侧输入 + 工具区 */}
        <Box sx={{
          width: '22%', minWidth: 270, bgcolor: '#FFF',
          borderRight: '1px solid #E0E4EA', overflowY: 'auto', p: 2,
          display: 'flex', flexDirection: 'column', gap: 1.5,
        }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>互动参数</Typography>

          {/* 教科书下拉 */}
          <FormControl size="small" fullWidth>
            <InputLabel>教科书</InputLabel>
            <Select value={selectedBookId} label="教科书" onChange={handleBookChange}>
              <MenuItem value=""><em>不使用教材</em></MenuItem>
              {savedBooks.map(b => (
                <MenuItem key={b.id} value={b.id}>{b.name}{b.publisher ? ` · ${b.publisher}` : ''}{b.isbn ? ` (${b.isbn})` : ''}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField size="small" label="互动主题" value={topic}
            onChange={e => setTopic(e.target.value)} inputProps={{ maxLength: 200 }} />

          <TextField size="small" label="补充要求（选填）" value={supplement}
            onChange={e => setSupplement(e.target.value)} multiline rows={5}
            inputProps={{ maxLength: 500 }} />

          <Typography variant="caption" sx={{ fontWeight: 500 }}>互动类型</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0.5 }}>
            {DISCUSSION_TYPES.map(t => (
              <ToggleButton key={t} value={t}
                selected={caseType === t}
                onClick={() => setCaseType(t)}
                sx={{
                  py: 1, fontSize: '0.75rem', fontWeight: 500,
                  textTransform: 'none',
                  border: '1px solid #E0E4EA !important',
                  borderRadius: '4px !important',
                  '&.Mui-selected': {
                    bgcolor: '#FFF3E0',
                    color: '#E65100',
                    borderColor: '#F57C00 !important',
                  },
                }}
              >
                {t}
              </ToggleButton>
            ))}
          </Box>

          <Typography variant="caption" sx={{ fontWeight: 500 }}>难易程度</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0.5 }}>
            {['基础', '进阶', '挑战'].map(d => (
              <ToggleButton key={d} value={d}
                selected={difficulty === d}
                onClick={() => setDifficulty(d)}
                sx={{
                  py: 1, fontSize: '0.75rem', fontWeight: 500,
                  textTransform: 'none',
                  border: '1px solid #E0E4EA !important',
                  borderRadius: '4px !important',
                  '&.Mui-selected': {
                    bgcolor: '#FFF3E0',
                    color: '#E65100',
                    borderColor: '#F57C00 !important',
                  },
                }}
              >
                {d}
              </ToggleButton>
            ))}
          </Box>

          <Button variant="contained" fullWidth onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ mt: 1, bgcolor: '#F57C00', '&:hover': { bgcolor: '#E65100' } }}>
            {loading ? '生成中...' : '生成课堂互动'}
          </Button>
        </Box>

        {/* 右侧输出区 */}
        <Box sx={{ flex: 1, overflowY: 'auto', bgcolor: '#F5F7FA', position: 'relative', p: 3, display: 'flex', flexDirection: 'column' }}>
          {result && !loading && (
            <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 10, display: 'flex', gap: 1 }}>
              <Tooltip title="下载PNG"><Fab size="small" color="primary" onClick={handleDownload}><DownloadIcon fontSize="small" /></Fab></Tooltip>
              <Tooltip title={fav ? '取消收藏' : '收藏'}>
                <Fab size="small" onClick={handleFav} sx={{ bgcolor: fav ? '#FFD54F' : '#E0E0E0' }}>
                  {fav ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
                </Fab>
              </Tooltip>
            </Box>
          )}

          <Box ref={contentRef} sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {loading ? (
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress sx={{ color: '#F57C00' }} />
                <Typography sx={{ mt: 2, color: 'text.secondary' }}>AI 正在生成互动案例...</Typography>
                <Box sx={{ mt: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <Typography variant="body2" sx={{ color: '#9EA8B8' }}>预计剩余</Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      color: countdown > 30 ? '#F57C00' : countdown > 10 ? '#E6A817' : '#D32F2F',
                      minWidth: 48,
                      textAlign: 'center',
                    }}
                  >
                    {countdown || 0}s
                  </Typography>
                </Box>
                <Box sx={{
                  mx: 'auto', mt: 1.5, width: 200, height: 4,
                  bgcolor: '#E0E4EA', borderRadius: 2, overflow: 'hidden',
                }}>
                  <Box sx={{
                    height: '100%',
                    borderRadius: 2,
                    width: `${((60 - countdown) / 60) * 100}%`,
                    bgcolor: countdown > 30 ? '#F57C00' : countdown > 10 ? '#E6A817' : '#D32F2F',
                    transition: 'width 1s linear',
                  }} />
                </Box>
              </Box>
            ) : result ? (
              <DiscussionRenderer key={screenshotMode ? 'expanded' : 'normal'} data={result} expandAll={screenshotMode} />
            ) : (
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9EA8B8' }}>
                <Typography variant="h6">在左侧输入主题，点击生成互动案例</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>支持 6 种互动类型，3 级难度适配</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

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

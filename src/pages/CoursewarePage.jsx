import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { generateCardImage, getCardDimensions } from '../api/imageGen';
import { generateCardImageXF } from '../api/xfyunTti';
import { generateCardImageDoubao } from '../api/doubaoImage';
import { CARD_TYPES, CARD_STYLES } from '../prompts/systemPrompts';
import {
  Box, Typography, TextField, ToggleButton,
  Button, CircularProgress, Snackbar, Alert, AppBar, Toolbar,
  IconButton, Fab, Tooltip, FormControl, InputLabel, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const INPUT_WIDTH = '20%';

const CARD_SIZES = [
  { value: '1:1', label: '1:1', ratio: [1, 1] },
  { value: '3:2', label: '3:2', ratio: [3, 2] },
  { value: '2:3', label: '2:3', ratio: [2, 3] },
  { value: '16:9', label: '16:9', ratio: [16, 9] },
  { value: '9:16', label: '9:16', ratio: [9, 16] },
];

export default function CoursewarePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { favorites, addFavorite, removeFavorite, isFavorited, addHistory } = useData();
  const contentRef = useRef(null);

  // 从 localStorage 读取教科书列表
  const uid = user?.phone || 'guest';
  const savedBooks = useMemo(() => {
    try { return JSON.parse(localStorage.getItem(`st_books_${uid}`)) || []; }
    catch { return []; }
  }, [uid]);

  // 输入状态
  const [selectedBookId, setSelectedBookId] = useState('');
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [cardType, setCardType] = useState('概念全景');
  const [cardStyle, setCardStyle] = useState('白板风格');
  const [cardSize, setCardSize] = useState('3:2');
  const [apiLine] = useState('line1'); // 线路已隐藏，恒为 GPT
  const [bookName, setBookName] = useState('');
  const [bookIsbn, setBookIsbn] = useState('');

  // 教科书选择 → 自动填充书名和ISBN
  const handleBookChange = (e) => {
    const id = e.target.value;
    setSelectedBookId(id);
    if (id) {
      const book = savedBooks.find(b => b.id === id);
      setBookName(book?.name || '');
      setBookIsbn(book?.isbn || '');
    } else {
      setBookName('');
      setBookIsbn('');
    }
  };

  // 输出状态
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // 缩放和查看 Prompt
  const [zoom, setZoom] = useState(100);
  const [promptOpen, setPromptOpen] = useState(false);

  // 倒计时
  const [countdown, setCountdown] = useState(150);

  useEffect(() => {
    if (!loading) { setCountdown(150); return; }
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [loading]);

  const handleZoomIn = () => setZoom(z => Math.min(z + 20, 200));
  const handleZoomOut = () => setZoom(z => Math.max(z - 20, 60));
  const handleZoomReset = () => setZoom(100);

  const showMsg = (msg, sev = 'info') => setSnackbar({ open: true, message: msg, severity: sev });

  const favKey = `${cardSize}_${topic}`;
  const fav = isFavorited('card', favKey);

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) { showMsg('请输入主题内容', 'error'); return; }
    setLoading(true);
    const startTime = Date.now();
    try {
      const res = apiLine === 'line1'
        ? await generateCardImage({
            topic: topic.trim(), cardType, cardStyle, cardSize, bookName, bookIsbn, notes: notes.trim(),
          })
        : apiLine === 'line2'
        ? await generateCardImageXF({
            topic: topic.trim(), cardType, cardStyle, cardSize, bookName, bookIsbn, notes: notes.trim(),
          })
        : await generateCardImageDoubao({
            topic: topic.trim(), cardType, cardStyle, cardSize, bookName, bookIsbn, notes: notes.trim(),
          });
      const duration = Math.round((Date.now() - startTime) / 1000);
      setResult(res);
      addHistory({
        type: 'card',
        topic: topic.trim(),
        cardType,
        cardStyle,
        cardSize,
        imageDataUrl: res.imageDataUrl,
        prompt: res.revisedPrompt,
        duration,
      });
      showMsg('图片生成成功', 'success');
    } catch (err) {
      const duration = Math.round((Date.now() - startTime) / 1000);
      showMsg(err.message || '生成失败', 'error');
    } finally { setLoading(false); }
  }, [topic, cardType, cardStyle, cardSize, apiLine, bookName, bookIsbn, notes, addHistory]);

  const handleDownload = () => {
    if (!result?.imageDataUrl) return;
    const link = document.createElement('a');
    link.download = `课件-${topic}-${Date.now()}.png`;
    link.href = result.imageDataUrl;
    link.click();
    showMsg('下载成功', 'success');
  };

  const handleCopy = async () => {
    if (!result?.revisedPrompt) { showMsg('无可复制的内容', 'error'); return; }
    try {
      await navigator.clipboard.writeText(result.revisedPrompt);
      showMsg('提示词已复制到剪贴板', 'success');
    } catch { showMsg('复制失败', 'error'); }
  };

  const handleFav = () => {
    if (fav) {
      const existingFav = favorites.find(f => f.topic === favKey);
      if (existingFav) removeFavorite(existingFav.id);
      showMsg('已取消收藏');
    } else {
      addFavorite({
        type: 'card',
        topic: favKey,
        label: topic.trim(),
        cardType,
        cardStyle,
        cardSize,
        imageDataUrl: result?.imageDataUrl,
        prompt: result?.revisedPrompt,
      });
      showMsg('已收藏', 'success');
    }
  };

  const dims = getCardDimensions(cardSize);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 顶栏 */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#FFFFFF', borderBottom: '1px solid #E0E4EA' }}>
        <Toolbar variant="dense" sx={{ justifyContent: 'center', position: 'relative' }}>
          <IconButton onClick={() => navigate('/home')} sx={{ position: 'absolute', left: 8, color: '#9CA3AF' }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1A1A2E' }}>课件创作</Typography>
          <Box sx={{ position: 'absolute', right: 24, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
              {user?.phone ? user.phone.slice(0,3) + '******' + user.phone.slice(9) : ''}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      {/* 主体：左1/5 + 右4/5 */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* === 左侧输入区 === */}
        <Box sx={{
          width: INPUT_WIDTH, minWidth: 280, bgcolor: '#FFF',
          borderRight: '1px solid #E0E4EA', overflowY: 'auto', p: 2,
          display: 'flex', flexDirection: 'column', gap: 1.5,
        }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>课件设计</Typography>

          {/* 教科书下拉 */}
          <FormControl size="small" fullWidth>
            <InputLabel>教科书</InputLabel>
            <Select value={selectedBookId} label="教科书" onChange={handleBookChange}>
              <MenuItem value=""><em>不使用教材</em></MenuItem>
              {savedBooks.map(b => (
                <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField size="small" label="主题内容" value={topic}
            onChange={e => setTopic(e.target.value)} inputProps={{ maxLength: 200 }}
            helperText={`${topic.length}/200`} />

          {/* 补充说明 */}
          <TextField
            size="small"
            label="补充说明"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            multiline
            minRows={4}
            maxRows={4}
            placeholder="补充额外的内容要求、教学重点等..."
            inputProps={{ maxLength: 500 }}
          />

          <Typography variant="caption" sx={{ fontWeight: 500 }}>课件类型</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0.5 }}>
            {CARD_TYPES.map(t => (
              <ToggleButton key={t} value={t}
                selected={cardType === t}
                onClick={() => setCardType(t)}
                sx={{
                  py: 1, fontSize: '0.75rem', fontWeight: 500,
                  textTransform: 'none',
                  border: '1px solid #E0E4EA !important',
                  borderRadius: '4px !important',
                  '&.Mui-selected': {
                    bgcolor: '#E3F2FD',
                    color: '#1565C0',
                    borderColor: '#64B5F6 !important',
                  },
                }}
              >
                {t}
              </ToggleButton>
            ))}
          </Box>

          <Typography variant="caption" sx={{ fontWeight: 500 }}>课件风格</Typography>
          <FormControl size="small" fullWidth>
            <InputLabel>选择风格</InputLabel>
            <Select
              value={cardStyle}
              label="选择风格"
              onChange={e => setCardStyle(e.target.value)}
              renderValue={(selected) => {
                const s = CARD_STYLES.find(c => c.value === selected);
                if (!s) return selected;
                return (
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.8 }}>
                    <Box component="span" dangerouslySetInnerHTML={{ __html: s.icon }} sx={{ display: 'inline-flex' }} />
                    <Typography component="span" variant="body2">{s.label}</Typography>
                  </Box>
                );
              }}
            >
              {CARD_STYLES.map(s => (
                <MenuItem key={s.value} value={s.value} sx={{ py: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <Box component="span" dangerouslySetInnerHTML={{ __html: s.icon }}
                      sx={{ display: 'inline-flex', flexShrink: 0, color: 'text.secondary' }} />
                    <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.3 }}>
                      {s.label}
                      <Typography component="span" variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.65rem', ml: 0.3 }}>
                        （{s.desc}）
                      </Typography>
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="caption" sx={{ fontWeight: 500 }}>课件尺寸</Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'stretch' }}>
            {CARD_SIZES.map(s => {
              const [rw, rh] = s.ratio;
              const boxW = rw >= rh ? 34 : Math.round(34 * (rw / rh));
              const boxH = rw >= rh ? Math.round(34 * (rh / rw)) : 34;
              const isSelected = cardSize === s.value;
              return (
                <Box
                  key={s.value}
                  onClick={() => setCardSize(s.value)}
                  sx={{
                    flex: 1,
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.5, py: 1, px: 0.5, borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: isSelected ? '#1976D2' : '#E0E4EA',
                    bgcolor: isSelected ? '#F0F7FF' : '#FAFBFC',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s, background 0.2s',
                    '&:hover': { borderColor: '#90CAF9' },
                  }}
                >
                  <Box sx={{ height: 34, display: 'flex', alignItems: 'center' }}>
                    <svg width={boxW} height={boxH} viewBox={`0 0 ${rw} ${rh}`}
                      style={{ display: 'block' }}>
                      <rect x="0.3" y="0.3" width={rw - 0.6} height={rh - 0.6}
                        fill={isSelected ? '#1976D2' : '#CFD8DC'}
                        opacity={isSelected ? 0.1 : 0.15} />
                      <rect x="0.3" y="0.3" width={rw - 0.6} height={rh - 0.6}
                        fill="none" stroke={isSelected ? '#1976D2' : '#B0BEC5'}
                        strokeWidth="0.4" rx="0.3" vectorEffect="non-scaling-stroke" />
                    </svg>
                  </Box>
                  <Typography sx={{
                    fontSize: '0.75rem', fontWeight: 600,
                    color: isSelected ? '#1565C0' : '#546E7A',
                  }}>
                    {s.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          {/* 线路选择已隐藏：默认走 GPT（apiLine 恒为 'line1'）。如需恢复多线路，重新放出此处的 ToggleButtonGroup 即可。 */}

          <Button variant="contained" fullWidth onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ mt: 1 }}>
            {loading ? '图片生成中...' : '生成课件'}
          </Button>
        </Box>

        {/* === 右侧输出区 === */}
        <Box sx={{ flex: 1, overflowY: 'auto', bgcolor: '#F5F7FA', position: 'relative', p: 3, display: 'flex', flexDirection: 'column' }}>
          {/* 浮动操作按钮 */}
          {result && !loading && (
            <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 0.8 }}>
              <Tooltip title={`${zoom}%`} arrow placement="left">
                <Fab size="small" onClick={handleZoomReset} sx={{
                  width: 36, height: 36, fontSize: '0.62rem', fontWeight: 700,
                  bgcolor: '#E0E0E0', '&:hover': { bgcolor: '#BDBDBD' },
                }}>
                  {zoom}%
                </Fab>
              </Tooltip>
              <Tooltip title="缩小" arrow placement="left">
                <Fab size="small" onClick={handleZoomOut} color="default" disabled={zoom <= 60}>
                  <ZoomOutIcon fontSize="small" />
                </Fab>
              </Tooltip>
              <Tooltip title="放大" arrow placement="left">
                <Fab size="small" onClick={handleZoomIn} color="default" disabled={zoom >= 200}>
                  <ZoomInIcon fontSize="small" />
                </Fab>
              </Tooltip>
              <Tooltip title="查看提示词" arrow placement="left">
                <Fab size="small" onClick={() => setPromptOpen(true)} color="default">
                  <InfoOutlinedIcon fontSize="small" />
                </Fab>
              </Tooltip>
              <Tooltip title="下载PNG" arrow placement="left">
                <Fab size="small" onClick={handleDownload} color="default">
                  <DownloadIcon fontSize="small" />
                </Fab>
              </Tooltip>
              <Tooltip title="复制提示词" arrow placement="left">
                <Fab size="small" onClick={handleCopy} color="default">
                  <ContentCopyIcon fontSize="small" />
                </Fab>
              </Tooltip>
              <Tooltip title={fav ? '取消收藏' : '收藏'} arrow placement="left">
                <Fab size="small" onClick={handleFav} color="default">
                  {fav ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
                </Fab>
              </Tooltip>
            </Box>
          )}

          <Box ref={contentRef} sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {loading ? (
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress />
                <Typography sx={{ mt: 2, color: 'text.secondary' }}>AI 正在生成课件图片...</Typography>
                <Box sx={{ mt: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <Typography variant="body2" sx={{ color: '#9EA8B8' }}>预计剩余</Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      color: countdown > 60 ? '#4A90A4' : countdown > 20 ? '#E6A817' : '#D32F2F',
                      minWidth: 48,
                      textAlign: 'center',
                    }}
                  >
                    {countdown || 0}s
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#9EA8B8' }}>超时 240 秒</Typography>
                </Box>
                {/* 进度条 */}
                <Box sx={{
                  mx: 'auto', mt: 1.5, width: 240, height: 4,
                  bgcolor: '#E0E4EA', borderRadius: 2, overflow: 'hidden',
                }}>
                  <Box sx={{
                    height: '100%',
                    borderRadius: 2,
                    width: `${((150 - countdown) / 150) * 100}%`,
                    bgcolor: countdown > 60 ? '#4A90A4' : countdown > 20 ? '#E6A817' : '#D32F2F',
                    transition: 'width 1s linear',
                  }} />
                </Box>
              </Box>
            ) : result && result.imageDataUrl ? (
              <Box sx={{
                maxWidth: ['2:3', '9:16'].includes(cardSize) ? 360 : 640,
                mx: 'auto',
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.2s',
              }}>
                <img
                  src={result.imageDataUrl}
                  alt={`${topic} - 知识卡片`}
                  style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: 12,
                    boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
                  }}
                />
              </Box>
            ) : (
              <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9EA8B8' }}>
                <Typography variant="h6">在左侧输入主题，点击生成</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  支持 6 种课件类型、10 套视觉风格、2 种尺寸比
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* 查看提示词对话框 */}
      <Dialog open={promptOpen} onClose={() => setPromptOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          模型修订后的提示词
          <Typography variant="caption" sx={{ ml: 2, color: '#9EA8B8' }}>
            （GPT Image-2 可能对原始 prompt 进行优化修订）
          </Typography>
        </DialogTitle>
        <DialogContent>
          <TextField
            multiline
            fullWidth
            minRows={10}
            maxRows={20}
            value={result?.revisedPrompt || '(无修订提示词)'}
            InputProps={{ readOnly: true }}
            sx={{ fontFamily: 'monospace', fontSize: '0.85rem', mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPromptOpen(false)}>关闭</Button>
          <Button variant="contained" onClick={() => {
            navigator.clipboard.writeText(result?.revisedPrompt || '');
            showMsg('已复制到剪贴板', 'success');
          }}>
            复制
          </Button>
        </DialogActions>
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

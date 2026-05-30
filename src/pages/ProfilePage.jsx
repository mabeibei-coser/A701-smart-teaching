import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { getImages } from '../store/imageStore';
import {
  Box, Typography, AppBar, Toolbar, IconButton, Chip, Tabs, Tab,
  Paper, Button, Dialog, DialogTitle, DialogContent, CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import HistoryIcon from '@mui/icons-material/History';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';

/** 计算 base64 数据的实际字节大小 */
function calcBase64Size(dataUrl) {
  if (!dataUrl) return null;
  try {
    const b64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
    const padding = (b64.match(/=+$/) || [''])[0].length;
    const bytes = (b64.length * 0.75) - padding;
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
    return Math.round(bytes / 1024) + 'KB';
  } catch { return null; }
}

/** 单项卡片组件 */
function CardItem({ item, isFav, isHistory, onRemove, onPreview, onToggleFav, onOpenDiscussion, favored, imageCache }) {
  const displayLabel = item.label || item.topic || '';
  const [imageData, setImageData] = useState(null);
  const [imgLoading, setImgLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // 1) 先检查缓存
      if (imageCache && imageCache.has(item.id)) {
        if (!cancelled) { setImageData(imageCache.get(item.id)); setImgLoading(false); }
        return;
      }
      // 2) 旧格式兼容：直接有 imageDataUrl
      if (item.imageDataUrl) {
        if (!cancelled) { setImageData(item.imageDataUrl); setImgLoading(false); }
        return;
      }
      // 3) 从 IndexedDB 加载
      try {
        const map = await getImages([item.id]);
        if (!cancelled) {
          const url = map.get(item.id);
          if (url) {
            setImageData(url);
            if (imageCache) imageCache.set(item.id, url);
          }
          setImgLoading(false);
        }
      } catch {
        if (!cancelled) setImgLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [item.id]);

  const hasImage = !!imageData;
  const fileSize = hasImage ? calcBase64Size(imageData) : null;

  return (
    <Paper elevation={0} sx={{
      p: 2, mb: 1, borderRadius: 2, border: '1px solid rgba(0,0,0,0.05)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5,
      cursor: (hasImage || item.type === 'discussion') ? 'pointer' : 'default',
      transition: 'box-shadow 0.15s, border-color 0.15s',
      '&:hover': (hasImage || item.type === 'discussion') ? {
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        borderColor: '#B0BEC5',
      } : {},
    }}
      onClick={() => {
        if (hasImage) onPreview({ url: imageData, label: displayLabel });
        else if (item.type === 'discussion' && onOpenDiscussion) onOpenDiscussion(item);
      }}
    >
      <Box sx={{ display: 'flex', gap: 1.5, flex: 1, minWidth: 0 }}>
        {/* 缩略图 */}
        {imgLoading ? (
          <Box sx={{
            width: 72, height: 54, borderRadius: 1, flexShrink: 0,
            border: '1px solid #E0E4EA', bgcolor: '#F5F5F5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CircularProgress size={16} />
          </Box>
        ) : hasImage ? (
          <Box sx={{
            width: 72, height: 54, borderRadius: 1, overflow: 'hidden',
            flexShrink: 0, border: '1px solid #E0E4EA', bgcolor: '#FAFAFA',
            position: 'relative',
          }}>
            <img src={imageData} alt={displayLabel}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <Box sx={{
              position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.15)' },
            }}>
              <ZoomInIcon sx={{ color: '#FFF', opacity: 0, fontSize: 18, transition: 'opacity 0.15s', '.MuiPaper-root:hover &': { opacity: 0.9 } }} />
            </Box>
          </Box>
        ) : (
          <Box sx={{
            width: 72, height: 54, borderRadius: 1, flexShrink: 0,
            border: '1px solid #E0E4EA', bgcolor: '#FFF8E1',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ArticleOutlinedIcon sx={{ color: '#F57C00', fontSize: 28 }} />
          </Box>
        )}
        <Box sx={{ minWidth: 0, pt: 0.3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
            <Chip label={item.type === 'card' ? '课件' : '互动'} size="small"
              color={item.type === 'card' ? 'primary' : 'warning'} />
            <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {displayLabel}
            </Typography>
            {hasImage && !imgLoading && (
              <ZoomInIcon sx={{ fontSize: 14, color: '#B0BEC5', flexShrink: 0 }} />
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
              {displayLabel ? `主题：${displayLabel}` : ''}
              {item.cardType || item.caseType ? ` · ${item.cardType || item.caseType}` : ''}
              {item.cardSize ? ` · ${item.cardSize}` : ''}
              {item.cardStyle ? ` · ${item.cardStyle}` : ''}
              {item.difficulty ? ` · ${item.difficulty}` : ''}
              {' · '}{formatTime(item.savedAt || item.createdAt)}
            </Typography>
            {/* 生成用时 */}
            {item.duration != null && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                <TimerOutlinedIcon sx={{ fontSize: 12, color: '#B0BEC5' }} />
                <Typography variant="caption" sx={{ color: '#7B8A9A' }}>
                  {item.duration}秒
                </Typography>
              </Box>
            )}
            {/* 文件大小 */}
            {fileSize && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                <StorageOutlinedIcon sx={{ fontSize: 12, color: '#B0BEC5' }} />
                <Typography variant="caption" sx={{ color: '#7B8A9A' }}>
                  {fileSize}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* 右侧按钮 */}
      <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, flexShrink: 0, alignItems: 'center' }}>
        {/* 下载PNG（课件和互动都有） */}
        {(item.type === 'card' || item.type === 'discussion') && (isHistory || isFav) && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<DownloadIcon sx={{ fontSize: 14 }} />}
            onClick={async (e) => {
              e.stopPropagation();
              let dataUrl = imageData;
              if (!dataUrl) {
                try {
                  const map = await getImages([item.id]);
                  dataUrl = map.get(item.id) || item.imageDataUrl || null;
                } catch {}
              }
              if (!dataUrl) return;
              const isJpeg = dataUrl.startsWith('data:image/jpeg');
              const ext = isJpeg ? 'jpg' : 'png';
              const link = document.createElement('a');
              link.download = `${item.type === 'discussion' ? '互动' : '课件'}-${item.label || item.topic || 'download'}-${item.id}.${ext}`;
              link.href = dataUrl;
              link.click();
            }}
            sx={{ fontSize: '0.7rem', py: 0.2, px: 1.2, minWidth: 'auto', whiteSpace: 'nowrap', borderColor: '#E0E4EA', color: '#5A6D7E' }}
          >
            下载
          </Button>
        )}
        {isHistory && onToggleFav && (
          <Button
            size="small"
            variant={favored ? 'contained' : 'outlined'}
            color={favored ? 'primary' : 'inherit'}
            startIcon={favored ? <BookmarkIcon sx={{ fontSize: 16 }} /> : <BookmarkBorderIcon sx={{ fontSize: 16 }} />}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFav(item);
            }}
            sx={{
              fontSize: '0.7rem', py: 0.2, px: 1.2, minWidth: 'auto', whiteSpace: 'nowrap',
              ...(favored ? {} : { borderColor: '#E0E4EA', color: '#5A6D7E' }),
            }}
          >
            {favored ? '已收藏' : '收藏'}
          </Button>
        )}
        {isFav && onRemove && (
          <Button size="small" color="error" onClick={(e) => { e.stopPropagation(); onRemove(item.id); }} sx={{ fontSize: '0.7rem' }}>
            取消
          </Button>
        )}
      </Box>
    </Paper>
  );
}

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { favorites, history, addFavorite, removeFavorite, isFavorited, clearHistory } = useData();
  const [tab, setTab] = useState(1);

  const [preview, setPreview] = useState(null);
  const [discussionView, setDiscussionView] = useState(null);
  const [imageCache] = useState(() => new Map());

  const handlePreview = useCallback((p) => setPreview(p), []);

  // 打开互动内容
  const handleOpenDiscussion = useCallback((item) => setDiscussionView(item), []);

  // 切换收藏状态
  const handleToggleFav = useCallback(async (item) => {
    const existingFav = favorites.find(f => f.topic === item.id);
    if (existingFav) {
      removeFavorite(existingFav.id);
    } else {
      // 加载图片
      let imageDataUrl = item.imageDataUrl || null;
      if (!imageDataUrl) {
        try {
          const map = await getImages([item.id]);
          imageDataUrl = map.get(item.id) || null;
        } catch {}
      }
      addFavorite({
        type: item.type,
        topic: item.id,
        label: item.label || item.topic,
        cardType: item.cardType,
        cardStyle: item.cardStyle,
        cardSize: item.cardSize,
        imageDataUrl,
        prompt: item.prompt,
        duration: item.duration,
      });
    }
  }, [favorites, addFavorite, removeFavorite]);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#FFFFFF', borderBottom: '1px solid #E0E4EA' }}>
        <Toolbar variant="dense" sx={{ justifyContent: 'center', position: 'relative' }}>
          <IconButton onClick={() => navigate('/home')} sx={{ position: 'absolute', left: 8, color: '#9CA3AF' }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1A1A2E' }}>我的资料</Typography>
          <Box sx={{ position: 'absolute', right: 24, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
              {user?.phone ? user.phone.slice(0,3) + '******' + user.phone.slice(9) : ''}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} centered sx={{ bgcolor: '#FFF', borderBottom: '1px solid #E0E4EA' }}>
        <Tab icon={<BookmarkIcon />} label={`收藏 (${favorites.length})`} iconPosition="start" />
        <Tab icon={<HistoryIcon />} label={`历史 (${history.length})`} iconPosition="start" />
      </Tabs>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: '#F5F7FA' }}>
        {tab === 0 ? (
          favorites.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8, color: '#9EA8B8' }}>
              <BookmarkIcon sx={{ fontSize: 48, mb: 1 }} />
              <Typography>暂无收藏内容</Typography>
              <Typography variant="caption">在课件创作或课堂互动中点击收藏按钮</Typography>
            </Box>
          ) : (
            favorites.map((f) => (
              <CardItem key={f.id} item={f} isFav
                onRemove={removeFavorite}
                onPreview={handlePreview}
                imageCache={imageCache}
              />
            ))
          )
        ) : (
          history.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8, color: '#9EA8B8' }}>
              <HistoryIcon sx={{ fontSize: 48, mb: 1 }} />
              <Typography>暂无历史记录</Typography>
            </Box>
          ) : (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                <Button size="small" color="error" startIcon={<DeleteSweepIcon />} onClick={clearHistory}>
                  清空历史
                </Button>
              </Box>
              {history.map((h) => {
                const favored = favorites.some(f => f.topic === h.id);
                return (
                  <CardItem key={h.id} item={h} isHistory isFav={false}
                    onPreview={handlePreview}
                    onToggleFav={handleToggleFav}
                    onOpenDiscussion={handleOpenDiscussion}
                    favored={favored}
                    imageCache={imageCache}
                  />
                );
              })}
            </Box>
          )
        )}
      </Box>

      {/* 图片放大预览 */}
      <Dialog
        open={!!preview}
        onClose={() => setPreview(null)}
        maxWidth={false}
        PaperProps={{
          sx: {
            bgcolor: 'rgba(0,0,0,0.92)',
            m: 0, width: '100vw', height: '100vh',
            maxWidth: '100vw', maxHeight: '100vh', borderRadius: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          },
        }}
      >
        {preview && (
          <Box sx={{
            position: 'relative', width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4,
          }}>
            <IconButton onClick={() => setPreview(null)} sx={{
              position: 'absolute', top: 16, right: 16, zIndex: 10,
              color: '#FFF', bgcolor: 'rgba(255,255,255,0.12)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
            }}>
              <CloseIcon />
            </IconButton>
            <Box sx={{
              position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
              zIndex: 10, color: '#FFF', textAlign: 'center',
            }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{preview.label}</Typography>
            </Box>
            <img src={preview.url} alt={preview.label} style={{
              maxWidth: '90vw', maxHeight: '85vh',
              objectFit: 'contain', borderRadius: 8,
              boxShadow: '0 8px 64px rgba(0,0,0,0.5)',
            }} />
          </Box>
        )}
      </Dialog>

      {/* 互动内容查看 Dialog */}
      <Dialog
        open={!!discussionView}
        onClose={() => setDiscussionView(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        {discussionView && (
          <>
            <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label="互动案例" size="small" color="warning" />
              {discussionView.topic}
              <IconButton onClick={() => setDiscussionView(null)} sx={{ ml: 'auto' }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                whiteSpace: 'pre-wrap',
                bgcolor: '#F5F7FA',
                p: 2,
                borderRadius: 1,
                maxHeight: '70vh',
                overflow: 'auto',
                color: '#37474F',
                lineHeight: 1.7,
              }}>
                {discussionView.data ? JSON.stringify(discussionView.data, null, 2) : '(无内容)'}
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
}

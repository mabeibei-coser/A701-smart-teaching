import React, { useRef, useCallback, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Skeleton,
  IconButton,
  Tooltip,
  Fab,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import InboxIcon from '@mui/icons-material/Inbox';
import CardRenderer from './CardRenderer';
import DiscussionRenderer from './DiscussionRenderer';
import html2canvas from 'html2canvas';

/**
 * 右侧输出面板
 * 空状态 / 加载状态 / 卡片渲染 / 讨论案例渲染
 */
export default function OutputPanel({
  activeOutput,
  cardResult,
  discussionResult,
  cardLoading,
  discussionLoading,
  cardStyle,
  cardSize,
  cardOrientation,
}) {
  const contentRef = useRef(null);
  const [copyTip, setCopyTip] = useState(false);

  const isLoading = activeOutput === 'card' ? cardLoading : discussionLoading;
  const hasResult = activeOutput === 'card' ? !!cardResult : !!discussionResult;

  // ===== 复制内容 =====
  const handleCopy = useCallback(async () => {
    try {
      let text = '';
      if (activeOutput === 'card' && cardResult) {
        text = JSON.stringify(cardResult, null, 2);
      } else if (activeOutput === 'discussion' && discussionResult) {
        text = JSON.stringify(discussionResult, null, 2);
      }
      await navigator.clipboard.writeText(text);
      setCopyTip(true);
      setTimeout(() => setCopyTip(false), 2000);
    } catch {
      // 降级方案
      let text = '';
      if (activeOutput === 'card' && cardResult) {
        text = JSON.stringify(cardResult, null, 2);
      } else if (activeOutput === 'discussion' && discussionResult) {
        text = JSON.stringify(discussionResult, null, 2);
      }
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopyTip(true);
      setTimeout(() => setCopyTip(false), 2000);
    }
  }, [activeOutput, cardResult, discussionResult]);

  // ===== 导出PNG =====
  const handleExportPng = useCallback(async () => {
    if (!contentRef.current) return;
    try {
      const isDark = cardStyle === '潮玩科技';
      const canvas = await html2canvas(contentRef.current, {
        backgroundColor: isDark ? '#0F0F1A' : '#FFFFFF',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `teaching-${activeOutput}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('导出PNG失败:', err);
    }
  }, [activeOutput]);

  // ===== 加载骨架屏 =====
  const renderSkeleton = () => (
    <Box sx={{ p: 4, width: '100%' }}>
      <Skeleton variant="text" width="60%" height={40} sx={{ mb: 2 }} />
      <Skeleton variant="rounded" width="100%" height={80} sx={{ mb: 2 }} />
      <Skeleton variant="rounded" width="100%" height={60} sx={{ mb: 2 }} />
      <Skeleton variant="rounded" width="100%" height={60} sx={{ mb: 2 }} />
      <Skeleton variant="rounded" width="80%" height={40} />
    </Box>
  );

  // ===== 空状态 =====
  const renderEmpty = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: 'text.secondary',
        gap: 2,
      }}
    >
      <InboxIcon sx={{ fontSize: 72, color: '#C5CDD8' }} />
      <Typography variant="h6" sx={{ color: '#9EA8B8', fontWeight: 400 }}>
        请在左侧输入主题并点击生成
      </Typography>
      <Typography variant="body2" sx={{ color: '#C5CDD8' }}>
        支持知识卡片和讨论案例两种生成模式
      </Typography>
    </Box>
  );

  return (
    <Box
      sx={{
        flex: 1,
        height: '100%',
        overflowY: 'auto',
        position: 'relative',
        bgcolor: 'background.default',
        p: 3,
      }}
    >
      {/* 浮动操作按钮 */}
      {hasResult && !isLoading && (
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 10,
            display: 'flex',
            gap: 1,
          }}
        >
          <Tooltip title={copyTip ? '已复制！' : '复制内容'} arrow placement="left">
            <Fab
              size="small"
              color="primary"
              onClick={handleCopy}
              sx={{ width: 40, height: 40 }}
            >
              <ContentCopyIcon sx={{ fontSize: 18 }} />
            </Fab>
          </Tooltip>
          <Tooltip title="导出PNG" arrow placement="left">
            <Fab
              size="small"
              color="secondary"
              onClick={handleExportPng}
              sx={{ width: 40, height: 40 }}
            >
              <DownloadIcon sx={{ fontSize: 18 }} />
            </Fab>
          </Tooltip>
        </Box>
      )}

      {/* 内容区域 */}
      <Box
        ref={contentRef}
        sx={{
          maxWidth: cardOrientation === '横版'
            ? (cardSize === 'A5' ? 650 : cardSize === 'A4' ? 960 : 800)
            : (cardSize === 'A5' ? 450 : cardSize === 'A4' ? 700 : 550),
          mx: 'auto',
          mt: 2,
        }}
      >
        {isLoading ? (
          renderSkeleton()
        ) : hasResult ? (
          activeOutput === 'card' ? (
            <CardRenderer data={cardResult} styleType={cardStyle} cardSize={cardSize} />
          ) : (
            <DiscussionRenderer data={discussionResult} />
          )
        ) : (
          renderEmpty()
        )}
      </Box>
    </Box>
  );
}

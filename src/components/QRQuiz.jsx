import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, Divider, Chip } from '@mui/material';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

/**
 * 扫码答题组件
 * 教师输入题目和选项，生成可分享的答题链接（显示二维码占位）
 */
export default function QRQuiz() {
  const [quizTitle, setQuizTitle] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [generated, setGenerated] = useState(false);

  const addQuestion = () => {
    if (!currentQ.trim()) return;
    const validOpts = options.filter(o => o.trim());
    if (validOpts.length < 2) return;
    setQuestions(prev => [...prev, { q: currentQ.trim(), opts: validOpts }]);
    setCurrentQ('');
    setOptions(['', '', '', '']);
  };

  const removeQuestion = (idx) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleGenerate = () => {
    if (questions.length === 0) return;
    setGenerated(true);
  };

  // 构建答题数据 URL（简化版，用 base64 编码）
  const buildQuizUrl = () => {
    const data = { title: quizTitle || '课堂答题', questions };
    const json = JSON.stringify(data);
    const encoded = btoa(unescape(encodeURIComponent(json)));
    // BASE_URL 末尾带斜杠（"/" 或 "/a701/"），直接接 HashRouter 的 #/...
    return `${window.location.origin}${import.meta.env.BASE_URL}#/quiz/${encoded}`;
  };

  return (
    <Paper elevation={0} sx={{ p: 2, bgcolor: '#FFF', border: '1px solid #E0E4EA', borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <QrCode2Icon sx={{ color: '#4A90A4' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>扫码答题</Typography>
      </Box>

      {!generated ? (
        <Box>
          <TextField fullWidth size="small" label="答题标题" value={quizTitle}
            onChange={e => setQuizTitle(e.target.value)} placeholder="如：第三章随堂测验" sx={{ mb: 1.5 }} />

          <TextField fullWidth size="small" label="题目" value={currentQ}
            onChange={e => setCurrentQ(e.target.value)} placeholder="输入题目..." sx={{ mb: 1 }} />

          {options.map((opt, i) => (
            <TextField key={i} fullWidth size="small"
              label={`选项 ${String.fromCharCode(65 + i)}`} value={opt}
              onChange={e => {
                const newOpts = [...options];
                newOpts[i] = e.target.value;
                setOptions(newOpts);
              }}
              placeholder={`选项 ${String.fromCharCode(65 + i)}...`}
              sx={{ mb: 0.5 }}
            />
          ))}

          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={addQuestion}>
              添加题目 ({questions.length})
            </Button>
            <Button size="small" variant="contained" onClick={handleGenerate}
              disabled={questions.length === 0}>
              生成答题
            </Button>
          </Box>

          {/* 已添加题目预览 */}
          {questions.length > 0 && (
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                已添加 {questions.length} 题：
              </Typography>
              {questions.map((q, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  <Chip label={`${i + 1}. ${q.q.slice(0, 15)}${q.q.length > 15 ? '...' : ''}`} size="small"
                    onDelete={() => removeQuestion(i)} deleteIcon={<DeleteIcon />} />
                </Box>
              ))}
            </Box>
          )}
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center' }}>
          {/* QR 码占位 */}
          <Box sx={{
            width: 160, height: 160, mx: 'auto', mb: 2,
            bgcolor: '#F5F7FA', borderRadius: 2, border: '1px dashed #CBD5E0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <QrCode2Icon sx={{ fontSize: 72, color: '#4A90A4', opacity: 0.5 }} />
          </Box>

          <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
            {quizTitle || '课堂答题'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#5A6D7E', display: 'block', mb: 1 }}>
            {questions.length} 道题 · 请学生扫码作答
          </Typography>

          <Typography variant="caption" sx={{
            display: 'block', p: 1, bgcolor: '#F5F7FA', borderRadius: 1,
            wordBreak: 'break-all', fontSize: '0.65rem', color: '#4A90A4',
          }}>
            {buildQuizUrl()}
          </Typography>

          <Button size="small" variant="text" sx={{ mt: 1 }}
            onClick={() => { setGenerated(false); setQuestions([]); setQuizTitle(''); }}>
            重新设置
          </Button>
        </Box>
      )}
    </Paper>
  );
}

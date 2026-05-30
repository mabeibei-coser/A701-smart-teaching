import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, TextField, Button, Typography, Paper, Chip } from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    const p = phone.trim();
    if (!p) { setError('请输入手机号码'); return; }
    if (!/^1[3-9]\d{9}$/.test(p)) { setError('请输入有效的11位手机号码'); return; }
    try {
      await login(p);
      navigate('/home');
    } catch (err) {
      setError(err.message || '登录失败，请重试');
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #E8EDF5 0%, #F5F7FA 100%)',
    }}>
      <Paper elevation={6} sx={{ p: 5, borderRadius: 4, maxWidth: 575, width: '90%', textAlign: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1A1A2E' }}>
            智能课件创作平台2.0
            <Chip label="专业版" size="small" component="span"
              sx={{
                ml: 0.5, verticalAlign: 'super',
                bgcolor: '#4A90A4', color: '#FFF', fontWeight: 700,
                height: 20, fontSize: '0.6rem',
              }} />
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#5A6D7E', mb: 4 }}>
          谨世ATA研究院
        </Typography>

        <Box sx={{ mb: 3 }} />

        <TextField
          fullWidth
          label="手机号码"
          placeholder="请输入手机号码"
          value={phone}
          onChange={(e) => { setPhone(e.target.value); setError(''); }}
          error={!!error}
          helperText={error}
          inputProps={{ maxLength: 11 }}
          sx={{ mb: 3 }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
        />

        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={handleLogin}
          sx={{ py: 1.5, fontSize: '1.05rem', fontWeight: 600, borderRadius: 2 }}
        >
          登 录
        </Button>

        <Typography variant="caption" sx={{ display: 'block', mt: 3, color: '#9CA3AF' }}>
          无需注册，输入手机号即可使用
        </Typography>
      </Paper>
    </Box>
  );
}

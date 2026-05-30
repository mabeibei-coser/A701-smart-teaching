import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{
          height: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          bgcolor: '#F5F7FA', p: 4,
        }}>
          <ErrorOutlineIcon sx={{ fontSize: 64, color: '#E53935', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: '#1A1A2E' }}>
            页面出错了
          </Typography>
          <Typography variant="body2" sx={{ color: '#9EA8B8', mb: 1, textAlign: 'center', maxWidth: 400 }}>
            {this.state.error?.message || '发生未知错误'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#BDBDBD', mb: 3 }}>
            请尝试刷新页面
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            刷新页面
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

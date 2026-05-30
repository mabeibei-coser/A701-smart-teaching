import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Button, Slider } from '@mui/material';
import TimerIcon from '@mui/icons-material/Timer';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';

export default function CountdownTimer() {
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(minutes * 60);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef(null);

  const tick = useCallback(() => {
    setSeconds(prev => {
      if (prev <= 1) {
        clearInterval(intervalRef.current);
        setRunning(false);
        return 0;
      }
      return prev - 1;
    });
  }, []);

  useEffect(() => {
    if (running && !paused) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, paused, tick]);

  const start = () => { setSeconds(minutes * 60); setRunning(true); setPaused(false); };
  const pause = () => setPaused(p => !p);
  const stop = () => { setRunning(false); setPaused(false); setSeconds(minutes * 60); };
  const handleSlider = (_, v) => { if (!running) { setMinutes(v); setSeconds(v * 60); } };

  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  const timeStr = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  const urgency = seconds <= 60 ? '#E53935' : seconds <= 180 ? '#F57C00' : '#4A90A4';

  return (
    <Box sx={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Box sx={{
        bgcolor: '#FFF', borderRadius: 3, p: 4, border: '1px solid #E0E4EA',
        textAlign: 'center', minWidth: 780, minHeight: 400, px: 6,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
        <TimerIcon sx={{ color: urgency }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>倒计时</Typography>
      </Box>

      <Typography sx={{ fontWeight: 800, color: urgency, fontFamily: 'monospace', mb: 1, fontSize: '15rem', lineHeight: 1 }}>
        {timeStr}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
        {!running ? (
          <Button variant="contained" size="small" startIcon={<PlayArrowIcon />} onClick={start}>开始</Button>
        ) : (
          <>
            <Button variant="outlined" size="small" startIcon={paused ? <PlayArrowIcon /> : <PauseIcon />} onClick={pause}>
              {paused ? '继续' : '暂停'}
            </Button>
            <Button variant="outlined" size="small" color="error" startIcon={<StopIcon />} onClick={stop}>重置</Button>
          </>
        )}
      </Box>

      {!running && (
        <Box sx={{ px: 1 }}>
          <Typography variant="caption">时长：{minutes} 分钟</Typography>
          <Slider value={minutes} min={1} max={60} step={1} size="small"
            onChange={handleSlider} />
        </Box>
      )}
      </Box>
    </Box>
  );
}

import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import confetti from 'canvas-confetti';

const AchievementAnimation = ({ achievement }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (show) {
      // Confetti animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Hide after 3 seconds
      const timer = setTimeout(() => {
        setShow(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!show) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1000,
        animation: 'bounce 1s ease-in-out',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 3,
          textAlign: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 2,
        }}
      >
        <Typography variant="h4" color="primary" gutterBottom>
          축하합니다! 🎉
        </Typography>
        <Typography variant="h6">
          {achievement.title}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {achievement.description}
        </Typography>
      </Paper>
    </Box>
  );
};

export default AchievementAnimation; 
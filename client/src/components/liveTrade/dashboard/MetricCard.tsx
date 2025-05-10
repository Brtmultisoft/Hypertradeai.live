import React, { useState, useEffect } from 'react';
import { Box, Typography, Divider } from '@mui/material';

interface MetricCardProps {
  title: string;
  value: string;
  color: 'blue' | 'green' | 'amber' | 'red';
}

const colorStyles = {
  blue: {
    background: 'rgba(59, 130, 246, 0.1)', // bg-blue-500/10
    border: '1px solid rgba(59, 130, 246, 0.3)', // border-blue-500/30
    text: '#3b82f6', // text-blue-400
  },
  green: {
    background: 'rgba(34, 197, 94, 0.1)', // bg-green-500/10
    border: '1px solid rgba(34, 197, 94, 0.3)', // border-green-500/30
    text: '#10b981', // text-green-400
  },
  amber: {
    background: 'rgba(234, 179, 8, 0.1)', // bg-amber-500/10
    border: '1px solid rgba(234, 179, 8, 0.3)', // border-amber-500/30
    text: '#f59e0b', // text-amber-400
  },
  red: {
    background: 'rgba(239, 68, 68, 0.1)', // bg-red-500/10
    border: '1px solid rgba(239, 68, 68, 0.3)', // border-red-500/30
    text: '#ef4444', // text-red-400
  }
};

const MetricCard: React.FC<MetricCardProps> = ({ title, value, color }) => {
  const [prevValue, setPrevValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    if (value !== prevValue) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setPrevValue(value);
        setIsAnimating(false);
      }, 800); // Slower animation duration
      return () => clearTimeout(timer);
    }
  }, [value, prevValue]);
  
  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 2,
        padding: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colorStyles[color].background,
        border: colorStyles[color].border,
        color: colorStyles[color].text,
      }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {title}
      </Typography>

      <Box sx={{ height: 40, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isAnimating ? (
          <>
            <Typography
              sx={{
                position: 'absolute',
                fontSize: '1.25rem',
                fontWeight: 'bold',
                opacity: 0,
                transform: 'translateY(4px)',
                transition: 'all 0.8s ease-out',
              }}
            >
              {prevValue}
            </Typography>
            <Typography
              sx={{
                position: 'absolute',
                fontSize: '1.25rem',
                fontWeight: 'bold',
                animation: 'fadeDown 0.8s',
              }}
            >
              {value}
            </Typography>
          </>
        ) : (
          <Typography sx={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{value}</Typography>
        )}
      </Box>

      {/* Animated bottom bar */}
      <Divider
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: 2,
          opacity: 0.7,
          animation: 'pulse 1s infinite',
          backgroundColor: colorStyles[color].text,
        }}
      />
    </Box>
  );
};

export default MetricCard;

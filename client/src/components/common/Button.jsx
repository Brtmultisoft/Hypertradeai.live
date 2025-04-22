import { Button as MuiButton, CircularProgress, useTheme } from '@mui/material';

const Button = ({
  children,
  variant = 'contained',
  color = 'primary',
  size = 'medium',
  fullWidth = false,
  startIcon,
  endIcon,
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  sx = {},
  ...props
}) => {
  const theme = useTheme();

  return (
    <MuiButton
      variant={variant}
      color={color}
      size={size}
      fullWidth={fullWidth}
      startIcon={loading ? null : startIcon}
      endIcon={loading ? null : endIcon}
      disabled={disabled || loading}
      onClick={onClick}
      type={type}
      sx={{
        position: 'relative',
        fontWeight: 600,
        borderRadius: 1,
        textTransform: 'none',
        ...sx,
      }}
      {...props}
    >
      {loading && (
        <CircularProgress
          size={24}
          sx={{
            position: 'absolute',
            color: theme.palette[color]?.contrastText || 'inherit',
          }}
        />
      )}
      <span style={{ visibility: loading ? 'hidden' : 'visible' }}>
        {children}
      </span>
    </MuiButton>
  );
};

export default Button;

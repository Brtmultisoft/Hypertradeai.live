import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  useTheme,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import Button from './Button';

const Modal = ({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'sm',
  fullWidth = true,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  confirmLoading = false,
  confirmDisabled = false,
  confirmColor = 'primary',
  hideActions = false,
  hideCloseButton = false,
}) => {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      PaperProps={{
        sx: {
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper,
        },
      }}
    >
      {/* Title */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h6" component="h2" fontWeight="bold">
          {title}
        </Typography>
        {!hideCloseButton && (
          <IconButton
            aria-label="close"
            onClick={onClose}
            size="small"
            sx={{
              color: theme.palette.text.secondary,
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ p: 3 }}>
        <Box>{children}</Box>
      </DialogContent>

      {/* Actions */}
      {!hideActions && (
        <DialogActions
          sx={{
            p: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          {actions ? (
            actions
          ) : (
            <>
              <Button variant="outlined" onClick={onClose}>
                {cancelText}
              </Button>
              <Button
                variant="contained"
                color={confirmColor}
                onClick={onConfirm}
                loading={confirmLoading}
                disabled={confirmDisabled}
              >
                {confirmText}
              </Button>
            </>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
};

export default Modal;

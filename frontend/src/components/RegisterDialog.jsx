import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Alert,
  useTheme,
  Typography,
  Box
} from '@mui/material';
import axios from 'axios';

const RegisterDialog = ({ open, onClose }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const mode = theme.palette.mode;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!username || !password || !confirmPassword || !inviteCode) {
      setError(t('allFieldsRequired'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await axios.post('/api/auth/register', {
        username,
        password,
        inviteCode
      });
      
      localStorage.setItem('token', response.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      onClose(true); // Pass true to indicate successful registration
      navigate('/generate');
    } catch (err) {
      setError(t('registrationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => onClose(false)}
      keepMounted
      PaperProps={{
        sx: {
          background: mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(12px)',
          borderRadius: 3,
          border: mode === 'dark' ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid rgba(148, 163, 184, 0.2)',
          maxWidth: 400,
          width: '100%'
        }
      }}
    >
      <DialogTitle component="div">
        <Typography
          variant="h6"
          sx={{
            textAlign: 'center',
            background: 'linear-gradient(135deg, #6366f1 0%, #10b981 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          {t('register')}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <form onSubmit={handleRegister}>
          <TextField
            fullWidth
            label={t('username')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            margin="normal"
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                background: mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(12px)'
              }
            }}
          />
          <TextField
            fullWidth
            type="password"
            label={t('password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                background: mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(12px)'
              }
            }}
          />
          <TextField
            fullWidth
            type="password"
            label={t('confirmPassword')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            margin="normal"
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                background: mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(12px)'
              }
            }}
          />
          <TextField
            fullWidth
            label={t('inviteCode')}
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            margin="normal"
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                background: mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(12px)'
              }
            }}
          />
          {error && (
            <Alert
              severity="error"
              sx={{
                mt: 2,
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#fca5a5'
              }}
            >
              {error}
            </Alert>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              mt: 3,
              background: 'linear-gradient(135deg, #6366f1 0%, #10b981 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4f46e5 0%, #059669 100%)'
              }
            }}
          >
            {loading ? t('registering') : t('register')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterDialog;
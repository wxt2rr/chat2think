import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, IconButton, Box, useTheme, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import TranslateIcon from '@mui/icons-material/Translate';
import axios from 'axios';
import LoginDialog from './LoginDialog';
import RegisterDialog from './RegisterDialog';

const Navbar = ({ toggleTheme }) => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get('/api/users/info')
        .then(response => {
          setUserInfo(response.data);
        })
        .catch(() => {
          setUserInfo(null);
        });
    }
  }, []);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'zh' : 'en';
    i18n.changeLanguage(newLang);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUserInfo(null);
    navigate('/generate');
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        background: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: theme.palette.mode === 'dark' ? '1px solid rgba(99, 102, 241, 0.1)' : '1px solid rgba(148, 163, 184, 0.1)',
        boxShadow: theme.palette.mode === 'dark' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
      }}
    >
      <Toolbar sx={{ justifyContent: 'flex-end' }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {!userInfo ? (
            <>
              <Button
                onClick={() => setLoginOpen(true)}
                sx={{
                  color: theme.palette.mode === 'dark' ? '#f8fafc' : '#1e293b',
                  '&:hover': {
                    background: 'rgba(99, 102, 241, 0.1)',
                    color: '#6366f1'
                  }
                }}
              >
                {t('login')}
              </Button>
              <Button
                onClick={() => setRegisterOpen(true)}
                sx={{
                  color: theme.palette.mode === 'dark' ? '#f8fafc' : '#1e293b',
                  '&:hover': {
                    background: 'rgba(99, 102, 241, 0.1)',
                    color: '#6366f1'
                  }
                }}
              >
                {t('register')}
              </Button>
              <LoginDialog
                open={loginOpen}
                onClose={(success) => {
                  if (success) {
                    window.location.reload();
                  } else {
                    setLoginOpen(false);
                  }
                }}
                setRegisterOpen={setRegisterOpen}
              />
              <RegisterDialog
                open={registerOpen}
                onClose={(success) => {
                  if (success) {
                    window.location.reload();
                  } else {
                    setRegisterOpen(false);
                  }
                }}
              />
            </>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                component="div"
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: '#6366f1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}
              >
                {userInfo?.username?.charAt(0)}
              </Box>
              <Button
                onClick={handleLogout}
                sx={{
                  color: theme.palette.mode === 'dark' ? '#f8fafc' : '#1e293b',
                  '&:hover': {
                    background: 'rgba(99, 102, 241, 0.1)',
                    color: '#6366f1'
                  }
                }}
              >
                {t('logout')}
              </Button>
            </Box>
          )}
          <IconButton
            onClick={toggleLanguage}
            sx={{
              color: theme.palette.mode === 'dark' ? '#f8fafc' : '#1e293b',
              '&:hover': {
                background: 'rgba(99, 102, 241, 0.1)',
                color: '#6366f1'
              }
            }}
          >
            <TranslateIcon />
          </IconButton>
          <IconButton
            onClick={toggleTheme}
            sx={{
              color: theme.palette.mode === 'dark' ? '#f8fafc' : '#1e293b',
              '&:hover': {
                background: 'rgba(99, 102, 241, 0.1)',
                color: '#6366f1'
              }
            }}
          >
            {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
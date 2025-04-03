import React, { useState, useMemo, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, Container, createTheme, ThemeProvider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import './i18n/config';
import ImageGeneration from './components/ImageGeneration';
import Navbar from './components/Navbar';
import axios from 'axios';

const App = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState('light');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
      
      // 获取用户信息
      axios.get('/api/users/info')
        .then(response => {
          setUserInfo(response.data);
        })
        .catch(error => {
          if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            setIsAuthenticated(false);
            setUserInfo(null);
          }
        });
    }
  }, []);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#ec4899',
          },
          secondary: {
            main: '#f472b6',
          },
          background: {
            default: mode === 'dark' ? '#0f172a' : '#ffffff',
            paper: mode === 'dark' ? '#1e293b' : '#ffffff',
          },
          text: {
            primary: mode === 'dark' ? '#f8fafc' : '#000000',
            secondary: mode === 'dark' ? '#94a3b8' : '#000000',
          },
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                background: mode === 'dark'
                  ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
                  : '#ffffff',
                minHeight: '100vh',
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                background: mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : '#ffffff',
                backdropFilter: 'blur(12px)',
                borderRadius: 16,
                boxShadow: mode === 'dark'
                  ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                border: mode === 'dark'
                  ? '1px solid rgba(236, 72, 153, 0.1)'
                  : '1px solid #000000',
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                textTransform: 'none',
                fontWeight: 600,
              },
            },
          },
        },
      }),
    [mode]
  );

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Navbar toggleTheme={toggleTheme} />
        <Container sx={{ pt: 8 }}>
          <Routes>
            <Route path="/" element={<Navigate to="/generate" />} />
            <Route path="/generate" element={<ImageGeneration />} />
          </Routes>
        </Container>
      </Router>
    </ThemeProvider>
  );
};

export default App;
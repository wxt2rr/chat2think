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
  const [mode, setMode] = useState('dark');
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
            main: '#6366f1',
          },
          secondary: {
            main: '#10b981',
          },
          background: {
            default: mode === 'dark' ? '#0f172a' : '#f8fafc',
            paper: mode === 'dark' ? '#1e293b' : '#ffffff',
          },
          text: {
            primary: mode === 'dark' ? '#f8fafc' : '#1e293b',
            secondary: mode === 'dark' ? '#94a3b8' : '#64748b',
          },
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                background: mode === 'dark'
                  ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
                  : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                minHeight: '100vh',
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                background: mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(12px)',
                borderRadius: 16,
                boxShadow: mode === 'dark'
                  ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                border: mode === 'dark'
                  ? '1px solid rgba(99, 102, 241, 0.1)'
                  : '1px solid rgba(148, 163, 184, 0.1)',
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
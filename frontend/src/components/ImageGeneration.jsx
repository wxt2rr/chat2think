import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Card,
  CardMedia,
  CardActions,
  LinearProgress
} from '@mui/material';
import axios from 'axios';
import LoginDialog from './LoginDialog';

const ImageGeneration = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const mode = theme.palette.mode;
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('realistic');
  const [size, setSize] = useState('1024x1024');
  const [sourceImage, setSourceImage] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [generatedImage, setGeneratedImage] = useState(null);
  const [generationId, setGenerationId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loginOpen, setLoginOpen] = useState(false);

  const styles = [
    { value: 'realistic', label: t('realistic') },
    { value: 'anime', label: t('anime') },
    { value: 'artistic', label: t('artistic') }
  ];

  const sizes = [
    { value: '1024x1024', label: '1024x1024' },
    { value: '512x512', label: '512x512' },
    { value: '256x256', label: '256x256' }
  ];

  const handleImageUpload = (event) => {
    setSourceImage(event.target.files[0]);
  };

  useEffect(() => {
    if (generationId) {
      const socket = new SockJS('/ws');
      const stompClient = Stomp.over(socket);

      stompClient.connect({}, () => {
        stompClient.subscribe(`/topic/generation/${generationId}`, async (message) => {
          const data = JSON.parse(message.body);
          setProgress(data.progress);
          
          if (data.progress === 100) {
            setGenerating(false);
            const response = await axios.get(`/api/images/status/${generationId}`);
            setGeneratedImage(response.data.resultImagePath);
          } else if (data.progress === -1) {
            setGenerating(false);
            setError(data.message || t('error'));
          }
        });
      });

      return () => {
        if (stompClient.connected) {
          stompClient.disconnect();
        }
      };
    }
  }, [generationId]);

  const checkGenerationStatus = async (id) => {
    try {
      const response = await axios.get(`/api/images/status/${id}`);
      if (response.data.status === 'COMPLETED') {
        setGenerating(false);
        setProgress(100);
        setGeneratedImage(response.data.resultImagePath);
      } else if (response.data.status === 'FAILED') {
        setGenerating(false);
        setProgress(0);
        setError(response.data.errorMessage || t('error'));
      }
    } catch (err) {
      setGenerating(false);
      if (err.response && err.response.status === 403) {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setLoginOpen(true);
      } else {
        setError(t('error'));
      }
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError(t('promptRequired'));
      return;
    }
    try {
      setGenerating(true);
      setError('');
      setGeneratedImage(null);
      setProgress(0);

      const formData = new FormData();
      formData.append('modelName', 'stable-diffusion');
      formData.append('prompt', prompt.trim());
      formData.append('style', style);
      formData.append('size', size);
      if (sourceImage) {
        formData.append('sourceImage', sourceImage);
      }

      const response = await axios.post('/api/images/generate', formData);
      if (response.data.url) {
        setGenerating(false);
        setProgress(100);
        setGeneratedImage(response.data.url);
      } else {
        setGenerationId(response.data.generationId);
        checkGenerationStatus(response.data.generationId);
      }
    } catch (err) {
      setGenerating(false);
      if (err.response && err.response.status === 403) {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setLoginOpen(true);
      } else {
        setError(t('error'));
      }
    }
  };

  const handleCancel = async () => {
    if (generationId) {
      try {
        await axios.delete(`/api/images/cancel/${generationId}`);
        setGenerating(false);
      } catch (err) {
        setError(t('error'));
      }
    }
  };

  const handleDownload = async () => {
    if (generatedImage) {
      try {
        const response = await axios.get(`${generatedImage}`, {
          responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'generated-image.png');
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (err) {
        setError(t('error'));
      }
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 4, position: 'relative' }}>
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.1) 0%, rgba(0, 0, 0, 0) 70%)',
        pointerEvents: 'none',
        zIndex: -1
      }} />
      <Box sx={{
        textAlign: 'center',
        mb: 4,
        '& h1': {
          fontSize: '2.5rem',
          background: 'linear-gradient(135deg, #6366f1 0%, #10b981 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 2
        }
      }}>
        <h1>{t('welcome')}</h1>
        <Alert severity="info" sx={{
          background: mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(241, 245, 249, 0.8)',
          backdropFilter: 'blur(12px)',
          borderRadius: 2,
          border: mode === 'dark' ? '1px solid rgba(99, 102, 241, 0.1)' : '1px solid rgba(148, 163, 184, 0.2)',
          color: mode === 'dark' ? '#94a3b8' : '#475569'
        }}>
          {t('imageDescription')}
        </Alert>
      </Box>
      <TextField
        fullWidth
        multiline
        rows={3}
        label={t('prompt')}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        margin="normal"
        placeholder={t('promptPlaceholder')}
        sx={{
          '& .MuiOutlinedInput-root': {
            background: mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(16px)',
            borderRadius: 3,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
              '& > fieldset': {
                borderColor: mode === 'dark' ? 'rgba(99, 102, 241, 0.6)' : 'rgba(99, 102, 241, 0.7)',
                borderWidth: '2px'
              }
            },
            '&.Mui-focused': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)',
              '& > fieldset': {
                borderColor: '#6366f1',
                borderWidth: '2px'
              }
            }
          },
          '& .MuiOutlinedInput-input': {
            fontSize: '1.1rem',
            lineHeight: 1.6
          },
          '& .MuiInputLabel-root': {
            fontSize: '1.1rem',
            '&.Mui-focused': {
              color: '#6366f1'
            }
          }
        }}
      />
      <FormControl fullWidth margin="normal">
        <InputLabel sx={{
          color: 'text.secondary',
          fontSize: '1.1rem',
          '&.Mui-focused': {
            color: '#6366f1'
          }
        }}>{t('style')}</InputLabel>
        <Select
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          sx={{
            background: mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(16px)',
            borderRadius: 3,
            transition: 'all 0.3s ease',
            '& .MuiSelect-select': {
              fontSize: '1.1rem',
              py: 1.5
            },
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
            },
            '&.Mui-focused': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)'
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: mode === 'dark' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.4)'
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: mode === 'dark' ? 'rgba(99, 102, 241, 0.6)' : 'rgba(99, 102, 241, 0.7)',
              borderWidth: '2px'
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#6366f1',
              borderWidth: '2px'
            }
          }}
        >
          {styles.map((item) => (
            <MenuItem
              key={item.value}
              value={item.value}
              sx={{
                '&:hover': {
                  background: 'rgba(99, 102, 241, 0.1)'
                },
                '&.Mui-selected': {
                  background: 'rgba(99, 102, 241, 0.2) !important'
                }
              }}
            >
              {item.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth margin="normal">
        <InputLabel sx={{
          color: 'text.secondary',
          fontSize: '1.1rem',
          '&.Mui-focused': {
            color: '#6366f1'
          }
        }}>{t('size')}</InputLabel>
        <Select
          value={size}
          onChange={(e) => setSize(e.target.value)}
          sx={{
            background: mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(16px)',
            borderRadius: 3,
            transition: 'all 0.3s ease',
            '& .MuiSelect-select': {
              fontSize: '1.1rem',
              py: 1.5
            },
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
            },
            '&.Mui-focused': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)'
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: mode === 'dark' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.4)'
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: mode === 'dark' ? 'rgba(99, 102, 241, 0.6)' : 'rgba(99, 102, 241, 0.7)',
              borderWidth: '2px'
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#6366f1',
              borderWidth: '2px'
            }
          }}
        >
          {sizes.map((item) => (
            <MenuItem
              key={item.value}
              value={item.value}
              sx={{
                '&:hover': {
                  background: 'rgba(99, 102, 241, 0.1)'
                },
                '&.Mui-selected': {
                  background: 'rgba(99, 102, 241, 0.2) !important'
                }
              }}
            >
              {item.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
<Card sx={{
        mt: 4,
        background: mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(16px)',
        borderRadius: 3,
        overflow: 'hidden',
        border: mode === 'dark' ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid rgba(148, 163, 184, 0.2)',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(99, 102, 241, 0.15)'
        }
      }}>
        <Box sx={{ p: 3 }}>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
            id="image-upload"
          />
          <label htmlFor="image-upload">
            <Box
              sx={{
                width: '100%',
                height: 160,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed rgba(99, 102, 241, 0.4)',
                borderRadius: 3,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: mode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : 'rgba(255, 255, 255, 0.6)',
                '&:hover': {
                  border: '2px dashed rgba(99, 102, 241, 0.8)',
                  background: mode === 'dark' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
                  transform: 'scale(1.02)'
                }
              }}
            >
              <Box
                component="img"
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/%3E%3Cpolyline points='17 8 12 3 7 8'/%3E%3Cline x1='12' y1='3' x2='12' y2='15'/%3E%3C/svg%3E"
                sx={{ width: 48, height: 48, mb: 2, opacity: 0.8 }}
              />
              <Box sx={{ color: '#94a3b8', fontSize: '1.1rem', mb: 1 }}>
                {sourceImage ? sourceImage.name : t('upload')}
              </Box>
              <Box sx={{ color: '#64748b', fontSize: '0.9rem' }}>
                {t('supportedFormats')}
              </Box>
            </Box>
          </label>
        </Box>
      </Card>
      <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
        {generating && (
          <Box sx={{ width: '100%', mb: 3 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: mode === 'dark' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  background: 'linear-gradient(135deg, #6366f1 0%, #10b981 100%)',
                  transition: 'transform 0.4s ease'
                }
              }}
            />
          </Box>
        )}

        <Button
          variant="contained"
          onClick={handleGenerate}
          disabled={!prompt || generating}
          startIcon={generating ? <CircularProgress size={20} /> : null}
          sx={{
            background: 'linear-gradient(135deg, #6366f1 0%, #10b981 100%)',
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
            transition: 'all 0.3s ease',
            transform: 'translateY(0)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4f46e5 0%, #059669 100%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
            },
            '&:active': {
              transform: 'translateY(0)'
            }
          }}
        >
          {generating ? t('generating') : t('generate')}
        </Button>
        {generating && (
          <Button
            variant="outlined"
            color="error"
            onClick={handleCancel}
            sx={{
              borderColor: 'rgba(239, 68, 68, 0.5)',
              '&:hover': {
                borderColor: 'rgba(239, 68, 68, 0.8)',
                background: 'rgba(239, 68, 68, 0.1)'
              }
            }}
          >
            {t('cancel')}
          </Button>
        )}
        {generatedImage && (
          <Button
            variant="outlined"
            onClick={handleDownload}
            sx={{
              borderColor: 'rgba(99, 102, 241, 0.5)',
              '&:hover': {
                borderColor: 'rgba(99, 102, 241, 0.8)',
                background: 'rgba(99, 102, 241, 0.1)'
              }
            }}
          >
            {t('download')}
          </Button>
        )}
      </Box>
      {error && (
        <Alert
          severity="error"
          sx={{
            mt: 4,
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#fca5a5',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            '& .MuiAlert-icon': {
              color: '#ef4444'
            }
          }}
        >
          {error}
        </Alert>
      )}
      <LoginDialog
        open={loginOpen}
        onClose={(success) => {
          setLoginOpen(false);
          if (success) {
            handleGenerate();
          }
        }}
      />
      {generatedImage && (
        <Card
          sx={{
            mt: 6,
            background: mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
            borderRadius: 3,
            overflow: 'hidden',
            border: mode === 'dark' ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid rgba(148, 163, 184, 0.2)',
            boxShadow: mode === 'dark' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'scale(1.02)',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.15)'
            }
          }}
        >
          <CardMedia
            component="img"
            image={`${generatedImage}`}
            alt="Generated image"
            sx={{
              width: '100%',
              height: 'auto',
              maxHeight: '600px',
              objectFit: 'contain'
            }}
          />
          <CardActions sx={{ justifyContent: 'center', p: 2 }}>
            <Button
              onClick={handleDownload}
              variant="contained"
              sx={{
                minWidth: 160,
                background: 'linear-gradient(135deg, #6366f1 0%, #10b981 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4f46e5 0%, #059669 100%)'
                }
              }}
            >
              {t('download')}
            </Button>
          </CardActions>
        </Card>
      )}
    </Box>
  );
};

export default ImageGeneration;
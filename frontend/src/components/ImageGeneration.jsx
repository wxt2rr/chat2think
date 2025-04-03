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
  LinearProgress,
  Typography,
  Chip,
  Popover
} from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import ImageIcon from '@mui/icons-material/Image';
import PaletteIcon from '@mui/icons-material/Palette';
import AspectRatioIcon from '@mui/icons-material/AspectRatio';
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
  const [styleAnchorEl, setStyleAnchorEl] = useState(null);
  
  const handleStyleClick = (event) => {
    setStyleAnchorEl(event.currentTarget);
  };

  const handleStyleClose = () => {
    setStyleAnchorEl(null);
  };

  const stylePopoverOpen = Boolean(styleAnchorEl);

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
        mb: 5,
        '& h1': {
          fontSize: '2.2rem',
          color: '#6366f1',
          mb: 1,
          fontWeight: 600
        },
        '& h2': {
          fontSize: '1.8rem',
          color: mode === 'dark' ? '#a5b4fc' : '#818cf8',
          mb: 2,
          fontWeight: 500
        }
      }}>
        <h1>{t('welcome')}</h1>
        <h2>{t('unleashCreativity', '释放无限创意')}</h2>
        <Typography variant="body1" sx={{ 
          color: mode === 'dark' ? '#94a3b8' : '#475569',
          mb: 3,
          fontSize: '1rem'
        }}>
          {t('freeGenerator', '免费、快速、无限制的AI图像生成器')}
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 2,
          flexWrap: 'wrap',
          mb: 3
        }}>
          <Chip 
            label={t('bestImageQuality', '最好的图像质量')} 
            sx={{ 
              bgcolor: mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(241, 245, 249, 0.8)',
              color: mode === 'dark' ? '#94a3b8' : '#475569',
              borderRadius: '16px',
              px: 1
            }} 
          />
          <Chip 
            label={t('simpleDesign', '简单的操作设计')} 
            sx={{ 
              bgcolor: mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(241, 245, 249, 0.8)',
              color: mode === 'dark' ? '#94a3b8' : '#475569',
              borderRadius: '16px',
              px: 1
            }} 
          />
          <Chip 
            label={t('unlimitedCreation', '无限制创作')} 
            sx={{ 
              bgcolor: mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(241, 245, 249, 0.8)',
              color: mode === 'dark' ? '#94a3b8' : '#475569',
              borderRadius: '16px',
              px: 1
            }} 
          />
          <Chip 
            label={t('professionalTech', '专业的生成技术')} 
            sx={{ 
              bgcolor: mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(241, 245, 249, 0.8)',
              color: mode === 'dark' ? '#94a3b8' : '#475569',
              borderRadius: '16px',
              px: 1
            }} 
          />
        </Box>
      </Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-start', gap: 2 }}>
        <Chip 
          label={t('customPrompt', '客制提示')} 
          icon={<Box component="span" sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: '#6366f1', mr: 0.5 }} />}
          sx={{ 
            bgcolor: mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(241, 245, 249, 0.8)',
            color: mode === 'dark' ? '#94a3b8' : '#475569',
            borderRadius: '16px',
            px: 1,
            '& .MuiChip-label': { fontWeight: 500 }
          }} 
          clickable
        />
        <Chip 
          label={t('general', 'General')} 
          sx={{ 
            bgcolor: mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(241, 245, 249, 0.8)',
            color: mode === 'dark' ? '#94a3b8' : '#475569',
            borderRadius: '16px',
            px: 1
          }} 
          clickable
        />
      </Box>
      <Box sx={{ display: 'flex', position: 'relative', mb: 4 }}>
        <TextField
          fullWidth
          multiline
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          margin="normal"
          placeholder={t('promptPlaceholder')}
          sx={{
            '& .MuiOutlinedInput-root': {
              background: '#ffffff',
              borderRadius: 2,
              transition: 'all 0.3s ease',
              border: '1px solid #fbcfe8',
              '&:hover': {
                borderColor: '#ec4899',
                '& > fieldset': {
                  borderColor: '#ec4899',
                  borderWidth: '1px'
                }
              },
              '&.Mui-focused': {
                borderColor: '#ec4899',
                '& > fieldset': {
                  borderColor: '#ec4899',
                  borderWidth: '1px'
                }
              }
            },
            '& .MuiOutlinedInput-input': {
              fontSize: '1rem',
              lineHeight: 1.5,
              paddingBottom: '60px' // 增加底部padding以容纳按钮
            },
            '& .MuiInputLabel-root': {
              fontSize: '1rem',
              '&.Mui-focused': {
                color: '#ec4899'
              }
            }
          }}
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
          id="image-upload-button"
        />
        <label htmlFor="image-upload-button" style={{
          position: 'absolute',
          bottom: '15px',
          left: '15px',
          zIndex: 1
        }}>
          <Button
            component="span"
            variant="text"
            size="small"
            startIcon={<ImageIcon fontSize="small" sx={{ color: '#000000' }} />}
            sx={{
              color: '#000000',
              fontSize: '0.85rem',
              padding: '2px 8px',
              minWidth: 'auto',
              '&:hover': {
                background: 'transparent',
                color: '#666666'
              }
            }}
          >
            {t('upload', '参考图')}
          </Button>
        </label>
        {/* 将选择风格和选择尺寸按钮移到参考图右边 */}
        <Box sx={{ position: 'absolute', bottom: '15px', left: '100px', display: 'flex', gap: 2, zIndex: 1 }}>
          <Button
            component="span"
            variant="text"
            size="small"
            onClick={handleStyleClick}
            startIcon={<PaletteIcon fontSize="small" sx={{ color: '#000000' }} />}
            sx={{
              color: '#000000',
              fontSize: '0.85rem',
              padding: '2px 8px',
              minWidth: 'auto',
              '&:hover': {
                background: 'transparent',
                color: '#666666'
              }
            }}
          >
            {t('style')}
          </Button>
          <Button
            component="span"
            variant="text"
            size="small"
            startIcon={<AspectRatioIcon fontSize="small" sx={{ color: '#000000' }} />}
            sx={{
              color: '#000000',
              fontSize: '0.85rem',
              padding: '2px 8px',
              minWidth: 'auto',
              '&:hover': {
                background: 'transparent',
                color: '#666666'
              }
            }}
            onClick={() => {
              const sizeSelect = document.getElementById('size-select');
              if (sizeSelect) {
                sizeSelect.click();
              }
            }}
          >
            {t('size')}
          </Button>
        </Box>
        <Popover
          open={stylePopoverOpen}
          anchorEl={styleAnchorEl}
          onClose={handleStyleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          PaperProps={{
            sx: {
              mt: 1,
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
              border: mode === 'dark' ? '1px solid rgba(236, 72, 153, 0.2)' : '1px solid rgba(244, 114, 182, 0.2)',
            }
          }}
        >
          <Box sx={{ p: 1, width: 150 }}>
            {styles.map((item) => (
              <Button
                key={item.value}
                fullWidth
                onClick={() => {
                  setStyle(item.value);
                  handleStyleClose();
                }}
                sx={{
                  justifyContent: 'flex-start',
                  py: 1,
                  textAlign: 'left',
                  color: style === item.value ? '#ec4899' : (mode === 'dark' ? '#f8fafc' : '#1e293b'),
                  backgroundColor: style === item.value ? (mode === 'dark' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(244, 114, 182, 0.1)') : 'transparent',
                  '&:hover': {
                    backgroundColor: mode === 'dark' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(244, 114, 182, 0.1)'
                  }
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
        </Popover>
      </Box>
      {/* 移除了选择风格和选择尺寸的表单控件 */}
<Box sx={{ mt: 2, mb: 2 }}>
        {sourceImage && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            ml: 2,
            color: '#ec4899',
            fontSize: '0.9rem',
            bgcolor: 'rgba(236, 72, 153, 0.1)',
            px: 2,
            py: 0.5,
            borderRadius: '16px'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
              <polyline points="9 11 12 14 22 4"></polyline>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
            {sourceImage.name}
          </Box>
        )}
      </Box>

      <Card sx={{
        display: 'none',
        mt: 4,
        background: mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(16px)',
        borderRadius: 3,
        overflow: 'hidden',
        border: mode === 'dark' ? '1px solid rgba(236, 72, 153, 0.2)' : '1px solid rgba(244, 114, 182, 0.2)',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(236, 72, 153, 0.15)'
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
                border: '2px dashed rgba(236, 72, 153, 0.4)',
                borderRadius: 3,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: mode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : 'rgba(255, 255, 255, 0.6)',
                '&:hover': {
                  border: '2px dashed rgba(236, 72, 153, 0.8)',
                  background: mode === 'dark' ? 'rgba(236, 72, 153, 0.1)' : 'rgba(244, 114, 182, 0.05)',
                  transform: 'scale(1.02)'
                }
              }}
            >
              <Box
                component="img"
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23ec4899' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/%3E%3Cpolyline points='17 8 12 3 7 8'/%3E%3Cline x1='12' y1='3' x2='12' y2='15'/%3E%3C/svg%3E"
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
      {/* 将进度条保留在原位置 */}
      {generating && (
        <Box sx={{ width: '100%', mb: 3 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: mode === 'dark' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(244, 114, 182, 0.1)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
                transition: 'transform 0.4s ease'
              }
            }}
          />
        </Box>
      )}
      
      {/* 添加清除和开始生成按钮到输入框右下角 */}
      <Box sx={{ 
        position: 'absolute', 
        bottom: '15px',
        right: '15px',
        display: 'flex', 
        gap: 2, 
        zIndex: 2,
        background: 'transparent'
      }}>
        <Button
          variant="contained"
          size="small"
          onClick={() => {
            setPrompt('');
            setSourceImage(null);
            setError('');
            setGeneratedImage(null);
          }}
          sx={{
            background: '#ffffff',
            color: '#000000',
            px: 2,
            py: 0.5,
            fontSize: '0.85rem',
            borderRadius: '8px',
            transition: 'all 0.2s ease',
            border: '1px solid #e2e8f0',
            '&:hover': {
              background: '#f8fafc',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }
          }}
        >
          {t('clear', '清除')}
        </Button>
        
        <Button
          variant="contained"
          size="small"
          onClick={handleGenerate}
          disabled={!prompt || generating}
          startIcon={generating ? <CircularProgress size={16} /> : null}
          sx={{
            background: '#ffffff',
            color: '#000000',
            px: 2,
            py: 0.5,
            fontSize: '0.85rem',
            borderRadius: '8px',
            transition: 'all 0.2s ease',
            border: '1px solid #e2e8f0',
            '&:hover': {
              background: '#f8fafc',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            },
            '&.Mui-disabled': {
              background: '#f1f5f9',
              color: '#94a3b8'
            }
          }}
        >
          {generating ? t('generating') : t('startGenerate', '开始生成')}
        </Button>
      </Box>
      
      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
        id="image-upload-button"
      />
       
      {/* 移除这里的按钮，已经移到输入框右下角 */}
      <Box sx={{ display: 'none', gap: 2, mt: 3, justifyContent: 'center', alignItems: 'center' }}>
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
            mt: 2,
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444'
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
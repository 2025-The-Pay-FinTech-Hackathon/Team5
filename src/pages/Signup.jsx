import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Tabs,
  Tab,
  Alert,
  Link,
} from '@mui/material';
import { addUser, findUserByEmail } from '../utils/localData';

export default function Signup() {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState('parent');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAccountTypeChange = (e, v) => setAccountType(v);
  const handleInputChange = e => setFormData(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleSubmit = e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('모든 항목을 입력해주세요.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (findUserByEmail(formData.email)) {
      setError('이미 존재하는 이메일입니다.');
      return;
    }
    // 회원 정보 저장
    addUser({
      id: Date.now(),
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: accountType,
    });
    setSuccess('회원가입이 완료되었습니다!');
    setTimeout(() => navigate('/'), 1200);
  };

  return (
    <Box sx={{
      display: 'flex',
      minHeight: '100vh',
      width: '100vw',
      overflow: 'hidden',
      background: 'linear-gradient(90deg, #fff 40%, #ffe066 100%)',
    }}>
      {/* 왼쪽(회원가입) 영역 */}
      <Box sx={{
        flex: 4,
        minWidth: 0,
        bgcolor: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        zIndex: 2,
        py: 0,
      }}>
        <Typography variant="h2" fontWeight={900} sx={{ mb: 4, color: '#111', letterSpacing: '-2px', fontSize: 56 }}>
          Dondoli
        </Typography>
        <Paper elevation={12} sx={{
          p: 4,
          borderRadius: 7,
          minWidth: 350,
          maxWidth: 400,
          width: '100%',
          mb: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: '0 12px 48px 0 rgba(0,0,0,0.10)',
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 120px)',
        }}>
          <Tabs
            value={accountType}
            onChange={handleAccountTypeChange}
            variant="fullWidth"
            sx={{
              mb: 2,
              width: '100%',
              '& .MuiTabs-indicator': { backgroundColor: '#FFD600', height: 4, borderRadius: 2 },
            }}
          >
            <Tab label="부모 계정" value="parent"
              sx={{
                fontWeight: 700,
                color: accountType === 'parent' ? '#222' : '#888',
                '&.Mui-selected': { color: '#222' },
                bgcolor: accountType === 'parent' ? '#FFD600' : 'transparent',
                borderRadius: 99,
                mx: 0.5,
                minHeight: 48,
              }} />
            <Tab label="자녀 계정" value="child"
              sx={{
                fontWeight: 700,
                color: accountType === 'child' ? '#222' : '#888',
                '&.Mui-selected': { color: '#222' },
                bgcolor: accountType === 'child' ? '#FFD600' : 'transparent',
                borderRadius: 99,
                mx: 0.5,
                minHeight: 48,
              }} />
          </Tabs>
          {error && (
            <Alert severity="error" sx={{ mb: 1, width: '100%' }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 1, width: '100%' }}>
              {success}
            </Alert>
          )}
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <TextField
              fullWidth
              label="이름"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              margin="dense"
              required
              sx={{ mb: 1.5 }}
              size="small"
            />
            <TextField
              fullWidth
              label="이메일"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              margin="dense"
              required
              sx={{ mb: 1.5 }}
              size="small"
            />
            <TextField
              fullWidth
              label="비밀번호"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              margin="dense"
              required
              sx={{ mb: 1.5 }}
              size="small"
            />
            <TextField
              fullWidth
              label="비밀번호 확인"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              margin="dense"
              required
              sx={{ mb: 2 }}
              size="small"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{
                background: '#FFD600',
                color: '#222',
                fontWeight: 700,
                borderRadius: 99,
                boxShadow: 'none',
                py: 1.2,
                fontSize: 18,
                mb: 1,
                '&:hover': { background: '#FFEA70' },
              }}
            >
              회원가입
            </Button>
          </form>
          <Box sx={{ textAlign: 'center', mt: 0.5, width: '100%', fontSize: 14 }}>
            <Link component="button" onClick={() => navigate('/')} underline="hover" color="inherit" sx={{ fontSize: 14 }}>
              이미 계정이 있으신가요? 로그인
            </Link>
          </Box>
        </Paper>
        <Box
          sx={{
            width: '100%',
            maxWidth: 400,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mt: 1
          }}
        >
          <Link component="button" onClick={() => navigate('/terms')} underline="hover" sx={{ color: '#888', fontSize: 15, fontWeight: 400, mr: 1 }}>
            이용약관
          </Link>
          <span style={{ color: '#bbb', fontWeight: 700, margin: '0 6px' }}>|</span>
          <Link component="button" onClick={() => navigate('/privacy')} underline="hover" sx={{ color: '#222', fontWeight: 700, fontSize: 15 }}>
            개인정보처리방침
          </Link>
        </Box>
      </Box>
      {/* 오른쪽(노란) 영역 */}
      <Box sx={{
        flex: 6,
        minWidth: 0,
        bgcolor: '#FFD600',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
      }}>
        {/* 배경 그라데이션/패턴 */}
        <Box sx={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 60% 40%, #fffde4 0%, #FFD600 80%)',
          opacity: 0.25,
          zIndex: 0
        }} />
        {/* 아이콘 일러스트 */}
        <Box sx={{
          width: 500,
          height: 500,
          borderRadius: 18,
          background: 'rgba(255,255,255,0.13)',
          boxShadow: '0 16px 48px 0 rgba(0,0,0,0.10)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 4,
          position: 'relative',
          zIndex: 1
        }}>
          {/* 카드 */}
          <lord-icon
            src="https://cdn.lordicon.com/yzctygpq.json"
            trigger="loop"
            style={{
              position: 'absolute',
              top: 80,
              left: 80,
              width: 120,
              height: 120,
              opacity: 0.95,
              filter: 'drop-shadow(0 4px 16px #fff7)',
              transform: 'rotate(-10deg) scale(1.1)',
              zIndex: 1
            }}
          />
          {/* 차트 */}
          <lord-icon
            src="https://cdn.lordicon.com/ivayzoru.json"
            trigger="loop"
            style={{
              position: 'absolute',
              top: 160,
              right: 90,
              width: 100,
              height: 100,
              opacity: 0.88,
              filter: 'drop-shadow(0 4px 16px #fff7)',
              transform: 'rotate(8deg) scale(1.05)',
              zIndex: 1
            }}
          />
          {/* 코인 */}
          <lord-icon
            src="https://cdn.lordicon.com/ggihhudh.json"
            trigger="loop"
            style={{
              position: 'absolute',
              bottom: 90,
              left: 140,
              width: 100,
              height: 100,
              opacity: 0.97,
              filter: 'drop-shadow(0 4px 16px #fff7)',
              transform: 'rotate(-6deg) scale(1.08)',
              zIndex: 1
            }}
          />
          {/* 중앙 Glow 원과 ₩ */}
          <Box
            sx={{
              width: 180,
              height: 180,
              borderRadius: '50%',
              background: 'radial-gradient(circle, #FFD600 60%, #fffde4 100%)',
              boxShadow: '0 0 80px 20px #fffde4, 0 8px 32px 0 rgba(0,0,0,0.13)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'absolute',
              top: 160,
              left: 160,
              zIndex: 2
            }}
          >
            <Typography variant="h1" fontWeight={900} sx={{ color: '#fff', opacity: 0.97, textShadow: '0 2px 16px #FFD600' }}>
              ₩
            </Typography>
          </Box>
        </Box>
        {/* 오른쪽 하단 앱명/설명 */}
        <Box sx={{
          position: 'absolute',
          right: 80,
          bottom: 80,
          textAlign: 'right',
          zIndex: 2
        }}>
          <Typography variant="h3" fontWeight={900} sx={{ color: '#fff', mb: 0.5, textShadow: '0 4px 24px #FFD600' }}>
            Dondoli
          </Typography>
          <Typography variant="h6" sx={{ color: '#fff', opacity: 0.97, fontWeight: 600, textShadow: '0 2px 8px #FFD600' }}>
            부모-자녀 금융 교육
          </Typography>
        </Box>
      </Box>
    </Box>
  );
} 
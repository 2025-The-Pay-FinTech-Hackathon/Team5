import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Link,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import {
  findUserByEmail,
  syncChildFromBackend,
  syncChildrenFromBackend,
  updateUser,
} from '../utils/localData';
import { apiRequest, isNetworkError } from '../services/api';

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState('parent');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAccountTypeChange = (event, newValue) => setAccountType(newValue);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const completeLogin = async (user) => {
    await onLogin(user);
    navigate(user.role === 'parent' ? '/parent' : '/child', { replace: true });
  };

  const syncBackendLogin = async (data) => {
    const loggedInUser = data.user || data;
    updateUser(loggedInUser);

    if (data.child) {
      syncChildFromBackend(data.child);
    }

    if (loggedInUser.role === 'parent') {
      const children = await apiRequest(`/api/children/parent/${loggedInUser.id}`);
      syncChildrenFromBackend(children);
    }

    return loggedInUser;
  };

  const loginWithLocalData = async () => {
    const user = findUserByEmail(formData.email);

    if (!user) {
      throw new Error('존재하지 않는 이메일입니다.');
    }

    if (user.password !== formData.password) {
      throw new Error('비밀번호가 일치하지 않습니다.');
    }

    if (user.role !== accountType) {
      throw new Error(accountType === 'parent' ? '부모 계정이 아닙니다.' : '자녀 계정이 아닙니다.');
    }

    if (accountType === 'child' && !user.parentId) {
      throw new Error('이 자녀 계정은 아직 부모 계정과 연결되어 있지 않습니다.');
    }

    await completeLogin(user);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('이메일과 비밀번호를 모두 입력해 주세요.');
      return;
    }

    setSubmitting(true);

    try {
      const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: accountType,
        }),
      });

      const loggedInUser = await syncBackendLogin(data);
      await completeLogin(loggedInUser);
    } catch (apiError) {
      if (!isNetworkError(apiError)) {
        setError(apiError.message);
        setSubmitting(false);
        return;
      }

      try {
        await loginWithLocalData();
      } catch (localError) {
        setError(localError.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        width: '100vw',
        overflow: 'hidden',
        bgcolor: '#fff8d8',
      }}
    >
      <Box
        sx={{
          flex: { xs: '1 1 100%', md: '0 0 42%' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          px: 3,
          py: 6,
        }}
      >
        <Typography variant="h2" fontWeight={900} sx={{ mb: 4, color: '#111', fontSize: { xs: 44, md: 56 } }}>
          Dondoli
        </Typography>

        <Paper
          elevation={12}
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: 3,
            width: '100%',
            maxWidth: 420,
            boxShadow: '0 12px 48px rgba(0,0,0,0.12)',
          }}
        >
          <Tabs
            value={accountType}
            onChange={handleAccountTypeChange}
            variant="fullWidth"
            sx={{
              mb: 3,
              '& .MuiTabs-indicator': { backgroundColor: '#FFD600', height: 4, borderRadius: 2 },
            }}
          >
            <Tab label="부모 계정" value="parent" />
            <Tab label="자녀 계정" value="child" />
          </Tabs>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="이메일"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="비밀번호"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              margin="normal"
              required
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={submitting}
              sx={{
                bgcolor: '#FFD600',
                color: '#222',
                fontWeight: 800,
                borderRadius: 2,
                boxShadow: 'none',
                py: 1.4,
                '&:hover': { bgcolor: '#FFEA70' },
              }}
            >
              {submitting ? '로그인 중...' : '로그인'}
            </Button>
          </form>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Link component="button" onClick={() => navigate('/signup')} color="inherit" sx={{ fontSize: 14 }}>
              계정이 없나요? 회원가입
            </Link>
          </Box>
        </Paper>
      </Box>

      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: '1 1 auto',
          bgcolor: '#FFD600',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ maxWidth: 520, textAlign: 'center', zIndex: 1 }}>
          <Box
            component="img"
            src="/ryan-coin.png"
            alt="Dondoli coin"
            sx={{ width: 300, maxWidth: '70%', mb: 4, filter: 'drop-shadow(0 18px 28px rgba(0,0,0,0.18))' }}
          />
          <Typography variant="h3" fontWeight={900} sx={{ color: '#111', mb: 1 }}>
            가족이 함께 배우는 금융 습관
          </Typography>
          <Typography variant="h6" sx={{ color: '#333', fontWeight: 600 }}>
            용돈, 미션, 저축 목표를 한곳에서 관리하세요.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default Login;

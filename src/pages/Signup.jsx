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
  addChild,
  addUser,
  createChildProfile,
  createId,
  findUserByEmail,
  linkChildToParent,
} from '../utils/localData';
import { apiRequest, isNetworkError } from '../services/api';

export default function Signup() {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState('parent');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    parentEmail: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAccountTypeChange = (event, value) => {
    setAccountType(value);
    setError('');
    setSuccess('');
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      throw new Error('모든 필수 항목을 입력해 주세요.');
    }

    if (accountType === 'child' && !formData.parentEmail) {
      throw new Error('자녀 계정은 연결할 부모 이메일이 필요합니다.');
    }

    if (formData.password !== formData.confirmPassword) {
      throw new Error('비밀번호가 일치하지 않습니다.');
    }
  };

  const saveLocalSignup = () => {
    if (findUserByEmail(formData.email)) {
      throw new Error('이미 존재하는 이메일입니다.');
    }

    if (accountType === 'parent') {
      addUser({
        id: createId(),
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: 'parent',
      });
      return;
    }

    const parent = findUserByEmail(formData.parentEmail);
    if (!parent || parent.role !== 'parent') {
      throw new Error('입력한 부모 이메일의 부모 계정을 찾을 수 없습니다.');
    }

    const childUser = addUser({
      id: createId(),
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: 'child',
      parentId: parent.id,
    });

    addChild(createChildProfile(childUser, parent.id));
  };

  const mirrorBackendSignupToLocal = (data) => {
    const user = data.user;
    if (!user || findUserByEmail(user.email)) return;

    addUser({ ...user, password: formData.password });

    if (user.role === 'child') {
      if (data.child) {
        addChild({ ...data.child, password: formData.password });
      } else {
        linkChildToParent(user.id, user.parentId);
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    try {
      validate();
    } catch (validationError) {
      setError(validationError.message);
      return;
    }

    setSubmitting(true);

    try {
      const data = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: accountType,
          parentEmail: accountType === 'child' ? formData.parentEmail : undefined,
        }),
      });

      mirrorBackendSignupToLocal(data);
    } catch (apiError) {
      if (!isNetworkError(apiError)) {
        setError(apiError.message);
        setSubmitting(false);
        return;
      }

      try {
        saveLocalSignup();
      } catch (localError) {
        setError(localError.message);
        setSubmitting(false);
        return;
      }
    }

    setSuccess('회원가입이 완료되었습니다. 로그인 화면으로 이동합니다.');
    setTimeout(() => navigate('/', { replace: true }), 900);
    setSubmitting(false);
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
            p: { xs: 3, sm: 4 },
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
              mb: 2,
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
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="이름"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              margin="dense"
              required
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
            />
            {accountType === 'child' && (
              <TextField
                fullWidth
                label="부모 이메일"
                name="parentEmail"
                type="email"
                value={formData.parentEmail}
                onChange={handleInputChange}
                margin="dense"
                helperText="이미 가입된 부모 계정의 이메일을 입력하면 자동으로 연결됩니다."
                required
              />
            )}
            <TextField
              fullWidth
              label="비밀번호"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              margin="dense"
              required
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
                py: 1.2,
                '&:hover': { bgcolor: '#FFEA70' },
              }}
            >
              {submitting ? '가입 중...' : '회원가입'}
            </Button>
          </form>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Link component="button" onClick={() => navigate('/')} underline="hover" color="inherit" sx={{ fontSize: 14 }}>
              이미 계정이 있나요? 로그인
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
            부모와 자녀를 바로 연결하세요
          </Typography>
          <Typography variant="h6" sx={{ color: '#333', fontWeight: 600 }}>
            자녀 가입 시 부모 이메일을 입력하면 대시보드에서 곧바로 확인할 수 있습니다.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

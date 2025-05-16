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
  Grid,
  Link,
} from '@mui/material';
import { addUser, findUserByEmail } from '../utils/localData';

function Signup() {
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

  const handleAccountTypeChange = (event, newValue) => {
    setAccountType(newValue);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('모든 필드를 입력해주세요.');
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
    setSuccess('회원가입이 완료되었습니다! 로그인 해주세요.');
    setTimeout(() => navigate('/'), 1200);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8F8FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Grid container sx={{ minHeight: { xs: '100vh', md: 600 }, maxWidth: 1100, boxShadow: 3, borderRadius: 5, overflow: 'hidden' }}>
        {/* Left: Signup Form */}
        <Grid item xs={12} md={7} sx={{ bgcolor: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', py: 6, px: { xs: 2, md: 6 } }}>
          <Box sx={{ width: '100%', maxWidth: 360 }}>
            <Typography variant="h3" fontWeight={700} sx={{ mb: 4, color: '#222' }}>
              회원가입
            </Typography>
            <Paper elevation={0} sx={{ p: 4, borderRadius: 3, boxShadow: '0 2px 16px 0 rgba(0,0,0,0.06)' }}>
              <Tabs
                value={accountType}
                onChange={handleAccountTypeChange}
                variant="fullWidth"
                sx={{ mb: 3, '& .MuiTabs-indicator': { backgroundColor: '#FFD600' } }}
              >
                <Tab label="부모 계정" value="parent" sx={{ fontWeight: 700, color: accountType === 'parent' ? '#222' : '#888', '&.Mui-selected': { color: '#222' } }} />
                <Tab label="자녀 계정" value="child" sx={{ fontWeight: 700, color: accountType === 'child' ? '#222' : '#888', '&.Mui-selected': { color: '#222' } }} />
              </Tabs>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
              )}
              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>
              )}
              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="이름"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  margin="normal"
                  required
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="이메일"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  margin="normal"
                  required
                  sx={{ mb: 2 }}
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
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="비밀번호 확인"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
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
                  sx={{
                    background: '#FFD600',
                    color: '#222',
                    fontWeight: 700,
                    borderRadius: 99,
                    boxShadow: 'none',
                    py: 1.5,
                    fontSize: 18,
                    mb: 1.5,
                    '&:hover': { background: '#FFEA70' },
                  }}
                >
                  회원가입
                </Button>
              </form>
              <Box sx={{ textAlign: 'center', mt: 1 }}>
                <Link component="button" underline="hover" color="inherit" onClick={() => navigate('/')} sx={{ fontSize: 14 }}>
                  이미 계정이 있으신가요? 로그인
                </Link>
              </Box>
            </Paper>
            <Box sx={{ mt: 4, textAlign: 'center', color: '#888', fontSize: 13 }}>
              <Link href="#" underline="hover" sx={{ color: '#888', mr: 1 }}>
                이용약관
              </Link>
              |
              <Link href="#" underline="hover" sx={{ color: '#888', ml: 1 }}>
                개인정보처리방침
              </Link>
            </Box>
          </Box>
        </Grid>
        {/* Right: Illustration & Branding */}
        <Grid item xs={12} md={5} sx={{ bgcolor: '#FFD600', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', py: 6 }}>
          <Box sx={{
            width: 220,
            height: 220,
            bgcolor: '#FFEB3B',
            borderRadius: 6,
            mb: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 6
          }}>
            <Typography variant="h1" sx={{ color: '#FFD600', fontWeight: 900, fontSize: 100 }}>
              ₩
            </Typography>
          </Box>
          <Typography variant="h3" fontWeight={700} sx={{ color: '#222', mb: 1 }}>
            Dondoli
          </Typography>
          <Typography variant="h6" sx={{ color: '#222', opacity: 0.8 }}>
            부모-자녀 금융 교육
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Signup; 
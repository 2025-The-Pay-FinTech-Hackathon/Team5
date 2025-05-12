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
    <Box
      sx={{
        minHeight: '100vh',
        minWidth: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F8F8FF',
      }}
    >
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400, mx: 'auto' }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          회원가입
        </Typography>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={accountType} onChange={handleAccountTypeChange} centered>
            <Tab label="부모 계정" value="parent" />
            <Tab label="자녀 계정" value="child" />
          </Tabs>
        </Box>
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
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ mt: 3 }}
          >
            회원가입
          </Button>
        </form>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button color="primary" onClick={() => navigate('/')}>이미 계정이 있으신가요? 로그인</Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default Signup; 
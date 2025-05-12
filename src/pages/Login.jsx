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
import { findUserByEmail } from '../utils/localData';

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState('parent');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleAccountTypeChange = (event, newValue) => setAccountType(newValue);
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!formData.email || !formData.password) {
      setError('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }
    const user = findUserByEmail(formData.email);
    if (!user) {
      setError('존재하지 않는 이메일입니다.');
      return;
    }
    if (user.password !== formData.password) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (accountType === 'parent') {
      if (user.role !== 'parent') {
        setError('부모 계정이 아닙니다.');
        return;
      }
      onLogin(user);
      navigate('/parent');
    } else {
      if (user.role !== 'child') {
        setError('자녀 계정이 아닙니다.');
        return;
      }
      if (!user.parentId) {
        setError('이 자녀 계정은 부모와 연동되어 있지 않습니다.');
        return;
      }
      onLogin(user);
      navigate('/child');
    }
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
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 400,
          mx: 'auto',
        }}
      >
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          MwoniMoney
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" gutterBottom>
          부모-자녀 금융 교육 앱
        </Typography>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={accountType} onChange={handleAccountTypeChange} centered>
            <Tab label="부모 계정" value="parent" />
            <Tab label="자녀 계정" value="child" />
          </Tabs>
        </Box>
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
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ mt: 3 }}
          >
            로그인
          </Button>
        </form>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button color="primary" onClick={() => navigate('/signup')}>
            계정이 없으신가요? 회원가입
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default Login; 
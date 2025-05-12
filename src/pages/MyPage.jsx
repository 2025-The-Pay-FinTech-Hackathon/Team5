import { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
} from '@mui/material';
import { getUsers, saveUsers } from '../utils/localData';
import { useLocation } from 'react-router-dom';

function MyPage({ user, onUserUpdate }) {
  const location = useLocation();
  const [form, setForm] = useState({
    name: user?.name || '',
    password: '',
    confirmPassword: '',
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.name) {
      setError('이름을 입력해주세요.');
      return;
    }
    if (form.password && form.password !== form.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    // Update user in localStorage
    const users = getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx === -1) {
      setError('사용자 정보를 찾을 수 없습니다.');
      return;
    }
    users[idx].name = form.name;
    if (form.password) users[idx].password = form.password;
    saveUsers(users);
    setSuccess('개인정보가 성공적으로 변경되었습니다.');
    onUserUpdate && onUserUpdate({ ...user, name: form.name, password: form.password || user.password });
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          마이페이지
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" gutterBottom>
          개인정보 변경
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="이름"
            name="name"
            value={form.name}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="새 비밀번호"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            margin="normal"
          />
          <TextField
            fullWidth
            label="비밀번호 확인"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            margin="normal"
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ mt: 3 }}
          >
            저장
          </Button>
        </form>
      </Paper>
    </Container>
  );
}

export default MyPage; 
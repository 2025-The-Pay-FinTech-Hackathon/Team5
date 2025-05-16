import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { findChildById, updateChild, getChildrenByParent } from '../utils/localData';
import { useLocation } from 'react-router-dom';

function Wishlist() {
  const location = useLocation();
  const user = JSON.parse(sessionStorage.getItem('user'));
  const isParent = user?.role === 'parent';
  const [child, setChild] = useState(null);
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editIdx, setEditIdx] = useState(-1);
  const [form, setForm] = useState({ name: '', targetAmount: '', memo: '' });
  const [error, setError] = useState('');
  const userId = user?.id;

  // 데이터 불러오기
  useEffect(() => {
    if (isParent) {
      const kids = getChildrenByParent(userId);
      setChildren(kids);
      if (kids.length > 0) setSelectedChildId(kids[0].id);
    } else {
      setChild(findChildById(userId));
    }
  }, [isParent, userId, location.pathname]);

  useEffect(() => {
    if (isParent && selectedChildId) {
      setChild(findChildById(selectedChildId));
    }
  }, [selectedChildId, isParent]);

  const wishlist = child?.wishlist || [];

  // 추가/수정
  const handleSave = () => {
    setError('');
    if (!form.name || !form.targetAmount) {
      setError('이름과 목표 금액을 입력하세요.');
      return;
    }
    const updated = { ...child };
    if (editIdx === -1) {
      updated.wishlist = [
        ...(updated.wishlist || []),
        { ...form, targetAmount: Number(form.targetAmount), id: Date.now() },
      ];
    } else {
      updated.wishlist = [...(updated.wishlist || [])];
      updated.wishlist[editIdx] = { ...form, targetAmount: Number(form.targetAmount) };
    }
    updateChild(updated);
    setChild(updated);
    setOpenDialog(false);
    setForm({ name: '', targetAmount: '', memo: '' });
    setEditIdx(-1);
  };

  // 삭제
  const handleDelete = (idx) => {
    const updated = { ...child };
    updated.wishlist = [...(updated.wishlist || [])];
    updated.wishlist.splice(idx, 1);
    updateChild(updated);
    setChild(updated);
  };

  // 수정
  const handleEdit = (idx) => {
    setForm(wishlist[idx]);
    setEditIdx(idx);
    setOpenDialog(true);
  };

  return (
    <Container maxWidth="md" sx={{ pt: '64px', mt: 2, mb: 2, minHeight: '60vh' }}>
      <Paper sx={{ p: 1, mb: 1, boxShadow: 1, borderRadius: 1 }}>
        <Typography variant="h4" gutterBottom>위시리스트</Typography>
        {isParent && (
          <FormControl sx={{ minWidth: 180, mb: 2 }} size="small">
            <InputLabel>자녀 선택</InputLabel>
            <Select
              value={selectedChildId}
              label="자녀 선택"
              onChange={e => setSelectedChildId(e.target.value)}
            >
              {children.map(c => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        {!isParent && (
          <Button variant="contained" sx={{ mb: 2 }} onClick={() => { setForm({ name: '', targetAmount: '', memo: '' }); setEditIdx(-1); setOpenDialog(true); }}>
            위시리스트 추가
          </Button>
        )}
        <List>
          {wishlist.length > 0 ? wishlist.slice().reverse().map((item, idx) => (
            <Box key={item.id}>
              <ListItem
                secondaryAction={
                  !isParent && (
                    <>
                      <IconButton edge="end" onClick={() => handleEdit(wishlist.length - 1 - idx)}><EditIcon /></IconButton>
                      <IconButton edge="end" onClick={() => handleDelete(wishlist.length - 1 - idx)}><DeleteIcon /></IconButton>
                    </>
                  )
                }
              >
                <ListItemText
                  primary={`${item.name} (목표: ${item.targetAmount.toLocaleString()}원)`}
                  secondary={item.memo}
                />
              </ListItem>
              <Divider />
            </Box>
          )) : (
            <Typography color="text.secondary" sx={{ p: 1, textAlign: 'center' }}>위시리스트가 없습니다.</Typography>
          )}
        </List>
      </Paper>
      {/* 위시리스트 추가/수정 다이얼로그 */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editIdx === -1 ? '위시리스트 추가' : '위시리스트 수정'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            fullWidth
            label="이름"
            name="name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="목표 금액"
            name="targetAmount"
            type="number"
            value={form.targetAmount}
            onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="메모"
            name="memo"
            value={form.memo}
            onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>취소</Button>
          <Button onClick={handleSave} variant="contained">저장</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Wishlist; 
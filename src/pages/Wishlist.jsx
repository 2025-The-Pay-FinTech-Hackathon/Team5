import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  IconButton,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { LOCAL_DATA_CHANGED_EVENT, findChildById, updateChild, getChildrenByParent } from '../utils/localData';
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

  const refreshWishlistData = () => {
    if (isParent) {
      const kids = getChildrenByParent(userId);
      setChildren(kids);
      setSelectedChildId((current) => (
        current && kids.some((kid) => kid.id === current) ? current : kids[0]?.id || ''
      ));
    } else {
      setChild(findChildById(userId));
    }
  };

  useEffect(() => {
    refreshWishlistData();
  }, [isParent, userId, location.pathname]);

  useEffect(() => {
    const handleLocalDataChanged = (event) => {
      if (!event.detail?.key || event.detail.key === 'children') {
        refreshWishlistData();
      }
    };

    const handleStorage = (event) => {
      if (!event.key || event.key === 'children') {
        refreshWishlistData();
      }
    };

    window.addEventListener(LOCAL_DATA_CHANGED_EVENT, handleLocalDataChanged);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(LOCAL_DATA_CHANGED_EVENT, handleLocalDataChanged);
      window.removeEventListener('storage', handleStorage);
    };
  }, [isParent, userId]);

  useEffect(() => {
    if (isParent && selectedChildId) {
      setChild(findChildById(selectedChildId));
    }
  }, [selectedChildId, isParent]);

  const wishlist = child?.wishlist || [];

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

  const handleDelete = (idx) => {
    const updated = { ...child };
    updated.wishlist = [...(updated.wishlist || [])];
    updated.wishlist.splice(idx, 1);
    updateChild(updated);
    setChild(updated);
  };

  const handleEdit = (idx) => {
    setForm(wishlist[idx]);
    setEditIdx(idx);
    setOpenDialog(true);
  };

  return (
    <Container maxWidth="md" sx={{ pt: '64px', mt: 2, mb: 4 }}>
      <Paper
        sx={{
          p: 3,
          boxShadow: 2,
          borderRadius: 3,
          maxWidth: 800,
          mx: 'auto',
          backgroundColor: '#ffffff',
        }}
      >
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          위시리스트
        </Typography>

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
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button
              variant="contained"
              sx={{
                backgroundColor: '#fbc02d',
                color: '#000',
                fontWeight: 600,
                px: 4,
                py: 1,
                borderRadius: 2,
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: '#f9a825',
                },
              }}
              onClick={() => {
                setForm({ name: '', targetAmount: '', memo: '' });
                setEditIdx(-1);
                setOpenDialog(true);
              }}
            >
              + 항목 추가
            </Button>
          </Box>
        )}

        <List>
          {wishlist.length > 0 ? wishlist.slice().reverse().map((item, idx) => (
            <Paper
              key={item.id}
              sx={{
                mb: 1.5,
                p: 2,
                borderLeft: '5px solid #fbc02d',
                backgroundColor: '#fffde7',
                borderRadius: 2,
              }}
              elevation={1}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography fontSize="1rem" fontWeight={600}>
                    {item.name}
                  </Typography>
                  <Typography fontSize="0.9rem" color="text.secondary">
                    🎯 {item.targetAmount.toLocaleString()}원
                  </Typography>
                  {item.memo && (
                    <Typography fontSize="0.85rem" sx={{ mt: 0.5 }}>
                      📝 {item.memo}
                    </Typography>
                  )}
                </Box>
                {!isParent && (
                  <Box>
                    <IconButton size="small" onClick={() => handleEdit(wishlist.length - 1 - idx)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(wishlist.length - 1 - idx)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Box>
            </Paper>
          )) : (
            <Typography sx={{ textAlign: 'center', color: 'text.secondary', py: 3 }}>
              위시리스트가 없습니다.
            </Typography>
          )}
        </List>
      </Paper>

      {/* 다이얼로그 */}
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
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{ backgroundColor: '#fbc02d', color: '#000', fontWeight: 600 }}
          >
            저장
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Wishlist;

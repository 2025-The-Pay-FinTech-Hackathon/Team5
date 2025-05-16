import { useState, useEffect } from 'react';
import { checkAndUpdateBadges } from '../utils/badgeUtils';
import { Route } from 'react-router-dom';

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
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  IconButton,
  Alert,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { findChildById, updateChild, getChildrenByParent } from '../utils/localData';
import { DateCalendar } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { ko } from 'date-fns/locale';
import { useLocation } from 'react-router-dom';

const CATEGORIES = ['식비', '교통', '문화', '쇼핑', '기타'];

function Ledger() {
  const location = useLocation();
  const user = JSON.parse(sessionStorage.getItem('user'));
  const isParent = user?.role === 'parent';
  const [child, setChild] = useState(null);
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editIdx, setEditIdx] = useState(-1);
  const [form, setForm] = useState({ amount: '', memo: '', category: '', date: '' });
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  // 데이터 불러오기
  useEffect(() => {
    if (isParent) {
      const kids = getChildrenByParent(user.id);
      setChildren(kids);
      if (kids.length > 0) setSelectedChildId(kids[0].id);
    } else {
      setChild(findChildById(user.id));
    }
  }, [user, location.pathname]);

  useEffect(() => {
    if (isParent && selectedChildId) {
      setChild(findChildById(selectedChildId));
    }
  }, [selectedChildId, isParent]);

  const ledgers = child?.ledgers || [];

  // 날짜별 기록 필터링
  const selectedDateStr = selectedDate.toISOString().slice(0, 10);
  const filteredLedgers = ledgers.filter(l => l.date === selectedDateStr);

  // 추가/수정
  const handleSave = () => {
    setError('');
    if (!form.amount || !form.category || !form.date) {
      setError('금액, 카테고리, 날짜를 입력하세요.');
      return;
    }
    if (Number(form.amount) > (child?.balance || 0)) {
      setError('잔액이 부족합니다.');
      return;
    }
    const updated = { ...child };
    if (editIdx === -1) {
      updated.ledgers = [
        ...(updated.ledgers || []),
        { ...form, amount: Number(form.amount), id: Date.now() },
      ];
      updated.balance = (updated.balance || 0) - Number(form.amount);
    } else {
      updated.ledgers = [...(updated.ledgers || [])];
      // 기존 금액 복원 후 새 금액 차감
      const prevAmount = updated.ledgers[editIdx]?.amount || 0;
      updated.ledgers[editIdx] = { ...form, amount: Number(form.amount) };
      updated.balance = (updated.balance || 0) + prevAmount - Number(form.amount);
    }
    updateChild(updated);
    setChild(updated);
    setOpenDialog(false);
    setForm({ amount: '', memo: '', category: '', date: '' });
    setEditIdx(-1);

    checkAndUpdateBadges(updated);
  };

  // 삭제
  const handleDelete = (idx) => {
    const updated = { ...child };
    updated.ledgers = [...(updated.ledgers || [])];
    updated.ledgers.splice(idx, 1);
    updateChild(updated);
    setChild(updated);
  };

  // 수정
  const handleEdit = (idx) => {
    setForm(ledgers[idx]);
    setEditIdx(idx);
    setOpenDialog(true);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4, minHeight: '70vh' }}>
      <Paper sx={{ p: 3, mb: 3, boxShadow: 2 }}>
        <Typography variant="h4" gutterBottom>가계부</Typography>
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
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, alignItems: 'flex-start' }}>
          {/* 달력 */}
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
            <DateCalendar
              value={selectedDate}
              onChange={date => setSelectedDate(date || new Date())}
              sx={{ minWidth: 320, mb: { xs: 2, md: 0 } }}
              showDaysOutsideCurrentMonth
              slotProps={{
                day: {
                  highlightedDays: ledgers.map(l => l.date),
                },
              }}
            />
          </LocalizationProvider>
          {/* 기록 리스트 */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>{selectedDateStr} 소비 기록</Typography>
            {!isParent && (
              <Button variant="contained" sx={{ mb: 2 }} onClick={() => { setForm({ amount: '', memo: '', category: '', date: selectedDateStr }); setEditIdx(-1); setOpenDialog(true); }}>
                소비 기록 추가
              </Button>
            )}
            <List>
              {filteredLedgers.length > 0 ? filteredLedgers.slice().reverse().map((item, idx) => (
                <Box key={item.id}>
                  <ListItem
                    secondaryAction={
                      !isParent && (
                        <>
                          <IconButton edge="end" onClick={() => handleEdit(ledgers.findIndex(l => l.id === item.id))}><EditIcon /></IconButton>
                          <IconButton edge="end" onClick={() => handleDelete(ledgers.findIndex(l => l.id === item.id))}><DeleteIcon /></IconButton>
                        </>
                      )
                    }
                  >
                    <ListItemText
                      primary={`${item.amount.toLocaleString()}원 - ${item.category}`}
                      secondary={`${item.date} ${item.memo ? '| ' + item.memo : ''}`}
                    />
                  </ListItem>
                  <Divider />
                </Box>
              )) : (
                <Typography color="text.secondary" sx={{ p: 4, textAlign: 'center' }}>이 날짜의 소비 기록이 없습니다.</Typography>
              )}
            </List>
          </Box>
        </Box>
      </Paper>
      {/* 소비 기록 추가/수정 다이얼로그 */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editIdx === -1 ? '소비 기록 추가' : '소비 기록 수정'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            fullWidth
            label="금액"
            name="amount"
            type="number"
            value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            margin="normal"
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>카테고리</InputLabel>
            <Select
              name="category"
              value={form.category}
              label="카테고리"
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              required
            >
              {CATEGORIES.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="메모"
            name="memo"
            value={form.memo}
            onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}
            margin="normal"
          />
          <TextField
            fullWidth
            label="날짜"
            name="date"
            type="date"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            margin="normal"
            required
            InputLabelProps={{ shrink: true }}
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




export default Ledger; 
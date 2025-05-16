// 전체 Ledger 컴포넌트 코드입니다.
import { useState, useEffect } from 'react';
import {
  Container, Paper, Typography, Box, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, List, ListItem, ListItemText, Divider, Select,
  MenuItem, InputLabel, FormControl, IconButton, Alert
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { findChildById, updateChild, getChildrenByParent } from '../utils/localData';
import { DateCalendar } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { ko } from 'date-fns/locale';
import { useLocation } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

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
  const userId = user?.id;

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

  // 🔄 실시간 동기화
  useEffect(() => {
    const handleStorage = () => {
      if (isParent && selectedChildId) {
        const updatedChild = findChildById(selectedChildId);
        setChild(updatedChild);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [isParent, selectedChildId]);

  const ledgers = child?.ledgers || [];
  const selectedDateStr = selectedDate.toISOString().slice(0, 10);
  const filteredLedgers = ledgers.filter(l => l.date === selectedDateStr);

  const categoryData = CATEGORIES.map(cat => ({
    name: cat,
    value: ledgers.filter(l => l.category === cat).reduce((sum, l) => sum + Number(l.amount || 0), 0)
  })).filter(d => d.value > 0);

  const monthlyData = ledgers.reduce((acc, l) => {
    const month = l.date?.slice(0, 7);
    const found = acc.find(a => a.name === month);
    if (found) found.value += Number(l.amount || 0);
    else acc.push({ name: month, value: Number(l.amount || 0) });
    return acc;
  }, []).sort((a, b) => a.name.localeCompare(b.name));

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
      updated.ledgers = [...(updated.ledgers || []), {
        ...form, amount: Number(form.amount), id: Date.now()
      }];
      updated.balance -= Number(form.amount);
    } else {
      const prevAmount = updated.ledgers[editIdx]?.amount || 0;
      updated.ledgers[editIdx] = { ...form, amount: Number(form.amount) };
      updated.balance += prevAmount - Number(form.amount);
    }
    updateChild(updated);
    setChild(updated);
    setOpenDialog(false);
    setForm({ amount: '', memo: '', category: '', date: '' });
    setEditIdx(-1);
  };

  const handleDelete = (idx) => {
    const updated = { ...child };
    updated.ledgers.splice(idx, 1);
    updateChild(updated);
    setChild(updated);
  };

  const handleEdit = (idx) => {
    setForm(ledgers[idx]);
    setEditIdx(idx);
    setOpenDialog(true);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4, minHeight: '80vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Paper sx={{ p: 3, width: '100%', maxWidth: 1000 }}>
          <Typography variant="h4" gutterBottom>가계부</Typography>

          {isParent && (
            <>
              <FormControl sx={{ minWidth: 180, mb: 3 }} size="small">
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

              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>카테고리별 소비</Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#FFD54F" name="소비 금액" />
                </BarChart>
              </ResponsiveContainer>

              <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>월별 소비</Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#4FC3F7" name="월별 소비" />
                </BarChart>
              </ResponsiveContainer>
            </>
          )}

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, mt: 3 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
              <DateCalendar
                value={selectedDate}
                onChange={date => setSelectedDate(date || new Date())}
                sx={{ minWidth: 320 }}
              />
            </LocalizationProvider>

            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom>{selectedDateStr} 소비 기록</Typography>
              {!isParent && (
                <Button variant="contained" sx={{ mb: 2 }} onClick={() => {
                  setForm({ amount: '', memo: '', category: '', date: selectedDateStr });
                  setEditIdx(-1);
                  setOpenDialog(true);
                }}>
                  소비 기록 추가
                </Button>
              )}
              <List>
                {filteredLedgers.length > 0 ? filteredLedgers.slice().reverse().map((item, idx) => (
                  <Box key={item.id}>
                    <ListItem
                      secondaryAction={!isParent && (
                        <>
                          <IconButton onClick={() => handleEdit(ledgers.findIndex(l => l.id === item.id))}><EditIcon /></IconButton>
                          <IconButton onClick={() => handleDelete(ledgers.findIndex(l => l.id === item.id))}><DeleteIcon /></IconButton>
                        </>
                      )}
                    >
                      <ListItemText
                        primary={`${item.amount.toLocaleString()}원 - ${item.category}`}
                        secondary={`${item.date} ${item.memo ? '| ' + item.memo : ''}`}
                      />
                    </ListItem>
                    <Divider />
                  </Box>
                )) : (
                  <Typography sx={{ textAlign: 'center', p: 3, color: 'text.secondary' }}>
                    이 날짜의 소비 기록이 없습니다.
                  </Typography>
                )}
              </List>
            </Box>
          </Box>
        </Paper>
      </Box>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editIdx === -1 ? '소비 기록 추가' : '소비 기록 수정'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            fullWidth label="금액" type="number" margin="normal"
            value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>카테고리</InputLabel>
            <Select
              value={form.category}
              label="카테고리"
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              required
            >
              {CATEGORIES.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField
            fullWidth label="메모" margin="normal"
            value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}
          />
          <TextField
            fullWidth label="날짜" type="date" margin="normal"
            value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            InputLabelProps={{ shrink: true }} required
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

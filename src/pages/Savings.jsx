import { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  LinearProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Chip,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Info as InfoIcon,
  Savings as SavingsIcon,
} from '@mui/icons-material';
import { findChildById, updateChild, getChildrenByParent } from '../utils/localData';
import { useLocation } from 'react-router-dom';

function Savings() {
  const location = useLocation();
  const user = JSON.parse(sessionStorage.getItem('user'));
  const isParent = user?.role === 'parent';
  const [child, setChild] = useState(null);
  const [children, setChildren] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', targetAmount: '', deadline: '' });
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionType, setTransactionType] = useState('deposit');
  const [error, setError] = useState('');

  // 데이터 불러오기
  useEffect(() => {
    if (isParent) {
      setChildren(getChildrenByParent(user.id));
    } else {
      setChild(findChildById(user.id));
    }
  }, [user, location.pathname]);

  // 저축 목표 추가
  const handleSubmitGoal = () => {
    setError('');
    if (!newGoal.title || !newGoal.targetAmount || !newGoal.deadline) {
      setError('모든 필드를 입력해주세요.');
      return;
    }
    if (!child) return;
    const updated = { ...child };
    updated.savings = [
      ...(updated.savings || []),
      {
        id: Date.now(),
        ...newGoal,
        targetAmount: Number(newGoal.targetAmount),
        currentAmount: 0,
      },
    ];
    updateChild(updated);
    setChild(updated);
    setOpenDialog(false);
    setNewGoal({ title: '', targetAmount: '', deadline: '' });
  };

  // 입금/출금
  const handleTransaction = () => {
    setError('');
    if (!selectedGoal || !transactionAmount || isNaN(transactionAmount) || Number(transactionAmount) <= 0) {
      setError('올바른 금액을 입력해주세요.');
      return;
    }
    if (transactionType === 'deposit' && Number(transactionAmount) > (child?.balance || 0)) {
      setError('잔액이 부족합니다.');
      return;
    }
    const updated = { ...child };
    updated.savings = (updated.savings || []).map(goal => {
      if (goal.id === selectedGoal.id) {
        let newAmount = goal.currentAmount;
        if (transactionType === 'deposit') {
          newAmount += Number(transactionAmount);
        } else {
          newAmount -= Number(transactionAmount);
        }
        if (newAmount < 0) newAmount = 0;
        if (newAmount > goal.targetAmount) newAmount = goal.targetAmount;
        return { ...goal, currentAmount: newAmount };
      }
      return goal;
    });
    if (transactionType === 'deposit') {
      updated.balance = (updated.balance || 0) - Number(transactionAmount);
    } else {
      updated.balance = (updated.balance || 0) + Number(transactionAmount);
    }
    updateChild(updated);
    setChild(updated);
    setSelectedGoal(null);
    setTransactionAmount('');
    setTransactionType('deposit');
  };

  // 부모: 자녀별 저축 목표 보기
  if (isParent) {
    return (
      <Container maxWidth="lg" sx={{ pt: '64px', mt: 2, mb: 2, minHeight: '70vh' }}>
        <Paper sx={{ p: 1, mb: 1, display: 'flex', alignItems: 'center', boxShadow: 1, borderRadius: 1 }}>
          <SavingsIcon sx={{ mr: 1, fontSize: 32 }} />
          <Typography variant="h4" component="h1">자녀 저축 목표</Typography>
        </Paper>
        <Grid container spacing={1} alignItems="flex-start">
          {children.length === 0 && (
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: 220 }}>
              <Typography color="text.secondary" sx={{ p: 4, width: '100%', textAlign: 'center' }}>자녀가 없습니다.</Typography>
            </Grid>
          )}
          {children.map(child => (
            <Grid item xs={12} md={6} key={child.id} sx={{ display: 'flex' }}>
              <Paper sx={{ p: 1, boxShadow: 1, flexGrow: 1, minHeight: 80, display: 'flex', flexDirection: 'column', borderRadius: 1 }}>
                <Typography variant="h6">{child.name}</Typography>
                {(child.savings && child.savings.length > 0) ? child.savings.map(goal => (
                  <Card key={goal.id} sx={{ my: 1, boxShadow: 1, borderRadius: 1 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="subtitle1">{goal.title}</Typography>
                        <Tooltip title="목표 금액과 마감일을 확인하세요">
                          <IconButton size="small"><InfoIcon /></IconButton>
                        </Tooltip>
                      </Box>
                      <Typography variant="body2" color="text.secondary">목표 금액: {goal.targetAmount.toLocaleString()}원</Typography>
                      <Typography variant="body2" color="text.secondary">마감일: {goal.deadline}</Typography>
                      <LinearProgress variant="determinate" value={(goal.currentAmount / goal.targetAmount) * 100} sx={{ height: 10, borderRadius: 5, my: 1 }} />
                      <Typography variant="body2" color="text.secondary">현재: {goal.currentAmount.toLocaleString()}원 ({((goal.currentAmount / goal.targetAmount) * 100).toFixed(1)}%)</Typography>
                    </CardContent>
                  </Card>
                )) : <Typography color="text.secondary">저축 목표가 없습니다.</Typography>}
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  // 자녀: 저축 목표 관리
  return (
    <Container maxWidth="lg" sx={{ pt: '64px', mt: 2, mb: 2, minHeight: '70vh' }}>
      <Paper sx={{ p: 1, mb: 1, display: 'flex', alignItems: 'center', boxShadow: 1, borderRadius: 1 }}>
        <SavingsIcon sx={{ mr: 1, fontSize: 32 }} />
        <Typography variant="h4" component="h1">저축 목표</Typography>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} sx={{ ml: 2 }} onClick={() => setOpenDialog(true)}>
          새 목표 만들기
        </Button>
      </Paper>
      <Grid container spacing={1} alignItems="flex-start">
        {(child?.savings && child.savings.length > 0) ? child.savings.map(goal => (
          <Grid item xs={12} md={6} key={goal.id} sx={{ display: 'flex' }}>
            <Card sx={{ boxShadow: 1, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 80, borderRadius: 1 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="h6">{goal.title}</Typography>
                  <Tooltip title="목표 금액과 마감일을 확인하세요">
                    <IconButton size="small"><InfoIcon /></IconButton>
                  </Tooltip>
                </Box>
                <Typography variant="body2" color="text.secondary">목표 금액: {goal.targetAmount.toLocaleString()}원</Typography>
                <Typography variant="body2" color="text.secondary">마감일: {goal.deadline}</Typography>
                <LinearProgress variant="determinate" value={(goal.currentAmount / goal.targetAmount) * 100} sx={{ height: 10, borderRadius: 5, my: 1 }} />
                <Typography variant="body2" color="text.secondary">현재: {goal.currentAmount.toLocaleString()}원 ({((goal.currentAmount / goal.targetAmount) * 100).toFixed(1)}%)</Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button variant="outlined" color="primary" startIcon={<AddIcon />} onClick={() => { setSelectedGoal(goal); setTransactionType('deposit'); }}>
                    입금
                  </Button>
                  <Button variant="outlined" color="secondary" startIcon={<RemoveIcon />} onClick={() => { setSelectedGoal(goal); setTransactionType('withdraw'); }} disabled={goal.currentAmount <= 0}>
                    출금
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )) : (
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: 220 }}>
            <Typography color="text.secondary" sx={{ p: 4, width: '100%', textAlign: 'center' }}>저축 목표가 없습니다.</Typography>
          </Grid>
        )}
      </Grid>

      {/* New Goal Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>새 저축 목표 만들기</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="목표 이름"
              name="title"
              value={newGoal.title}
              onChange={e => setNewGoal(f => ({ ...f, title: e.target.value }))}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="목표 금액"
              name="targetAmount"
              type="number"
              value={newGoal.targetAmount}
              onChange={e => setNewGoal(f => ({ ...f, targetAmount: e.target.value }))}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="마감일"
              name="deadline"
              type="date"
              value={newGoal.deadline}
              onChange={e => setNewGoal(f => ({ ...f, deadline: e.target.value }))}
              margin="normal"
              required
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>취소</Button>
          <Button onClick={handleSubmitGoal} variant="contained" color="primary">만들기</Button>
        </DialogActions>
      </Dialog>

      {/* Transaction Dialog */}
      <Dialog open={!!selectedGoal} onClose={() => setSelectedGoal(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{selectedGoal?.title} - {selectedGoal?.currentAmount?.toLocaleString()}원</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            fullWidth
            label="금액"
            type="number"
            value={transactionAmount}
            onChange={e => setTransactionAmount(e.target.value)}
            margin="normal"
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedGoal(null)}>취소</Button>
          <Button
            onClick={handleTransaction}
            variant="contained"
            color={transactionType === 'deposit' ? 'primary' : 'secondary'}
            disabled={!transactionAmount || parseInt(transactionAmount) <= 0 || (transactionType === 'withdraw' && parseInt(transactionAmount) > selectedGoal?.currentAmount)}
          >
            {transactionType === 'deposit' ? '입금' : '출금'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Savings; 
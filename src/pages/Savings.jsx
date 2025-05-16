import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
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
  Alert,
  Grid,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Info as InfoIcon,
  Savings as SavingsIcon,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartTooltip } from 'recharts';
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
  const userId = user?.id;

  useEffect(() => {
    if (isParent) {
      setChildren(getChildrenByParent(userId));
    } else {
      setChild(findChildById(userId));
    }
  }, [isParent, userId, location.pathname]);

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
        newAmount = Math.max(0, Math.min(newAmount, goal.targetAmount));
        return { ...goal, currentAmount: newAmount };
      }
      return goal;
    });
    updated.balance = (updated.balance || 0) + (transactionType === 'withdraw' ? Number(transactionAmount) : -Number(transactionAmount));
    updateChild(updated);
    setChild(updated);
    setSelectedGoal(null);
    setTransactionAmount('');
    setTransactionType('deposit');
  };

  const chartData = (child?.savings || []).map(goal => ({
    name: goal.title,
    value: goal.currentAmount,
    fill: `#${Math.floor(Math.random()*16777215).toString(16)}`,
  }));

  return (
    <Container maxWidth="lg" sx={{ pt: '64px', mt: 2, mb: 2, minHeight: '70vh' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <SavingsIcon sx={{ mr: 1, fontSize: 32 }} />
          <Typography variant="h5" fontWeight={700}>저축 목표</Typography>
        </Box>
        {!isParent && (
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}>
            새 목표 만들기
          </Button>
        )}
      </Box>

      {!isParent && child?.savings?.length > 0 && (
        <Paper sx={{ p: 2, mb: 4 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>나의 저축 분포</Typography>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={80} label />
              <RechartTooltip />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      )}

      <Grid container spacing={2}>
        {(isParent ? children : child?.savings)?.map((item, index) => {
          const savings = isParent ? item.savings : [item];
          const name = isParent ? item.name : null;
          return savings?.map((goal, idx) => (
            <Grid item xs={12} sm={6} md={4} key={goal.id + '-' + idx}>
              <Card sx={{ p: 2, borderRadius: 2, boxShadow: 3 }}>
                <CardContent>
                  {name && <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>{name}</Typography>}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography fontWeight={600}>{goal.title}</Typography>
                    <Tooltip title="목표 정보">
                      <IconButton size="small"><InfoIcon fontSize="small" /></IconButton>
                    </Tooltip>
                  </Box>
                  <Typography variant="body2" color="text.secondary">목표 금액: {goal.targetAmount.toLocaleString()}원</Typography>
                  <Typography variant="body2" color="text.secondary">마감일: {goal.deadline}</Typography>
                  <LinearProgress variant="determinate" value={(goal.currentAmount / goal.targetAmount) * 100} sx={{ height: 8, borderRadius: 4, my: 1 }} />
                  <Typography variant="caption" color="text.secondary">현재: {goal.currentAmount.toLocaleString()}원 ({((goal.currentAmount / goal.targetAmount) * 100).toFixed(1)}%)</Typography>
                  {!isParent && (
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button variant="outlined" color="primary" size="small" startIcon={<AddIcon />} onClick={() => { setSelectedGoal(goal); setTransactionType('deposit'); }}>입금</Button>
                      <Button variant="outlined" color="secondary" size="small" startIcon={<RemoveIcon />} onClick={() => { setSelectedGoal(goal); setTransactionType('withdraw'); }} disabled={goal.currentAmount <= 0}>출금</Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ));
        })}
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>새 저축 목표 만들기</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField fullWidth label="목표 이름" value={newGoal.title} onChange={e => setNewGoal(f => ({ ...f, title: e.target.value }))} margin="normal" required />
          <TextField fullWidth label="목표 금액" type="number" value={newGoal.targetAmount} onChange={e => setNewGoal(f => ({ ...f, targetAmount: e.target.value }))} margin="normal" required />
          <TextField fullWidth label="마감일" type="date" value={newGoal.deadline} onChange={e => setNewGoal(f => ({ ...f, deadline: e.target.value }))} margin="normal" required InputLabelProps={{ shrink: true }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>취소</Button>
          <Button onClick={handleSubmitGoal} variant="contained">만들기</Button>
        </DialogActions>
      </Dialog>

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
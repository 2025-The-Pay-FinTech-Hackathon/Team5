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
  Chip,
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
import { LOCAL_DATA_CHANGED_EVENT, findChildById, updateChild, getChildrenByParent } from '../utils/localData';
import { checkAndUpdateBadges } from '../utils/badgeUtils';
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

  const refreshSavingsData = () => {
    if (isParent) {
      setChildren(getChildrenByParent(userId));
    } else {
      setChild(findChildById(userId));
    }
  };

  useEffect(() => {
    refreshSavingsData();
  }, [isParent, userId, location.pathname]);

  useEffect(() => {
    const handleLocalDataChanged = (event) => {
      if (!event.detail?.key || event.detail.key === 'children') {
        refreshSavingsData();
      }
    };

    const handleStorage = (event) => {
      if (!event.key || event.key === 'children') {
        refreshSavingsData();
      }
    };

    window.addEventListener(LOCAL_DATA_CHANGED_EVENT, handleLocalDataChanged);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(LOCAL_DATA_CHANGED_EVENT, handleLocalDataChanged);
      window.removeEventListener('storage', handleStorage);
    };
  }, [isParent, userId]);

  const handleSubmitGoal = () => {
    setError('');
    if (!newGoal.title || !newGoal.targetAmount || !newGoal.deadline) {
      setError('모든 필드를 입력해주세요.');
      return;
    }
    if (Number(newGoal.targetAmount) <= 0) {
      setError('목표 금액을 0원보다 크게 입력해주세요.');
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
        status: '진행중',
      },
    ];
    updateChild(updated);
    setChild(updated);
    setOpenDialog(false);
    setNewGoal({ title: '', targetAmount: '', deadline: '' });
  };

  const handleTransaction = () => {
    setError('');
    const amount = Number(transactionAmount);

    if (!selectedGoal || !transactionAmount || isNaN(transactionAmount) || amount <= 0) {
      setError('올바른 금액을 입력해주세요.');
      return;
    }

    const latestChild = findChildById(userId) || child;
    const latestGoal = (latestChild?.savings || []).find(goal => goal.id === selectedGoal.id);

    if (!latestChild || !latestGoal) {
      setError('저축 목표 정보를 찾을 수 없습니다.');
      return;
    }

    const currentAmount = Number(latestGoal.currentAmount || 0);
    const targetAmount = Number(latestGoal.targetAmount || 0);
    const isCompleted = latestGoal.status === '완료' || currentAmount >= targetAmount;
    const remainingAmount = Math.max(0, targetAmount - currentAmount);

    if (transactionType === 'deposit' && isCompleted) {
      setError('이미 목표를 달성한 저축은 출금만 가능합니다.');
      return;
    }

    if (transactionType === 'deposit' && amount > remainingAmount) {
      setError(`목표까지 남은 ${remainingAmount.toLocaleString()}원까지만 입금할 수 있습니다.`);
      return;
    }

    if (transactionType === 'deposit' && amount > (latestChild.balance || 0)) {
      setError('잔액이 부족합니다.');
      return;
    }

    if (transactionType === 'withdraw' && amount > currentAmount) {
      setError('출금 가능 금액을 초과했습니다.');
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const updated = { ...latestChild };
    updated.savings = (updated.savings || []).map(goal => {
      if (goal.id === selectedGoal.id) {
        let newAmount = Number(goal.currentAmount || 0);
        newAmount += transactionType === 'deposit' ? amount : -amount;
        newAmount = Math.max(0, Math.min(newAmount, goal.targetAmount));
        const completed = newAmount >= Number(goal.targetAmount || 0);

        return {
          ...goal,
          currentAmount: newAmount,
          status: completed ? '완료' : '진행중',
          completedAt: completed ? (goal.completedAt || today) : null,
          achievedAt: completed ? (goal.achievedAt || today) : goal.achievedAt,
          lastUpdated: today,
        };
      }
      return goal;
    });
    updated.balance = (updated.balance || 0) + (transactionType === 'withdraw' ? amount : -amount);

    const updatedWithBadges = checkAndUpdateBadges(updated);
    setChild(updatedWithBadges);
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
        {(isParent ? children : child?.savings)?.map((item) => {
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
                  <Chip
                    label={(goal.status === '완료' || goal.currentAmount >= goal.targetAmount) ? '완료' : '진행중'}
                    color={(goal.status === '완료' || goal.currentAmount >= goal.targetAmount) ? 'success' : 'primary'}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                  <LinearProgress variant="determinate" value={(goal.currentAmount / goal.targetAmount) * 100} sx={{ height: 8, borderRadius: 4, my: 1 }} />
                  <Typography variant="caption" color="text.secondary">현재: {goal.currentAmount.toLocaleString()}원 ({((goal.currentAmount / goal.targetAmount) * 100).toFixed(1)}%)</Typography>
                  {!isParent && (
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => { setSelectedGoal(goal); setTransactionType('deposit'); }}
                        disabled={goal.status === '완료' || goal.currentAmount >= goal.targetAmount}
                      >
                        입금
                      </Button>
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

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { checkAndUpdateBadges } from '../utils/badgeUtils';

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
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  EmojiEvents as EmojiEventsIcon,
  School as SchoolIcon,
  Store as StoreIcon,
  Star as StarIcon,
  ShoppingCart as ShoppingCartIcon,
  Savings as SavingsIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { findChildById, updateChild } from '../utils/localData';

function ChildDashboard() {
  const location = useLocation();
  // 로그인한 자녀 정보 가져오기
  const user = JSON.parse(sessionStorage.getItem('user'));
  const [child, setChild] = useState(null);
  const navigate = useNavigate();
  const [openLoanDialog, setOpenLoanDialog] = useState(false);
  const [loanForm, setLoanForm] = useState({ amount: '', reason: '', period: '' });
  const [loanError, setLoanError] = useState('');
  const [repayError, setRepayError] = useState('');

  useEffect(() => {
    if (user?.role === 'child') {
      setChild(findChildById(user.id));
    }
  }, [user, location.pathname]);



  // 최근 활동(미션, 퀴즈 등)
  const recentActivities = [
    ...(child?.missions || []).slice(-2).map(m => ({
      id: m.id,
      type: '미션',
      title: m.title,
      points: m.reward || 0,
      date: m.completedAt || m.deadline || '',
    })),
    // 퀴즈 등 추가 가능
  ];

  // 진행 중 미션
  const activeMissions = (child?.missions || []).filter(m => m.status === '진행중');

  // 통계 계산
  const totalPointsEarned = (child?.missions || []).reduce((sum, m) => sum + (m.status === '완료' ? Number(m.reward || 0) : 0), 0);
  const totalPointsUsed = (child?.purchases || []).reduce((sum, p) => sum + (p.points || 0), 0);
  const savingsGoals = child?.savings || [];
  const savingsProgress = savingsGoals.length > 0 ? Math.round(savingsGoals.reduce((sum, g) => sum + (g.currentAmount / g.targetAmount), 0) / savingsGoals.length * 100) : 0;
  const missionsTotal = (child?.missions || []).length;
  const missionsCompleted = (child?.missions || []).filter(m => m.status === '완료').length;
  const missionCompletionRate = missionsTotal > 0 ? Math.round((missionsCompleted / missionsTotal) * 100) : 0;

  // 최근 구매 내역
  const recentPurchases = (child?.purchases || []).slice(-3).reverse();

  // 대출 요청 핸들러
  const handleRequestLoan = () => {
    setLoanError('');
    if (!loanForm.amount || !loanForm.reason || !loanForm.period) {
      setLoanError('모든 항목을 입력하세요.');
      return;
    }
    if (isNaN(loanForm.amount) || Number(loanForm.amount) <= 0) {
      setLoanError('금액을 올바르게 입력하세요.');
      return;
    }
    const latestChild = findChildById(user.id);
    if (!latestChild) {
      setLoanError('자녀 정보를 찾을 수 없습니다.');
      return;
    }
    const updated = { ...latestChild };
    updated.loanRequests = [
      ...(updated.loanRequests || []),
      {
        id: Date.now(),
        amount: Number(loanForm.amount),
        reason: loanForm.reason,
        period: loanForm.period,
        status: 'pending',
        requestedAt: new Date().toISOString().slice(0, 10),
      },
    ];
    updateChild(updated);
    setChild(updated);
    setOpenLoanDialog(false);
    setLoanForm({ amount: '', reason: '', period: '' });
  };

  // 대출 상환 핸들러
  const handleRepayLoan = (loan) => {
    setRepayError('');
    const repayAmount = loan.repayAmount || (loan.amount + (loan.interest || 0));
    if ((child.balance || 0) < repayAmount) {
      setRepayError('잔액이 부족합니다.');
      return;
    }
    const updated = { ...child };
    updated.balance = (updated.balance || 0) - repayAmount;
    updated.loanAmount = (updated.loanAmount || 0) - loan.amount;
    updated.loans = (updated.loans || []).map(l => l.id === loan.id ? { ...l, repaid: true, status: 'repaid', repaidAt: new Date().toISOString().slice(0, 10) } : l);
    updated.creditScore = (updated.creditScore || 600) + 20; // 상환 시 신용도 일부 회복
    updated.ledgers = [
      { type: '상환', amount: repayAmount, date: new Date().toISOString().slice(0, 10), memo: '대출 상환' },
      ...(updated.ledgers || []),
    ];
    updateChild(updated);
    setChild(updated);
  };

  return (
    <Container maxWidth="lg" sx={{ pt: '64px', mt: 4, mb: 4, minHeight: '80vh' }}>
      <Grid container spacing={3} alignItems="flex-start">
        {/* Header with Balance */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 2 }}>
            <Box>
              <Typography variant="h4" component="h1">
                안녕하세요, {child?.name}님!
              </Typography>
              <Typography variant="h6" color="primary">
                현재 잔액: {child?.balance?.toLocaleString() || 0}원
              </Typography>
            </Box>
            <Chip
              icon={<AccountBalanceIcon />}
              label={`신용점수: ${child?.creditScore || 0}`}
              color="primary"
              variant="outlined"
            />
          </Paper>
        </Grid>

        {/* 통계 카드 */}
        <Grid item xs={12}>
          <Grid container spacing={2} alignItems="stretch">
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2, display: 'flex', alignItems: 'center', boxShadow: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}><StarIcon /></Avatar>
                <Box>
                  <Typography variant="subtitle2">누적 획득 포인트</Typography>
                  <Typography variant="h6">{totalPointsEarned.toLocaleString()}점</Typography>
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2, display: 'flex', alignItems: 'center', boxShadow: 2 }}>
                <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}><ShoppingCartIcon /></Avatar>
                <Box>
                  <Typography variant="subtitle2">누적 사용 포인트</Typography>
                  <Typography variant="h6">{totalPointsUsed.toLocaleString()}점</Typography>
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2, display: 'flex', alignItems: 'center', boxShadow: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}><SavingsIcon /></Avatar>
                <Box>
                  <Typography variant="subtitle2">저축 목표 달성률</Typography>
                  <Typography variant="h6">{savingsProgress}%</Typography>
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2, display: 'flex', alignItems: 'center', boxShadow: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}><CheckCircleIcon /></Avatar>
                <Box>
                  <Typography variant="subtitle2">미션 완료율</Typography>
                  <Typography variant="h6">{missionCompletionRate}%</Typography>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Quick Actions & 구매 내역 */}
        <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Paper sx={{ p: 2, boxShadow: 1, flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 320 }}>
            <Typography variant="h6" gutterBottom>
              메뉴
            </Typography>
            <List>
              <ListItem button onClick={() => window.location.href = '/child/quiz'}>
                <SchoolIcon sx={{ mr: 2 }} />
                <ListItemText primary="금융 퀴즈" />
              </ListItem>
              <ListItem button onClick={() => window.location.href = '/child/missions'}>
                <EmojiEventsIcon sx={{ mr: 2 }} />
                <ListItemText primary="미션" />
              </ListItem>
              <ListItem button onClick={() => window.location.href = '/child/store'}>
                <StoreIcon sx={{ mr: 2 }} />
                <ListItemText primary="상점" />
              </ListItem>
            </List>

            {/* 최근 구매 내역 */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>최근 구매 내역</Typography>
              {recentPurchases.length > 0 ? (
                <List>
                  {recentPurchases.map((purchase, idx) => (
                    <ListItem key={idx}>
                      <ListItemText
                        primary={purchase.name}
                        secondary={`${purchase.purchasedAt} | ${purchase.points.toLocaleString()}점 | ${purchase.category}`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">구매 내역이 없습니다.</Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Savings Goal */}
        <Grid item xs={12} md={8} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Paper sx={{ p: 2, boxShadow: 1, flexGrow: 1, minHeight: 320 }}>
            <Typography variant="h6" gutterBottom>
              저축 목표
            </Typography>
            {child?.savings && child.savings.length > 0 ? (
              child.savings.map(goal => (
                <Box key={goal.id} sx={{ mb: 2 }}>
                  <Typography variant="body1" gutterBottom>
                    {goal.title} (목표: {goal.targetAmount.toLocaleString()}원)
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(goal.currentAmount / goal.targetAmount) * 100}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    현재: {goal.currentAmount.toLocaleString()}원
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography color="text.secondary">저축 목표가 없습니다.</Typography>
            )}
          </Paper>
        </Grid>

        {/* Active Missions */}
        <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Paper sx={{ p: 2, boxShadow: 1, flexGrow: 1, minHeight: 320 }}>
            <Typography variant="h6" gutterBottom>
              진행 중인 미션
            </Typography>
            <List>
              {activeMissions.length > 0 ? activeMissions.map((mission) => (
                <Box key={mission.id}>
                  <ListItem>
                    <ListItemText
                      primary={mission.title}
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={mission.progress}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            보상: {mission.reward?.toLocaleString() || 0}원
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  <Divider />
                </Box>
              )) : <Typography color="text.secondary" sx={{ p: 2 }}>진행 중인 미션이 없습니다.</Typography>}
            </List>
          </Paper>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Paper sx={{ p: 2, boxShadow: 1, flexGrow: 1, minHeight: 320 }}>
            <Typography variant="h6" gutterBottom>
              최근 활동
            </Typography>
            <List>
              {recentActivities.length > 0 ? recentActivities.map((activity) => (
                <Box key={activity.id}>
                  <ListItem>
                    <ListItemText
                      primary={activity.title}
                      secondary={`${activity.date} | ${activity.points}점 획득`}
                    />
                    <Chip
                      label={activity.type}
                      size="small"
                      color={activity.type === '퀴즈' ? 'primary' : 'secondary'}
                    />
                  </ListItem>
                  <Divider />
                </Box>
              )) : <Typography color="text.secondary" sx={{ p: 2 }}>최근 활동이 없습니다.</Typography>}
            </List>
          </Paper>
        </Grid>

        {/* Loan Request */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, boxShadow: 1, flexGrow: 1, minHeight: 320 }}>
            <Typography variant="h6" gutterBottom>
              대출 요청
            </Typography>
            <Button variant="contained" color="secondary" sx={{ mb: 2 }} onClick={() => setOpenLoanDialog(true)}>
              대출 요청
            </Button>
            {/* 대출 요청 다이얼로그 */}
            <Dialog open={openLoanDialog} onClose={() => setOpenLoanDialog(false)} maxWidth="xs" fullWidth>
              <DialogTitle>대출 요청</DialogTitle>
              <DialogContent>
                {loanError && <Alert severity="error" sx={{ mb: 2 }}>{loanError}</Alert>}
                <TextField
                  fullWidth
                  label="금액"
                  name="amount"
                  type="number"
                  value={loanForm.amount}
                  onChange={e => setLoanForm(f => ({ ...f, amount: e.target.value }))}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="사유"
                  name="reason"
                  value={loanForm.reason}
                  onChange={e => setLoanForm(f => ({ ...f, reason: e.target.value }))}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="상환 기간(일)"
                  name="period"
                  type="number"
                  value={loanForm.period}
                  onChange={e => setLoanForm(f => ({ ...f, period: e.target.value }))}
                  margin="normal"
                  required
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenLoanDialog(false)}>취소</Button>
                <Button onClick={handleRequestLoan} variant="contained">요청</Button>
              </DialogActions>
            </Dialog>
            {/* 대출 내역 표시 */}
            {child?.loans && child.loans.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6">대출 내역</Typography>
                {repayError && <Alert severity="error" sx={{ mb: 2 }}>{repayError}</Alert>}
                <List>
                  {child.loans.map((loan, idx) => {
                    const ANNUAL_RATE = 0.05;
                    const days = Number(loan.period);
                    const interest = Math.round(loan.amount * ANNUAL_RATE * (days / 365));
                    const repayAmount = loan.amount + interest;
                    return (
                      <ListItem key={loan.id}>
                        <ListItemText
                          primary={`대출: ${loan.amount.toLocaleString()}원 | 이자율: ${(ANNUAL_RATE * 100).toFixed(1)}% | 상태: ${loan.status}`}
                          secondary={`승인일: ${loan.approvedAt} | 상환기한: ${loan.dueDate || '-'} | 사유: ${loan.reason} | 상환액: ${repayAmount.toLocaleString()}원`}
                        />
                        {!loan.repaid && (
                          <Button variant="contained" color="primary" onClick={() => handleRepayLoan({ ...loan, interest, repayAmount })}>
                            상환
                          </Button>
                        )}
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default ChildDashboard; 
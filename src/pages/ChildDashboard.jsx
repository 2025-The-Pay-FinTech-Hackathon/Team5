import React, { useState, useEffect } from 'react';
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
  CardActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  LinearProgress,
  useTheme,
  useMediaQuery,
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
  ListAlt as ListAltIcon,
  Favorite as FavoriteIcon,
  Chat as ChatIcon,
  People as PeopleIcon,
  Memory as MemoryIcon,
} from '@mui/icons-material';
import { findChildById, updateChild } from '../utils/localData';
import { getChildStats } from '../utils/childUtils';
import { getRecentTransactions } from '../utils/transactionUtils';
import ChatbotWidget from '../components/ChatbotWidget';

const ChildDashboard = () => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem('user'));
  const [child, setChild] = useState(null);
  const [openLoanDialog, setOpenLoanDialog] = useState(false);
  const [loanForm, setLoanForm] = useState({ amount: '', reason: '', period: '' });
  const [loanError, setLoanError] = useState('');
  const [repayError, setRepayError] = useState('');
  const [stats, setStats] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [partialRepayAmount, setPartialRepayAmount] = useState({});

  useEffect(() => {
    const loadData = async () => {
      const childStats = await getChildStats(user.id);
      setStats(childStats);
      
      const transactions = await getRecentTransactions(user.id);
      setRecentTransactions(transactions);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (user?.role === 'child') {
      const latest = findChildById(user.id);
      if (JSON.stringify(latest) !== JSON.stringify(child)) {
        setChild(latest);
      }
    }
    // eslint-disable-next-line
  }, [user, location.pathname]);

  // 최근 활동(미션, 퀴즈, 메모리게임 등)
  const recentActivities = [
    ...(child?.missions || []).slice(-2).map(m => ({
      id: m.id,
      type: '미션',
      title: m.title,
      points: m.reward || 0,
      date: m.completedAt || m.deadline || '',
    })),
    ...(child?.quizResults || []).slice(-2).map(q => ({
      id: q.id,
      type: '퀴즈',
      title: '금융 퀴즈',
      points: q.score || 0,
      date: q.date || '',
    })),
    ...(child?.memoryGameResults || []).slice(-2).map(g => ({
      id: g.id,
      type: '메모리게임',
      title: '카드 매칭 게임',
      points: g.points || 0,
      date: g.date || '',
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  // 진행 중 미션
  const activeMissions = (child?.missions || []).filter(m => m.status === '진행중');

  // 주요 현황 정보 계산
  const creditScore = typeof child?.creditScore === 'number' ? child.creditScore : 700;
  const balance = typeof child?.balance === 'number' ? child.balance : 0;
  // 누적 획득 포인트: 미션, 퀴즈, 메모리게임
  const totalPointsEarned =
    (child?.missions || []).reduce((sum, m) => sum + (m.status === '완료' ? Number(m.reward || 0) : 0), 0) +
    (child?.quizResults || []).reduce((sum, q) => sum + (q.score || 0), 0) +
    (child?.memoryGameResults || []).reduce((sum, g) => sum + (g.points || 0), 0);
  // 누적 사용 포인트: 상점 구매 내역
  const totalPointsUsed = Array.isArray(child?.purchases) ? child.purchases.reduce((sum, p) => sum + (p.points || 0), 0) : 0;
  // 보유 포인트
  const currentPoints = child?.points || 0;

  // 모든 거래내역(가계부, 저축, 용돈 등) 합산
  const allTransactions = (child?.ledgers || []).map(l => ({
    id: l.id || Date.now() + Math.random(),
    description: l.memo || l.type || '거료',
    amount: l.type === '입금' ? l.amount : -Math.abs(l.amount),
    date: l.date,
    status: '완료',
  })).sort((a, b) => (b.date > a.date ? 1 : -1));

  // 대출 정책 상수
  const getLoanLimit = (creditScore) => creditScore * 1000;
  const getInterestRate = (creditScore) => {
    if (creditScore >= 800) return 0.03;
    if (creditScore >= 700) return 0.05;
    return 0.08;
  };

  // 실제 저축/미션 현황 계산
  const savingsList = Array.isArray(child?.savings) ? child.savings : [];
  const savingsGoal = savingsList.length > 0 ? savingsList.reduce((sum, s) => sum + (s.targetAmount || 0), 0) : 0;
  const currentSavings = savingsList.length > 0 ? savingsList.reduce((sum, s) => sum + (s.currentAmount || 0), 0) : 0;
  const missionsList = Array.isArray(child?.missions) ? child.missions : [];
  const completedMissions = missionsList.filter(m => m.status === '완료').length;
  const totalMissions = missionsList.length;

  // 대출 요청 핸들러 개선
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
    if ((latestChild.loanRequests || []).some(r => r.status === 'pending')) {
      setLoanError('진행 중인 대출 신청이 있습니다.');
      return;
    }
    if ((latestChild.loans || []).some(l => l.status === 'active')) {
      setLoanError('상환 전 대출이 있습니다.');
      return;
    }
    if ((latestChild.creditScore || 700) < 700) {
      setLoanError('신용점수 700점 이상만 대출 신청이 가능합니다.');
      return;
    }
    const loanLimit = getLoanLimit(latestChild.creditScore || 700);
    if (Number(loanForm.amount) > loanLimit) {
      setLoanError(`대출 한도는 ${loanLimit.toLocaleString()}원 입니다.`);
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

  // 대출 상환 핸들러 개선(조기상환 이자 감면)
  const handleRepayLoan = (loan) => {
    setRepayError('');
    const today = new Date();
    const dueDate = loan.dueDate ? new Date(loan.dueDate) : null;
    let repayAmount = loan.repayAmount || (loan.amount + (loan.interest || 0));
    let interestSaved = 0;
    if (dueDate && today < dueDate) {
      // 조기상환: 이자 50% 감면
      interestSaved = (loan.interest || 0) * 0.5;
      repayAmount = loan.amount + (loan.interest || 0) - interestSaved;
    }
    if ((child.balance || 0) < repayAmount) {
      setRepayError('잔액이 부족합니다.');
      return;
    }
    const updated = { ...child };
    updated.balance = (updated.balance || 0) - repayAmount;
    updated.loanAmount = (updated.loanAmount || 0) - loan.amount;
    updated.loans = (updated.loans || []).map(l => l.id === loan.id ? { ...l, repaid: true, status: 'repaid', repaidAt: new Date().toISOString().slice(0, 10), interestSaved } : l);
    updated.creditScore = (updated.creditScore || 600) + 20; // 상환 시 신용도 일부 회복
    updated.ledgers = [
      { type: '상환', amount: repayAmount, date: new Date().toISOString().slice(0, 10), memo: '대출 상환' },
      ...(updated.ledgers || []),
    ];
    updateChild(updated);
    setChild(updated);
  };

  // 일부 상환 핸들러
  const handlePartialRepayLoan = (loan) => {
    setRepayError('');
    const inputAmount = Number(partialRepayAmount[loan.id] || 0);
    if (!inputAmount || isNaN(inputAmount) || inputAmount <= 0) {
      setRepayError('상환 금액을 올바르게 입력하세요.');
      return;
    }
    if ((child.balance || 0) < inputAmount) {
      setRepayError('잔액이 부족합니다.');
      return;
    }
    if (inputAmount > (loan.amount + (loan.interest || 0))) {
      setRepayError('상환 금액이 대출 잔액을 초과합니다.');
      return;
    }
    // 조기상환 이자 감면(상환액이 원금+이자 전액일 때만 적용)
    let interestSaved = 0;
    let isFullRepay = false;
    let repayAmount = inputAmount;
    if (inputAmount === loan.amount + (loan.interest || 0)) {
      // 전액 상환
      const today = new Date();
      const dueDate = loan.dueDate ? new Date(loan.dueDate) : null;
      if (dueDate && today < dueDate) {
        interestSaved = (loan.interest || 0) * 0.5;
        repayAmount = loan.amount + (loan.interest || 0) - interestSaved;
      }
      isFullRepay = true;
    }
    const updated = { ...child };
    updated.balance = (updated.balance || 0) - repayAmount;
    updated.loanAmount = (updated.loanAmount || 0) - (isFullRepay ? loan.amount : (inputAmount > loan.amount ? loan.amount : inputAmount));
    updated.loans = (updated.loans || []).map(l => {
      if (l.id === loan.id) {
        if (isFullRepay) {
          return { ...l, repaid: true, status: 'repaid', repaidAt: new Date().toISOString().slice(0, 10), interestSaved };
        } else {
          // 부분 상환: 원금 우선 차감, 남은 원금/이자 계산
          let remainAmount = l.amount + (l.interest || 0) - inputAmount;
          let remainPrincipal = l.amount - inputAmount;
          if (remainPrincipal < 0) remainPrincipal = 0;
          return { ...l, amount: remainPrincipal, repayAmount: remainAmount, partialRepay: true };
        }
      }
      return l;
    });
    updated.creditScore = (updated.creditScore || 600) + (isFullRepay ? 20 : 5); // 전액 상환 시 20, 부분 상환 시 5점 회복
    updated.ledgers = [
      { type: '상환', amount: repayAmount, date: new Date().toISOString().slice(0, 10), memo: isFullRepay ? '대출 전액 상환' : '대출 일부 상환' },
      ...(updated.ledgers || []),
    ];
    updateChild(updated);
    setChild(updated);
    setPartialRepayAmount({ ...partialRepayAmount, [loan.id]: '' });
  };

  // 빠른 기능에 대출 신청 버튼 추가
  const quickActions = [
    { icon: <SchoolIcon />, label: '금융 퀴즈', onClick: () => navigate('/child/quiz') },
    { icon: <EmojiEventsIcon />, label: '미션', onClick: () => navigate('/child/missions') },
    { icon: <SavingsIcon />, label: '저축', onClick: () => navigate('/child/savings') },
    { icon: <StoreIcon />, label: '보상 상점', onClick: () => navigate('/child/store') },
    { icon: <AccountBalanceIcon />, label: '대출 신청', onClick: () => setOpenLoanDialog(true) },
    { icon: <ChatIcon />, label: '메시지', onClick: () => navigate('/child/messages') },
    { icon: <PeopleIcon />, label: '소셜', onClick: () => navigate('/child/social') },
    { icon: <MemoryIcon />, label: '카드 매칭 게임', onClick: () => navigate('/memory-game') },
  ];

  if (!stats) return null;

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: '#FFFDE7',
      pt: { xs: '56px', sm: '64px' },
      pb: 4
    }}>
      {/* 상단 배너 */}
      <Box
        sx={{
          bgcolor: '#FFD600',
          py: { xs: 5, md: 8 },
          mb: 4,
          position: 'relative',
          overflow: 'hidden',
          minHeight: { xs: 180, md: 240 },
          borderRadius: 0,
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              mb: 2,
              color: '#222',
              zIndex: 2,
              position: 'relative',
            }}
          >
            안녕하세요, {user?.name}님!
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: '#666',
              fontWeight: 500,
              zIndex: 2,
              position: 'relative',
            }}
          >
            오늘도 금융 습관을 키워봐요
          </Typography>
        </Container>
        {/* 라이언 이미지 */}
        <Box
          component="img"
          src="/ryan-coin.png"
          alt="Ryan Coin"
          sx={{
            position: 'absolute',
            right: { xs: 24, md: 60 },
            top: { xs: 24, md: 32 },
            width: { xs: 110, sm: 150, md: 210, lg: 240 },
            height: 'auto',
            zIndex: 0,
            userSelect: 'none',
            pointerEvents: 'none',
            objectFit: 'contain',
          }}
        />
      </Box>

      <Container maxWidth="lg">
        {/* 빠른 기능 */}
        <Paper sx={{ 
          p: 3, 
          mb: 4,
          borderRadius: 2,
          bgcolor: '#fff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
            빠른 기능
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            {quickActions.map((action, idx) => (
              <Button
                key={action.label}
                variant="contained"
                color="primary"
                startIcon={action.icon}
                onClick={e => {
                  e.preventDefault();
                  action.onClick();
                }}
                sx={{ fontWeight: 600, bgcolor: '#FFD600', color: '#222', '&:hover': { bgcolor: '#FFE066' } }}
              >
                {action.label}
              </Button>
            ))}
          </Box>
        </Paper>

        {/* 나의 현황 */}
        <Paper sx={{ 
          p: 3, 
          mb: 4,
          borderRadius: 2,
          bgcolor: '#fff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
            나의 현황
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 16px #F5F5F5', bgcolor: '#FFF', border: '1px solid #F5F5F5' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                    신용/잔액
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                    <Chip label={`신용점수: ${creditScore}`} sx={{ bgcolor: '#40A9FF', color: '#fff', fontWeight: 600, borderRadius: 2, boxShadow: '0 2px 8px #F5F5F5' }} icon={<StarIcon sx={{ color: '#40A9FF' }} />} />
                    <Chip label={`잔액: ${balance.toLocaleString()}원`} sx={{ bgcolor: '#FFD600', color: '#222', fontWeight: 600, borderRadius: 2, boxShadow: '0 2px 8px #F5F5F5' }} icon={<AccountBalanceIcon sx={{ color: '#FFD600' }} />} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 16px #F5F5F5', bgcolor: '#FFF', border: '1px solid #F5F5F5' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                    포인트 현황
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                    <Chip label={`보유: ${currentPoints.toLocaleString()}점`} sx={{ bgcolor: '#FFD600', color: '#222', fontWeight: 600, borderRadius: 2, boxShadow: '0 2px 8px #F5F5F5' }} icon={<StarIcon sx={{ color: '#FFD600' }} />} />
                    <Chip label={`누적 획득: ${totalPointsEarned}점`} sx={{ bgcolor: '#FF9800', color: '#fff', fontWeight: 600, borderRadius: 2, boxShadow: '0 2px 8px #F5F5F5' }} icon={<StarIcon sx={{ color: '#FF9800' }} />} />
                    <Chip label={`사용: ${totalPointsUsed}점`} sx={{ bgcolor: '#FFB6B6', color: '#222', fontWeight: 600, borderRadius: 2, boxShadow: '0 2px 8px #F5F5F5' }} icon={<ShoppingCartIcon sx={{ color: '#FFB6B6' }} />} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  {/* 저축 현황 카드 */}
                  <Card sx={{ borderRadius: 3, boxShadow: '0 4px 16px #F5F5F5', bgcolor: '#FFF', border: '1px solid #F5F5F5' }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                        저축 현황
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          목표 금액: {savingsGoal.toLocaleString()}원
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={savingsGoal > 0 ? (currentSavings / savingsGoal) * 100 : 0}
                          sx={{ height: 10, borderRadius: 5, bgcolor: '#FFF9C4', '& .MuiLinearProgress-bar': { bgcolor: '#FFD600' } }}
                        />
                        <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
                          현재 저축액: {currentSavings.toLocaleString()}원
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        startIcon={<SavingsIcon />}
                        onClick={() => navigate('/child/savings')}
                        sx={{ bgcolor: '#FFD600', color: '#222', '&:hover': { bgcolor: '#FFE066' }, fontWeight: 600, borderRadius: 2 }}
                      >
                        저축하기
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  {/* 미션 현황 카드 */}
                  <Card sx={{ borderRadius: 3, boxShadow: '0 4px 16px #F5F5F5', bgcolor: '#FFF', border: '1px solid #F5F5F5' }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                        미션 현황
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          완료한 미션: {completedMissions}개
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0}
                          sx={{ height: 10, borderRadius: 5, bgcolor: '#FFF9C4', '& .MuiLinearProgress-bar': { bgcolor: '#FFD600' } }}
                        />
                        <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
                          남은 미션: {totalMissions - completedMissions}개
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        startIcon={<EmojiEventsIcon />}
                        onClick={() => navigate('/child/missions')}
                        sx={{ bgcolor: '#FFD600', color: '#222', '&:hover': { bgcolor: '#FFE066' }, fontWeight: 600, borderRadius: 2 }}
                      >
                        미션 보기
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Paper>

        {/* 최근 활동 */}
        <Paper sx={{ 
          p: 3, 
          mb: 4,
          borderRadius: 2,
          bgcolor: '#fff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
            최근 활동
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>날짜</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>활동</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>내용</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>획득 포인트</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentActivities.map((activity, idx) => (
                  <TableRow key={activity.type + '-' + (activity.id || idx) + '-' + activity.date}>
                    <TableCell>{new Date(activity.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={activity.type}
                        color={
                          activity.type === '미션' ? 'primary' :
                          activity.type === '퀴즈' ? 'success' :
                          'warning'
                        }
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>{activity.title}</TableCell>
                    <TableCell sx={{ 
                      color: '#FFD600',
                      fontWeight: 600
                    }}>
                      +{activity.points.toLocaleString()}점
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* 진행 중 대출 내역 및 상환 */}
        <Paper sx={{ p: 3, mb: 4, borderRadius: 2, bgcolor: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
            진행 중 대출
          </Typography>
          {(child?.loans || []).filter(l => l.status === 'active').length === 0 ? (
            <Typography color="text.secondary">진행 중인 대출이 없습니다.</Typography>
          ) : (
            (child.loans || []).filter(l => l.status === 'active').map((loan) => (
              <Box key={loan.id} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 2 }}>
                <Typography>금액: {loan.amount.toLocaleString()}원 / 이자: {loan.interest?.toLocaleString() || 0}원 / 상환액: {loan.repayAmount?.toLocaleString() || 0}원</Typography>
                <Typography>기간: {loan.period}개월 / 만기일: {loan.dueDate}</Typography>
                <Typography>사유: {loan.reason}</Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
                  <TextField
                    size="small"
                    type="number"
                    label="상환 금액"
                    value={partialRepayAmount[loan.id] || ''}
                    onChange={e => setPartialRepayAmount({ ...partialRepayAmount, [loan.id]: e.target.value })}
                    sx={{ width: 120 }}
                  />
                  <Button size="small" variant="contained" color="info" onClick={() => handlePartialRepayLoan(loan)}>
                    일부 상환
                  </Button>
                  <Button size="small" variant="contained" color="success" onClick={() => handleRepayLoan(loan)}>
                    전액 상환
                  </Button>
                </Box>
                {repayError && <Alert severity="error" sx={{ mt: 1 }}>{repayError}</Alert>}
                {loan.repaid && <Alert severity="success" sx={{ mt: 1 }}>상환 완료</Alert>}
              </Box>
            ))
          )}
        </Paper>

        {/* 대출 신청 다이얼로그 */}
        <Dialog open={openLoanDialog} onClose={() => setOpenLoanDialog(false)} maxWidth="xs" fullWidth>
          <DialogTitle>대출 신청</DialogTitle>
          <DialogContent>
            {loanError && <Alert severity="error" sx={{ mb: 2 }}>{loanError}</Alert>}
            <TextField
              fullWidth
              label="대출 금액"
              type="number"
              value={loanForm.amount}
              onChange={e => setLoanForm({ ...loanForm, amount: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="대출 사유"
              value={loanForm.reason}
              onChange={e => setLoanForm({ ...loanForm, reason: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="기간(개월)"
              type="number"
              value={loanForm.period}
              onChange={e => setLoanForm({ ...loanForm, period: e.target.value })}
              sx={{ mb: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenLoanDialog(false)}>취소</Button>
            <Button variant="contained" onClick={handleRequestLoan} sx={{ bgcolor: '#FFD600', color: '#222', fontWeight: 600 }}>
              신청
            </Button>
          </DialogActions>
        </Dialog>

        {/* 최근 거래 내역 */}
        <Paper sx={{ 
          p: 3,
          borderRadius: 2,
          bgcolor: '#fff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
            최근 거래 내역
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>날짜</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>내용</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>금액</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>상태</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allTransactions.map((transaction, idx) => (
                  <TableRow key={transaction.id + '-' + idx + '-' + transaction.date}>
                    <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell sx={{ 
                      color: transaction.amount > 0 ? '#2e7d32' : '#d32f2f',
                      fontWeight: 600
                    }}>
                      {transaction.amount.toLocaleString()}원
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.status}
                        color={transaction.status === '완료' ? 'success' : 'warning'}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>
      {/* 오른쪽 하단 챗봇 위젯 */}
      <ChatbotWidget userContext={{
        name: child?.name,
        points: child?.points,
        balance: child?.balance,
        loans: child?.loans,
        loanRequests: child?.loanRequests
      }} />
    </Box>
  );
};

export default ChildDashboard; 
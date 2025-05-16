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
} from '@mui/icons-material';
import { findChildById, updateChild } from '../utils/localData';
import { getChildStats } from '../utils/childUtils';
import { getRecentTransactions } from '../utils/transactionUtils';

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

  // 주요 현황 정보 계산
  const creditScore = typeof child?.creditScore === 'number' ? child.creditScore : 700;
  const balance = typeof child?.balance === 'number' ? child.balance : 0;
  const totalPointsEarned = (child?.missions || []).reduce((sum, m) => sum + (m.status === '완료' ? Number(m.reward || 0) : 0), 0);
  const totalPointsUsed = Array.isArray(child?.purchases) ? child.purchases.reduce((sum, p) => sum + (p.points || 0), 0) : 0;

  // 모든 거래내역(가계부, 저축, 용돈 등) 합산
  const allTransactions = (child?.ledgers || []).map(l => ({
    id: l.id || Date.now() + Math.random(),
    description: l.memo || l.type || '거료',
    amount: l.type === '입금' ? l.amount : -Math.abs(l.amount),
    date: l.date,
    status: '완료',
  })).sort((a, b) => (b.date > a.date ? 1 : -1));

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

  const quickActions = [
    { icon: <SchoolIcon />, label: '금융 퀴즈', path: '/child/quiz' },
    { icon: <EmojiEventsIcon />, label: '미션', path: '/child/missions' },
    { icon: <SavingsIcon />, label: '저축', path: '/child/savings' },
    { icon: <StoreIcon />, label: '보상 상점', path: '/child/store' },
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
          <Grid container spacing={2}>
            {quickActions.map((action) => (
              <Grid item xs={6} sm={3} key={action.label}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={action.icon}
                  onClick={() => navigate(action.path)}
                  sx={{
                    py: 2,
                    bgcolor: '#FFD600',
                    color: '#222',
                    '&:hover': {
                      bgcolor: '#FFE066',
                    },
                    fontWeight: 600,
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                >
                  {action.label}
                </Button>
              </Grid>
            ))}
          </Grid>
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
                    <Chip label={`누적 획득: ${totalPointsEarned}점`} sx={{ bgcolor: '#FF9800', color: '#fff', fontWeight: 600, borderRadius: 2, boxShadow: '0 2px 8px #F5F5F5' }} icon={<StarIcon sx={{ color: '#FF9800' }} />} />
                    <Chip label={`사용: ${totalPointsUsed}점`} sx={{ bgcolor: '#FFB6B6', color: '#222', fontWeight: 600, borderRadius: 2, boxShadow: '0 2px 8px #F5F5F5' }} icon={<ShoppingCartIcon sx={{ color: '#FFB6B6' }} />} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  {/* 기존 저축 현황 카드 */}
                  <Card sx={{ borderRadius: 3, boxShadow: '0 4px 16px #F5F5F5', bgcolor: '#FFF', border: '1px solid #F5F5F5' }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                        저축 현황
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          목표 금액: {stats.savingsGoal.toLocaleString()}원
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={(stats.currentSavings / stats.savingsGoal) * 100}
                          sx={{ height: 10, borderRadius: 5, bgcolor: '#FFF9C4', '& .MuiLinearProgress-bar': { bgcolor: '#FFD600' } }}
                        />
                        <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
                          현재 저축액: {stats.currentSavings.toLocaleString()}원
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
                  {/* 기존 미션 현황 카드 */}
                  <Card sx={{ borderRadius: 3, boxShadow: '0 4px 16px #F5F5F5', bgcolor: '#FFF', border: '1px solid #F5F5F5' }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                        미션 현황
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          완료한 미션: {stats.completedMissions}개
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={(stats.completedMissions / stats.totalMissions) * 100}
                          sx={{ height: 10, borderRadius: 5, bgcolor: '#FFF9C4', '& .MuiLinearProgress-bar': { bgcolor: '#FFD600' } }}
                        />
                        <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
                          남은 미션: {stats.totalMissions - stats.completedMissions}개
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
                {allTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
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
    </Box>
  );
};

export default ChildDashboard; 
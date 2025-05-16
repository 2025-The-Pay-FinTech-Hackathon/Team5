import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  List,
  ListItem,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Avatar,
  Chip,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  Savings as SavingsIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  EmojiEvents as EmojiEventsIcon,
  ListAlt as ListAltIcon,
  Favorite as FavoriteIcon,
  ShoppingCart as ShoppingCartIcon,
  Chat as ChatIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { fetchChildrenByParent, createChild,sendAllowance,deleteChild } from '../utils/api';

import ryanCoin from '../assets/ryan-coin.png';
import { getRecentTransactions } from '../utils/transactionUtils';

function randomPassword(length = 6) {
  return Math.random().toString(36).slice(-length);
}

function ParentDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // 로그인한 부모 정보 가져오기
  const parentId = JSON.parse(sessionStorage.getItem('user'))?.id;
  const [children, setChildren] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openSendDialog, setOpenSendDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);
  const [addForm, setAddForm] = useState({ name: '', email: '', password: '' });
  const [sendAmount, setSendAmount] = useState('');
  const [error, setError] = useState('');
  const [newChildInfo, setNewChildInfo] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loanRequests, setLoanRequests] = useState([]);
  const [ledgerPage, setLedgerPage] = useState(0);
  const ledgersPerPage = 10;
  // 모든 자녀의 ledgers를 날짜 내림차순으로 합침
  const allLedgers = children.flatMap(child => (child.ledgers || []).map(l => ({ ...l, childName: child.name })))
    .sort((a, b) => (b.date > a.date ? 1 : -1));
  const pagedLedgers = allLedgers.slice(ledgerPage * ledgersPerPage, (ledgerPage + 1) * ledgersPerPage);

  // 대출 정책 상수
  const getLoanLimit = (creditScore) => creditScore * 1000;
  const getInterestRate = (creditScore) => {
    if (creditScore >= 800) return 0.03;
    if (creditScore >= 700) return 0.05;
    return 0.08;
  };

  // 대출 관리 모달 상태
  const [openLoanDialog, setOpenLoanDialog] = useState(false);
  const [loanChild, setLoanChild] = useState(null);
  const [loanActionError, setLoanActionError] = useState('');

  useEffect(() => {
  const loadData = async () => {
    const user = JSON.parse(sessionStorage.getItem('user'));
    try {
      const response = await fetchChildrenByParent(user.id);
      setChildren(response.data);
    } catch (err) {
      console.error('자녀 목록 조회 실패:', err);
    }
  };
  loadData();
}, []);


  useEffect(() => {
  const reloadChildren = async () => {
    try {
      const response = await fetchChildrenByParent(parentId);
      setChildren(response.data);
    } catch (err) {
      console.error('자녀 목록 재조회 실패:', err);
    }
  };
  if (parentId) reloadChildren();
}, [parentId, location.pathname]);


  // 자녀 추가
  const handleAddChild = async () => {
  setError('');
  if (!addForm.name || !addForm.email || !addForm.password) {
    setError('이름, 이메일, 비밀번호를 모두 입력해주세요.');
    return;
  }

  try {
    const newChild = {
      name: addForm.name,
      email: addForm.email,
      password: addForm.password,
      parentId,
    };

    const response = await createChild(newChild);
    setChildren(prev => [...prev, response.data]); // 자녀 목록에 새 자녀 추가
    setNewChildInfo({ email: response.data.email, password: response.data.password });
    setAddForm({ name: '', email: '', password: '' });
    setOpenAddDialog(false);
    setSnackbar({
      open: true,
      message: '자녀가 추가되었습니다.',
      severity: 'success',
    });
  } catch (err) {
    const msg = err.response?.data?.error || '서버 오류';
    setError(msg);
  }
};


  const handleRejectLoan = (request) => {
    setLoanActionError('');
    const child = children.find(c => c.id === request.childId);
    if (!child) return;
    const updated = { ...child };
    updated.loanRequests = (updated.loanRequests || []).filter(r => r.id !== request.id);
    updated.creditScore = (updated.creditScore || 700) - 10; // 거절 시 신용도 소폭 하락
    updateChild(updated);
    setChildren(getChildrenByParent(parentId));
    setOpenLoanDialog(false);
  };

  const handleRepayLoan = (loan, child) => {
    setLoanActionError('');
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
      setLoanActionError('잔액이 부족합니다.');
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
    setChildren(getChildrenByParent(parentId));
    setOpenLoanDialog(false);
  };

  // 용돈 보내기
  const handleSendAllowance = async () => {
  if (!sendAmount || isNaN(sendAmount) || Number(sendAmount) <= 0) return;
  if (!selectedChild) return;

  try {
    await sendAllowance(selectedChild._id || selectedChild.id, Number(sendAmount)); // ✅ id 확인
    setSnackbar({
      open: true,
      message: '용돈을 성공적으로 보냈습니다.',
      severity: 'success',
    });
    setOpenSendDialog(false);
    setSendAmount('');
    // 목록 갱신
    const response = await fetchChildrenByParent(parentId);
    setChildren(response.data);
  } catch (err) {
    const msg = err.response?.data?.error || '서버 오류';
    setSnackbar({
      open: true,
      message: msg,
      severity: 'error',
    });
  }
};


  // 상세보기
  const handleOpenDetail = (child) => {
    setSelectedChild(child);
    setOpenDetailDialog(true);
  };

  // 통계 계산 함수
  const getChildStats = (child) => {
    const totalPointsEarned = (child.missions || []).reduce((sum, m) => sum + (m.status === '완료' ? Number(m.reward || 0) : 0), 0);
    const totalPointsUsed = (child.purchases || []).reduce((sum, p) => sum + (p.points || 0), 0);
    const savingsGoals = child.savings || [];
    const savingsProgress = savingsGoals.length > 0 ? Math.round(savingsGoals.reduce((sum, g) => sum + (g.currentAmount / g.targetAmount), 0) / savingsGoals.length * 100) : 0;
    const missionsTotal = (child.missions || []).length;
    const missionsCompleted = (child.missions || []).filter(m => m.status === '완료').length;
    const missionCompletionRate = missionsTotal > 0 ? Math.round((missionsCompleted / missionsTotal) * 100) : 0;
    return { totalPointsEarned, totalPointsUsed, savingsProgress, missionCompletionRate };
  };

  // 데이터 내보내기
  const handleExport = () => {
    const data = getDondoliData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'dondoliData.json';
    a.click();
  };

  // 데이터 불러오기
  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const json = JSON.parse(e.target.result);
        setDondoliData(json);
      };
      reader.readAsText(file);
    }
  };

  // 용돈 보내기 다이얼로그 열 때 자녀 자동 선택
  const handleOpenSendDialog = () => {
    if (children.length > 0) setSelectedChild(children[0]);
    setOpenSendDialog(true);
  };

  const quickActions = [
    { icon: <SavingsIcon />, label: '저축 관리', path: '/parent/savings' },
    { icon: <EmojiEventsIcon />, label: '미션 관리', path: '/parent/missions' },
    { icon: <ListAltIcon />, label: '가계부', path: '/parent/ledger' },
    { icon: <FavoriteIcon />, label: '위시리스트', path: '/parent/wishlist' },
    { icon: <ChatIcon />, label: '메시지', path: '/parent/messages' },
    { icon: <PeopleIcon />, label: '소셜', path: '/parent/social' },
    { icon: <AccountBalanceIcon />, label: '용돈 보내기', path: null, onClick: handleOpenSendDialog },
  ];

  // 최근 거래 내역: 모든 자녀의 ledgers(가계부), 저축, 용돈 등 합산
  const allTransactions = children.flatMap(child =>
    (child.ledgers || []).map(l => ({
      id: l.id || Date.now() + Math.random(),
      childName: child.name,
      description: l.memo || l.type || '거래',
      amount: l.type === '입금' ? l.amount : -Math.abs(l.amount),
      date: l.date,
      status: '완료',
    }))
  ).sort((a, b) => (b.date > a.date ? 1 : -1));

  // 자녀 삭제 핸들러
  const handleDeleteChild = async (childId) => {
  try {
    await deleteChild(childId);

    // ✅ 삭제 후 최신 목록 재조회
    const response = await fetchChildrenByParent(parentId);
    setChildren(response.data);

    setSnackbar({
      open: true,
      message: '자녀가 삭제되었습니다.',
      severity: 'success',
    });
  } catch (err) {
    const msg = err.response?.data?.error || '삭제 실패';
    setSnackbar({
      open: true,
      message: msg,
      severity: 'error',
    });
  }
};


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
            안녕하세요, {JSON.parse(sessionStorage.getItem('user'))?.name}님!
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
            오늘도 자녀의 금융 교육을 함께해요
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
                onClick={() => {
                  if (action.onClick) action.onClick();
                  else if (action.path) navigate(action.path);
                }}
                sx={{ fontWeight: 600, bgcolor: '#FFD600', color: '#222', '&:hover': { bgcolor: '#FFE066' } }}
              >
                {action.label}
              </Button>
            ))}
          </Box>
        </Paper>

        {/* 자녀 현황 */}
        <Paper sx={{ 
          p: 3, 
          mb: 4,
          borderRadius: 2,
          bgcolor: '#fff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              자녀 현황
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenAddDialog(true)}
              sx={{
                bgcolor: '#FFD600',
                color: '#222',
                '&:hover': {
                  bgcolor: '#FFE066',
                },
                fontWeight: 600,
                borderRadius: 2,
              }}
            >
              자녀 추가
            </Button>
          </Box>
          <Grid container spacing={3}>
            {children.map((child) => {
              // 안전하게 값 계산
              const points = typeof child.points === 'number' ? child.points : 0;
              const savingsList = Array.isArray(child.savings) ? child.savings : [];
              const savingsRate = savingsList.length > 0
                ? Math.round(savingsList.reduce((sum, s) => sum + ((s.currentAmount || 0) / (s.targetAmount || 1)), 0) / savingsList.length * 100)
                : 0;
              const savingsAmount = savingsList.reduce((sum, s) => sum + (s.currentAmount || 0), 0);
              const missionsList = Array.isArray(child.missions) ? child.missions : [];
              const missionsCompleted = missionsList.filter(m => m.status === '완료').length;
              const missionsTotal = missionsList.length;
              const missionRate = missionsTotal > 0 ? Math.round((missionsCompleted / missionsTotal) * 100) : 0;
              const creditScore = typeof child.creditScore === 'number' ? child.creditScore : 700;
              const balance = typeof child.balance === 'number' ? child.balance : 0;
              const totalPointsEarned = missionsList.reduce((sum, m) => sum + (m.status === '완료' ? Number(m.reward || 0) : 0), 0);
              const totalPointsUsed = Array.isArray(child.purchases) ? child.purchases.reduce((sum, p) => sum + (p.points || 0), 0) : 0;
              return (
                <Grid item xs={12} sm={6} md={4} key={child.id}>
                  <Card sx={{ borderRadius: 3, boxShadow: '0 4px 16px #F5F5F5', bgcolor: '#FFF', border: '1px solid #F5F5F5' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar
                          src={child.profileImage}
                          alt={child.name}
                          sx={{ width: 56, height: 56, mr: 2, bgcolor: '#FFD600' }}
                        >
                          {child.name[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {child.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {child.age ? `${child.age}세` : ''}
                          </Typography>
                        </Box>
                      </Box>
                      {/* 주요 현황 정보 */}
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#222' }}>
                          잔액: {balance.toLocaleString()}원
                          &nbsp;&nbsp;|&nbsp;&nbsp;신용점수: {creditScore}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#757575' }}>
                          누적 획득: {totalPointsEarned}점
                          &nbsp;&nbsp;|&nbsp;&nbsp;사용: {totalPointsUsed}점
                        </Typography>
                      </Box>
                      {/* colorful chips */}
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        <Chip
                          label={`저축: ${savingsRate}%`}
                          sx={{ bgcolor: '#FFD600', color: '#222', fontWeight: 600, borderRadius: 2, boxShadow: '0 2px 8px #F5F5F5' }}
                        />
                        <Chip
                          label={`미션: ${missionRate}%`}
                          sx={{ bgcolor: '#40A9FF', color: '#fff', fontWeight: 600, borderRadius: 2, boxShadow: '0 2px 8px #F5F5F5' }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        이메일: {child.email}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => navigate(`/parent/children/${child.id}/edit`)}
                          sx={{ 
                            color: '#666',
                            borderColor: '#666',
                            '&:hover': {
                              borderColor: '#222',
                              bgcolor: 'rgba(0,0,0,0.04)'
                            }
                          }}
                        >
                          수정
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<DeleteIcon />}
                          onClick={() => {
                            if (window.confirm(`${child.name}님을 삭제하시겠습니까?`)) {
                              handleDeleteChild(child._id || child.id);
                              setSnackbar({
                                open: true,
                                message: `${child.name}님이 삭제되었습니다.`,
                                severity: 'success'
                              });
                            }
                          }}
                          sx={{ 
                            color: '#d32f2f',
                            borderColor: '#d32f2f',
                            '&:hover': {
                              borderColor: '#d32f2f',
                              bgcolor: 'rgba(211,47,47,0.04)'
                            }
                          }}
                        >
                          삭제
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<AccountBalanceIcon />}
                          onClick={() => {
                            setLoanChild(child);
                            setOpenLoanDialog(true);
                          }}
                          sx={{
                            bgcolor: '#40A9FF',
                            color: '#fff',
                            '&:hover': { bgcolor: '#1976d2' },
                            fontWeight: 600,
                          }}
                        >
                          대출 관리
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
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
                  <TableCell sx={{ fontWeight: 700 }}>자녀</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>내용</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>금액</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>상태</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                    <TableCell>{transaction.childName}</TableCell>
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

      {/* Add Child Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>자녀 추가</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="이름"
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="이메일"
              type="email"
              value={addForm.email}
              onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="비밀번호"
              type="password"
              value={addForm.password}
              onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>취소</Button>
          <Button
            variant="contained"
            onClick={handleAddChild}
            sx={{
              bgcolor: '#FFD600',
              color: '#222',
              '&:hover': {
                bgcolor: '#FFE066',
              },
              fontWeight: 600,
            }}
          >
            추가
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send Allowance Dialog */}
      <Dialog open={openSendDialog} onClose={() => setOpenSendDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>용돈 보내기</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>자녀 선택</InputLabel>
              <Select
  value={selectedChild ? String(selectedChild._id || selectedChild.id) : ''}
  onChange={(e) => {
    const selectedId = e.target.value;
    const child = children.find(c => String(c._id || c.id) === selectedId);
    setSelectedChild(child);
  }}
  label="자녀 선택"
>
  {children.map((child) => (
    <MenuItem key={child._id || child.id} value={String(child._id || child.id)}>
      {child.name}
    </MenuItem>
  ))}
</Select>

            </FormControl>
            <TextField
              fullWidth
              label="금액"
              type="number"
              value={sendAmount}
              onChange={(e) => setSendAmount(e.target.value)}
              InputProps={{
                endAdornment: <Typography>원</Typography>,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSendDialog(false)}>취소</Button>
          <Button
            variant="contained"
            onClick={handleSendAllowance}
            sx={{
              bgcolor: '#FFD600',
              color: '#222',
              '&:hover': {
                bgcolor: '#FFE066',
              },
              fontWeight: 600,
            }}
          >
            보내기
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={openDetailDialog} onClose={() => setOpenDetailDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>자녀 상세 정보</DialogTitle>
        <DialogContent>
          {selectedChild && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                {selectedChild.name}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography>
                  <strong>잔액:</strong> {selectedChild.balance.toLocaleString()}원
                </Typography>
                <Typography>
                  <strong>신용점수:</strong> {selectedChild.creditScore}
                </Typography>
                <Typography>
                  <strong>포인트:</strong> {selectedChild.points}
                </Typography>
                <Typography>
                  <strong>최근 미션:</strong> {selectedChild.missions?.length || 0}개
                </Typography>
                <Typography>
                  <strong>저축 목표:</strong> {selectedChild.savings?.length || 0}개
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailDialog(false)}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 대출 관리 모달 */}
      <Dialog open={openLoanDialog} onClose={() => setOpenLoanDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>대출 관리 - {loanChild?.name}</DialogTitle>
        <DialogContent>
          {loanActionError && <Alert severity="error" sx={{ mb: 2 }}>{loanActionError}</Alert>}
          <Typography variant="subtitle1" sx={{ mb: 1 }}>대출 신청 내역</Typography>
          {(loanChild?.loanRequests || []).length === 0 ? (
            <Typography color="text.secondary">대출 신청 내역이 없습니다.</Typography>
          ) : (
            (loanChild.loanRequests || []).map((req) => (
              <Box key={req.id} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 2 }}>
                <Typography>금액: {req.amount.toLocaleString()}원 / 기간: {req.period}개월</Typography>
                <Typography>사유: {req.reason}</Typography>
                <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                  <Button size="small" variant="contained" color="success" onClick={() => handleApproveLoan({ ...req, childId: loanChild.id })}>승인</Button>
                  <Button size="small" variant="contained" color="error" onClick={() => handleRejectLoan({ ...req, childId: loanChild.id })}>거절</Button>
                </Box>
              </Box>
            ))
          )}
          <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>진행 중 대출</Typography>
          {(loanChild?.loans || []).filter(l => l.status === 'active').length === 0 ? (
            <Typography color="text.secondary">진행 중인 대출이 없습니다.</Typography>
          ) : (
            (loanChild.loans || []).filter(l => l.status === 'active').map((loan) => (
              <Box key={loan.id} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 2 }}>
                <Typography>금액: {loan.amount.toLocaleString()}원 / 이자: {loan.interest.toLocaleString()}원 / 상환액: {loan.repayAmount.toLocaleString()}원</Typography>
                <Typography>기간: {loan.period}개월 / 만기일: {loan.dueDate}</Typography>
                <Typography>사유: {loan.reason}</Typography>
                <Button size="small" variant="contained" color="info" sx={{ mt: 1 }} onClick={() => handleRepayLoan(loan, loanChild)}>상환 처리</Button>
              </Box>
            ))
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLoanDialog(false)}>닫기</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ParentDashboard; 
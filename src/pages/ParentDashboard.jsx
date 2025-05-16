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
} from '@mui/icons-material';
import {
  getChildrenByParent,
  addChild,
  updateChild,
  getUsers,
  saveUsers,
  findUserById,
  getDondoliData,
  setDondoliData,
} from '../utils/localData';
import ryanCoin from '../../public/ryan-coin.png';
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

  useEffect(() => {
    const loadData = async () => {
      const user = JSON.parse(sessionStorage.getItem('user'));
      const childrenData = await getChildrenByParent(user.id);
      setChildren(childrenData);
      
      const transactions = await getRecentTransactions(user.id);
      setRecentTransactions(transactions);
    };
    loadData();
  }, []);

  useEffect(() => {
    setChildren(getChildrenByParent(parentId));
  }, [parentId, location.pathname]);

  // 자녀 추가
  const handleAddChild = () => {
    setError('');
    if (!addForm.name || !addForm.email || !addForm.password) {
      setError('이름, 이메일, 비밀번호를 모두 입력해주세요.');
      return;
    }
    // 자녀 계정도 users에 추가
    const users = getUsers();
    if (users.find(u => u.email === addForm.email)) {
      setError('이미 존재하는 이메일입니다.');
      return;
    }
    const childId = Date.now();
    const password = addForm.password;
    addChild({
      id: childId,
      name: addForm.name,
      parentId,
      balance: 0,
      creditScore: 700,
      points: 0,
      missions: [],
      savings: [],
      transactions: [],
      email: addForm.email,
      password,
    });
    users.push({
      id: childId,
      name: addForm.name,
      email: addForm.email,
      password,
      role: 'child',
      parentId,
    });
    saveUsers(users);
    setChildren(getChildrenByParent(parentId));
    setNewChildInfo({ email: addForm.email, password });
    setAddForm({ name: '', email: '', password: '' });
  };

  // 대출 승인
  const handleApproveLoan = (request) => {
    const child = children.find(c => c.id === request.childId);
    if (!child) return;
    if (!(child.loanRequests || []).some(r => r.id === request.id)) return;
    const updated = { ...child };
    const ANNUAL_RATE = 0.05;
    const days = Number(request.period);
    const interest = Math.round(request.amount * ANNUAL_RATE * (days / 365));
    updated.loanAmount = (updated.loanAmount || 0) + Number(request.amount);
    updated.creditScore = (updated.creditScore || 700) - 50;
    updated.loans = [
      ...(updated.loans || []),
      {
        id: request.id,
        amount: Number(request.amount),
        interestRate: ANNUAL_RATE,
        period: request.period,
        status: 'active',
        approvedAt: new Date().toISOString().slice(0, 10),
        dueDate: request.dueDate,
        repaid: false,
        reason: request.reason,
        interest,
        repayAmount: Number(request.amount) + interest,
      },
    ];
    updated.balance = (updated.balance || 0) + Number(request.amount);
    updated.ledgers = [
      { type: '입금', amount: Number(request.amount), date: new Date().toISOString().slice(0, 10), memo: '대출 승인' },
      ...(updated.ledgers || []),
    ];
    updated.loanRequests = (updated.loanRequests || []).filter(r => r.id !== request.id);
    updateChild(updated);
    const kids = getChildrenByParent(parentId);
    setChildren(kids);
    const allLoanRequests = kids.flatMap(child =>
      (child.loanRequests || []).map(req => ({ ...req, childId: child.id, childName: child.name }))
    );
    setLoanRequests(allLoanRequests);
  };

  // 대출 거절
  const handleRejectLoan = (request) => {
    const child = children.find(c => c.id === request.childId);
    if (!child) return;
    const updated = { ...child };
    updated.loanRequests = (updated.loanRequests || []).filter(r => r.id !== request.id);
    updateChild(updated);
    setChildren(getChildrenByParent(parentId));
  };

  // 용돈 보내기
  const handleSendAllowance = () => {
    if (!sendAmount || isNaN(sendAmount) || Number(sendAmount) <= 0) return;
    const updated = { ...selectedChild };
    updated.balance += Number(sendAmount);
    // 거래내역(ledger) 추가
    const ledgerEntry = {
      type: '입금',
      amount: Number(sendAmount),
      date: new Date().toISOString().slice(0, 10),
      memo: '부모 입금',
      id: Date.now(),
    };
    updated.ledgers = [ledgerEntry, ...(updated.ledgers || [])];
    updateChild(updated);
    // 거래내역(부모 recentTransactions)에도 push
    const transactionEntry = {
      id: Date.now(),
      childName: updated.name,
      description: '용돈 입금',
      amount: Number(sendAmount),
      date: new Date().toISOString(),
      status: '완료',
    };
    setChildren(getChildrenByParent(parentId));
    setRecentTransactions(prev => [transactionEntry, ...prev]);
    setOpenSendDialog(false);
    setSendAmount('');
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
                              // 삭제 처리
                              const updatedChildren = children.filter(c => c.id !== child.id);
                              setChildren(updatedChildren);
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
                            setSelectedChild(child);
                            setOpenSendDialog(true);
                          }}
                          sx={{ 
                            bgcolor: '#FFD600',
                            color: '#222',
                            '&:hover': {
                              bgcolor: '#FFE066',
                            },
                            fontWeight: 600,
                          }}
                        >
                          용돈 보내기
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
                value={selectedChild?.id || ''}
                onChange={(e) => {
                  const child = children.find(c => c.id === e.target.value);
                  setSelectedChild(child);
                }}
                label="자녀 선택"
              >
                {children.map((child) => (
                  <MenuItem key={child.id} value={child.id}>
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
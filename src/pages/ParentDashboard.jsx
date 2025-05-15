import { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  Savings as SavingsIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import {
  getChildrenByParent,
  addChild,
  updateChild,
  getUsers,
  saveUsers,
  findUserById,
  getMwoniData,
  setMwoniData,
} from '../utils/localData';

function randomPassword(length = 6) {
  return Math.random().toString(36).slice(-length);
}

function ParentDashboard() {
  const location = useLocation();
  // 로그인한 부모 정보 가져오기
  const parentId = JSON.parse(sessionStorage.getItem('user'))?.id;
  const [children, setChildren] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openSendDialog, setOpenSendDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);
  const [addForm, setAddForm] = useState({ name: '', email: '' });
  const [sendAmount, setSendAmount] = useState('');
  const [error, setError] = useState('');
  const [newChildInfo, setNewChildInfo] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();
  const [loanRequests, setLoanRequests] = useState([]);
  const [ledgerPage, setLedgerPage] = useState(0);
  const ledgersPerPage = 10;
  // 모든 자녀의 ledgers를 날짜 내림차순으로 합침
  const allLedgers = children.flatMap(child => (child.ledgers || []).map(l => ({ ...l, childName: child.name })))
    .sort((a, b) => (b.date > a.date ? 1 : -1));
  const pagedLedgers = allLedgers.slice(ledgerPage * ledgersPerPage, (ledgerPage + 1) * ledgersPerPage);

  // 자녀 목록 불러오기
  useEffect(() => {
    const kids = getChildrenByParent(parentId);
    setChildren(kids);
    // 모든 자녀의 대출 요청 모으기
    const allLoanRequests = kids.flatMap(child =>
      (child.loanRequests || []).map(req => ({ ...req, childId: child.id, childName: child.name }))
    );
    setLoanRequests(allLoanRequests);
  }, [parentId, location.pathname, children.length]);

  // 자녀 추가
  const handleAddChild = () => {
    setError('');
    if (!addForm.name || !addForm.email) {
      setError('이름과 이메일을 입력해주세요.');
      return;
    }
    // 자녀 계정도 users에 추가
    const users = getUsers();
    if (users.find(u => u.email === addForm.email)) {
      setError('이미 존재하는 이메일입니다.');
      return;
    }
    const childId = Date.now();
    const password = randomPassword(6);
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
    setAddForm({ name: '', email: '' });
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
    updated.ledgers = [
      { type: '입금', amount: Number(sendAmount), date: new Date().toISOString().slice(0, 10), memo: '부모 입금' },
      ...(updated.ledgers || []),
    ];
    updateChild(updated);
    setChildren(getChildrenByParent(parentId));
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
    const data = getMwoniData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mwoniData.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // 데이터 불러오기
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        setMwoniData(json);
        window.location.reload();
      } catch (err) {
        alert('잘못된 JSON 파일입니다.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <Container maxWidth="lg" sx={{ pt: '64px', mt: 2, mb: 2, minHeight: '70vh' }}>
      <Grid container spacing={1} alignItems="flex-start">
        {/* Header */}
        <Grid item xs={12}>
          <Paper sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 1, boxShadow: 1 }}>
            <Typography variant="h4" component="h1">
              부모 대시보드
            </Typography>
            <Button variant="contained" color="primary" onClick={() => setOpenAddDialog(true)}>
              자녀 추가
            </Button>
          </Paper>
        </Grid>
        {/* Quick Actions */}
        <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Paper sx={{ p: 1, flexGrow: 1, minHeight: 120, display: 'flex', flexDirection: 'column', borderRadius: 1, boxShadow: 1 }}>
            <Typography variant="h6" gutterBottom>
              빠른 기능
            </Typography>
            <List>
              <ListItem button onClick={() => setOpenSendDialog(true)} disabled={children.length === 0}>
                <AccountBalanceIcon sx={{ mr: 2 }} />
                <ListItemText primary="용돈 보내기" />
              </ListItem>
              <ListItem button onClick={() => window.location.href = '/parent/missions'}>
                <SchoolIcon sx={{ mr: 2 }} />
                <ListItemText primary="미션 생성" />
              </ListItem>
              <ListItem button onClick={() => window.location.href = '/parent/quiz'}>
                <AssignmentIcon sx={{ mr: 2 }} />
                <ListItemText primary="퀴즈 관리" />
              </ListItem>
              <ListItem button onClick={() => window.location.href = '/parent/report'}>
                <TrendingUpIcon sx={{ mr: 2 }} />
                <ListItemText primary="성과 보고서" />
              </ListItem>
            </List>
          </Paper>
        </Grid>
        {/* Children Overview */}
        <Grid item xs={12} md={8} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Paper sx={{ p: 1, flexGrow: 1, minHeight: 120, display: 'flex', flexDirection: 'column', borderRadius: 1, boxShadow: 1 }}>
            <Typography variant="h6" gutterBottom>
              자녀 현황
            </Typography>
            <Grid container spacing={1} alignItems="stretch">
              {children.map((child) => {
                const stats = getChildStats(child);
                return (
                  <Grid item xs={12} sm={6} key={child.id} sx={{ display: 'flex' }}>
                    <Card sx={{ boxShadow: 2, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 120 }}>
                      <CardContent>
                        <Typography variant="h6">{child.name}</Typography>
                        <Typography color="text.secondary">
                          잔액: {child.balance.toLocaleString()}원
                        </Typography>
                        <Typography color="text.secondary">
                          신용점수: {child.creditScore}
                        </Typography>
                        {/* 통계 카드 */}
                        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip icon={<StarIcon />} label={`획득: ${stats.totalPointsEarned}점`} color="primary" size="small" />
                          <Chip icon={<SavingsIcon />} label={`저축: ${stats.savingsProgress}%`} color="success" size="small" />
                          <Chip icon={<CheckCircleIcon />} label={`미션: ${stats.missionCompletionRate}%`} color="info" size="small" />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          이메일: {child.email}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button size="small" onClick={() => handleOpenDetail(child)}>상세보기</Button>
                        <Button size="small" onClick={() => { setSelectedChild(child); setOpenSendDialog(true); }}>용돈 보내기</Button>
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        </Grid>
        {/* Recent Transactions */}
        <Grid item xs={12} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Paper sx={{ p: 1, flexGrow: 1, minHeight: 80, display: 'flex', flexDirection: 'column', borderRadius: 1, boxShadow: 1 }}>
            <Typography variant="h6" gutterBottom>
              최근 거래 내역
            </Typography>
            <List>
              {pagedLedgers.map((ledger, idx) => (
                <Box key={ledger.childName + '-' + idx}>
                  <ListItem>
                    <ListItemText
                      primary={`${ledger.childName} - ${ledger.type}`}
                      secondary={`${ledger.date} | ${ledger.amount.toLocaleString()}원${ledger.memo ? ' | ' + ledger.memo : ''}`}
                    />
                  </ListItem>
                  <Divider />
                </Box>
              ))}
            </List>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
              <Button onClick={() => setLedgerPage(ledgerPage - 1)} disabled={ledgerPage === 0} sx={{ mr: 1 }}>이전</Button>
              <Button onClick={() => setLedgerPage(ledgerPage + 1)} disabled={(ledgerPage + 1) * ledgersPerPage >= allLedgers.length}>다음</Button>
            </Box>
          </Paper>
        </Grid>
        {/* 대출 요청 관리 */}
        {loanRequests.length > 0 && (
          <Grid item xs={12} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Paper sx={{ p: 1, flexGrow: 1, minHeight: 60, display: 'flex', flexDirection: 'column', mb: 1, borderRadius: 1, boxShadow: 1 }}>
              <Typography variant="h6" gutterBottom>
                대출 요청 관리
              </Typography>
              <List>
                {loanRequests.map((req) => (
                  <Box key={req.id}>
                    <ListItem>
                      <ListItemText
                        primary={`${req.childName} - ${req.amount.toLocaleString()}원 (${req.period}개월) | 사유: ${req.reason}`}
                        secondary={`요청일: ${req.requestedAt}`}
                      />
                      <Button color="success" onClick={() => handleApproveLoan(req)} sx={{ mr: 1 }}>승인</Button>
                      <Button color="error" onClick={() => handleRejectLoan(req)}>거절</Button>
                    </ListItem>
                    <Divider />
                  </Box>
                ))}
              </List>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Add Child Dialog */}
      <Dialog open={openAddDialog} onClose={() => { setOpenAddDialog(false); setNewChildInfo(null); }} maxWidth="xs" fullWidth>
        <DialogTitle>자녀 추가</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {newChildInfo ? (
            <Box sx={{ my: 2 }}>
              <Alert severity="success">
                <Typography variant="subtitle1">자녀 계정이 생성되었습니다!</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>아래 정보를 자녀에게 전달하세요.</Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2"><b>이메일:</b> {newChildInfo.email}</Typography>
                  <Typography variant="body2"><b>비밀번호:</b> {newChildInfo.password}</Typography>
                </Box>
              </Alert>
            </Box>
          ) : (
            <>
              <TextField
                fullWidth
                label="이름"
                name="name"
                value={addForm.name}
                onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="이메일"
                name="email"
                value={addForm.email}
                onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                margin="normal"
                required
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenAddDialog(false); setNewChildInfo(null); }}>닫기</Button>
          {!newChildInfo && <Button onClick={handleAddChild} variant="contained" color="primary">추가</Button>}
        </DialogActions>
      </Dialog>

      {/* Send Allowance Dialog */}
      <Dialog open={openSendDialog} onClose={() => setOpenSendDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>용돈 보내기</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="금액"
            type="number"
            value={sendAmount}
            onChange={e => setSendAmount(e.target.value)}
            margin="normal"
            required
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {selectedChild ? `${selectedChild.name} (현재 잔액: ${selectedChild.balance.toLocaleString()}원)` : ''}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSendDialog(false)}>취소</Button>
          <Button onClick={handleSendAllowance} variant="contained" color="primary" disabled={!selectedChild}>보내기</Button>
        </DialogActions>
      </Dialog>

      {/* Child Detail Dialog */}
      <Dialog open={openDetailDialog} onClose={() => setOpenDetailDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>자녀 상세 정보</DialogTitle>
        <DialogContent>
          {selectedChild && (
            <Box>
              <Typography variant="h6">{selectedChild.name}</Typography>
              <Typography>잔액: {selectedChild.balance.toLocaleString()}원</Typography>
              <Typography>신용점수: {selectedChild.creditScore}</Typography>
              <Typography>포인트: {selectedChild.points}</Typography>
              <Typography sx={{ mt: 2 }}>최근 미션: {selectedChild.missions?.length || 0}개</Typography>
              <Typography>저축 목표: {selectedChild.savings?.length || 0}개</Typography>
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
    </Container>
  );
}

export default ParentDashboard; 
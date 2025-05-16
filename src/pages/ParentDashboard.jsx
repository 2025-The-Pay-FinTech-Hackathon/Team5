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
  getDondoliData,
  setDondoliData,
} from '../utils/localData';
import ryanCoin from '../../public/ryan-coin.png';

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

  return (
    <Container maxWidth="md" sx={{ pt: '64px', mt: 2, mb: 2, minHeight: '70vh' }}>
      {/* 상단 헤더/캐릭터/설명 */}
      <Paper sx={{ p: 3, mb: 4, display: 'flex', alignItems: 'center', background: '#FFFDE7', boxShadow: 3, borderRadius: 4 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 900, color: '#222', mb: 1 }}>
            내 자녀의 금융생활<br />한 눈에 보기
          </Typography>
          <Typography variant="subtitle1" sx={{ color: '#555', mb: 2 }}>
            포인트부터 저축까지, 성장하는 금융 습관을 함께 확인하세요.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
            <Button variant="contained" sx={{ bgcolor: '#FFD600', color: '#222', fontWeight: 700, fontSize: '1.1rem', boxShadow: 2 }} onClick={() => setOpenAddDialog(true)}>
              자녀 추가
            </Button>
            <Button variant="outlined" sx={{ borderColor: '#FFD600', color: '#222', fontWeight: 700, fontSize: '1.1rem', bgcolor: '#fff', '&:hover': { bgcolor: '#FFF9C4' } }} onClick={() => window.location.reload()}>
              전체 보기
            </Button>
          </Box>
        </Box>
        <Box sx={{ minWidth: 180, display: { xs: 'none', md: 'block' } }}>
          <img src={ryanCoin} alt="캐릭터" style={{ width: 180, height: 'auto', marginLeft: 24 }} />
        </Box>
      </Paper>
      <Grid container spacing={3} alignItems="flex-start">
        {/* 빠른 기능 */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, minHeight: 220, display: 'flex', flexDirection: 'column', borderRadius: 3, boxShadow: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#222', mb: 2 }}>
              용돈/미션/퀴즈/보고서
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button variant="contained" startIcon={<AccountBalanceIcon />} sx={{ bgcolor: '#FFD600', color: '#222', fontWeight: 700 }} onClick={() => setOpenSendDialog(true)} disabled={children.length === 0}>
                용돈 보내기
              </Button>
              <Button variant="contained" startIcon={<SchoolIcon />} sx={{ bgcolor: '#FFD600', color: '#222', fontWeight: 700 }} onClick={() => window.location.href = '/parent/missions'}>
                미션 생성
              </Button>
              <Button variant="contained" startIcon={<AssignmentIcon />} sx={{ bgcolor: '#FFD600', color: '#222', fontWeight: 700 }} onClick={() => window.location.href = '/parent/quiz'}>
                퀴즈 관리
              </Button>
              <Button variant="contained" startIcon={<TrendingUpIcon />} sx={{ bgcolor: '#FFD600', color: '#222', fontWeight: 700 }} onClick={() => window.location.href = '/parent/report'}>
                성과 보고서
              </Button>
            </Box>
          </Paper>
        </Grid>
        {/* 자녀 현황 */}
        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 3, minHeight: 220, borderRadius: 3, boxShadow: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#222', mb: 2 }}>
              자녀 현황
            </Typography>
            <Grid container spacing={2} justifyContent="center">
              {children.map((child) => {
                const stats = getChildStats(child);
                return (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={child.id} sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Card sx={{ boxShadow: 3, borderRadius: 3, border: '1.5px solid #FFE066', minWidth: 220, maxWidth: 300, minHeight: 160, mx: 'auto' }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#222' }}>{child.name}</Typography>
                        <Typography sx={{ color: '#555', fontWeight: 500 }}>잔액: {child.balance.toLocaleString()}원</Typography>
                        <Typography sx={{ color: '#555', fontWeight: 500 }}>신용점수: {child.creditScore}</Typography>
                        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip icon={<StarIcon />} label={`획득: ${stats.totalPointsEarned}점`} sx={{ bgcolor: '#FFF9C4', color: '#222', fontWeight: 700 }} />
                          <Chip icon={<SavingsIcon />} label={`저축: ${stats.savingsProgress}%`} sx={{ bgcolor: '#FFF9C4', color: '#222', fontWeight: 700 }} />
                          <Chip icon={<CheckCircleIcon />} label={`미션: ${stats.missionCompletionRate}%`} sx={{ bgcolor: '#FFF9C4', color: '#222', fontWeight: 700 }} />
                        </Box>
                        <Typography variant="body2" sx={{ color: '#888', mt: 1 }}>이메일: {child.email}</Typography>
                      </CardContent>
                      <CardActions>
                        <Button size="small" variant="outlined" sx={{ borderColor: '#FFD600', color: '#222', fontWeight: 700 }} onClick={() => handleOpenDetail(child)}>상세보기</Button>
                        <Button size="small" variant="contained" sx={{ bgcolor: '#FFD600', color: '#222', fontWeight: 700 }} onClick={() => { setSelectedChild(child); setOpenSendDialog(true); }}>용돈 보내기</Button>
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        </Grid>
        {/* 최근 거래 내역 */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#222', mb: 2 }}>
              최근 활동 내역
            </Typography>
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
                <thead>
                  <tr style={{ background: '#FFF9C4', color: '#222', fontWeight: 700 }}>
                    <th style={{ padding: '10px', borderBottom: '2px solid #FFD600' }}>요일</th>
                    <th style={{ padding: '10px', borderBottom: '2px solid #FFD600' }}>활동</th>
                    <th style={{ padding: '10px', borderBottom: '2px solid #FFD600' }}>상세 내용</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedLedgers.map((ledger, idx) => (
                    <tr key={ledger.childName + '-' + idx} style={{ borderBottom: '1px solid #FFE066' }}>
                      <td style={{ padding: '10px', textAlign: 'center', color: '#222', fontWeight: 600 }}>{ledger.date}</td>
                      <td style={{ padding: '10px', textAlign: 'center', color: '#222', fontWeight: 600 }}>{ledger.type}</td>
                      <td style={{ padding: '10px', color: '#555' }}>{ledger.childName} | {ledger.amount.toLocaleString()}원{ledger.memo ? ' | ' + ledger.memo : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 2 }}>
              <Button onClick={() => setLedgerPage(ledgerPage - 1)} disabled={ledgerPage === 0} variant="outlined" sx={{ borderColor: '#FFD600', color: '#222', fontWeight: 700 }}>이전</Button>
              <Button onClick={() => setLedgerPage(ledgerPage + 1)} disabled={(ledgerPage + 1) * ledgersPerPage >= allLedgers.length} variant="outlined" sx={{ borderColor: '#FFD600', color: '#222', fontWeight: 700 }}>다음</Button>
            </Box>
          </Paper>
        </Grid>
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
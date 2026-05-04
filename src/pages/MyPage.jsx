import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Avatar,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  useTheme,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  School as SchoolIcon,
  EmojiEvents as EmojiEventsIcon,
  Savings as SavingsIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { findChildById, getChildrenByParent, updateUser } from '../utils/localData';
import { BADGE_TYPES } from '../constants/badgeTypes';
import { checkAndUpdateBadges } from '../utils/badgeUtils';
import { apiRequest, isNetworkError } from '../services/api';

const MyPage = ({ user: currentUser, onUserUpdate, onLogout }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedUser, setEditedUser] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [child, setChild] = useState(null);
  const location = useLocation();
  const isParent = user?.role === 'parent';

  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;

    if (isParent) {
      const kids = getChildrenByParent(userId).map(kid => checkAndUpdateBadges(kid));
      setChildren(kids);
      if (kids.length > 0) setSelectedChildId(kids[0].id);
    } else {
      const loadedChild = findChildById(userId);
      setChild(loadedChild ? checkAndUpdateBadges(loadedChild) : null);
    }
  }, [isParent, userId, location.pathname]);

  useEffect(() => {
    if (isParent && selectedChildId) {
      const loadedChild = findChildById(selectedChildId);
      setChild(loadedChild ? checkAndUpdateBadges(loadedChild) : null);
    }
  }, [selectedChildId, isParent]);

  useEffect(() => {
    const userData = currentUser || JSON.parse(sessionStorage.getItem('user'));
    setUser(userData);
    setEditedUser(userData);
    if (userData?.role === 'child') {
      const loadedChild = findChildById(userData.id);
      setChild(loadedChild ? checkAndUpdateBadges(loadedChild) : null);
    }
  }, [currentUser, location.pathname]);

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleCancel = () => {
    setEditedUser(user);
    setEditMode(false);
  };

  const handleSave = async () => {
    let savedUser = editedUser;

    try {
      const data = await apiRequest(`/api/auth/users/${editedUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(editedUser),
      });
      savedUser = data.user || editedUser;
    } catch (apiError) {
      if (!isNetworkError(apiError)) {
        setSnackbar({
          open: true,
          message: apiError.message,
          severity: 'error',
        });
        return;
      }
    }

    savedUser = updateUser(savedUser);
    sessionStorage.setItem('user', JSON.stringify(savedUser));
    window.dispatchEvent(new Event('auth:user-changed'));
    setUser(savedUser);
    onUserUpdate?.(savedUser);
    setEditMode(false);
    setSnackbar({
      open: true,
      message: '프로필이 업데이트되었습니다.',
      severity: 'success',
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      sessionStorage.removeItem('user');
      window.dispatchEvent(new Event('auth:user-changed'));
    }
    navigate('/', { replace: true });
  };

  if (!user) return null;

  // 실제 데이터 기반 통계 및 최근 활동 계산
  const target = isParent ? child : (child || user);
  const quizCount = (target?.quizResults || []).length;
  const missionCount = (target?.missions || []).filter(m => m.status === '완료').length;
  const savingsAmount = (target?.savings || []).reduce((sum, s) => sum + (s.currentAmount || 0), 0);
  const points = target?.points || 0;

  // 최근 활동
  const recentMissions = (target?.missions || [])
    .filter(m => m.status === '완료')
    .map(m => ({
      type: '미션',
      title: m.title,
      date: m.completedAt,
      points: m.reward,
    }));
  const recentQuizzes = (target?.quizResults || [])
    .map(q => ({
      type: '퀴즈',
      title: '금융 퀴즈',
      date: q.date,
      points: q.score,
    }));
  const recentSavings = (target?.savings || [])
    .filter(s => s.currentAmount > 0 && s.lastUpdated)
    .map(s => ({
      type: '저축',
      title: s.title || '저축',
      date: s.lastUpdated,
      points: s.currentAmount,
    }));
  const recentMemoryGames = (target?.memoryGameResults || [])
    .map(g => ({
      type: '메모리게임',
      title: '카드 매칭 게임',
      date: g.date,
      points: g.points,
    }));
  const recentActivities = [
    ...recentMissions,
    ...recentQuizzes,
    ...recentSavings,
    ...recentMemoryGames,
  ]
    .filter(a => a.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  // 누적 포인트 계산
  const totalPointsEarned =
    (target?.missions || []).reduce((sum, m) => sum + (m.status === '완료' ? Number(m.reward || 0) : 0), 0) +
    (target?.quizResults || []).reduce((sum, q) => sum + (q.score || 0), 0) +
    (target?.memoryGameResults || []).reduce((sum, g) => sum + (g.points || 0), 0);
  const totalPointsUsed = (target?.purchases || []).reduce((sum, p) => sum + (p.points || 0), 0);
  const currentPoints = target?.points || 0;

  const stats = [
    { icon: <StarIcon />, label: '보유 포인트', value: `${currentPoints.toLocaleString()}점` },
    { icon: <StarIcon />, label: '누적 획득', value: `${totalPointsEarned.toLocaleString()}점` },
    { icon: <StarIcon />, label: '누적 사용', value: `${totalPointsUsed.toLocaleString()}점` },
    { icon: <SchoolIcon />, label: '완료한 퀴즈', value: `${quizCount}개` },
    { icon: <EmojiEventsIcon />, label: '완료한 미션', value: `${missionCount}개` },
    { icon: <SavingsIcon />, label: '저축 금액', value: `${savingsAmount.toLocaleString()}원` },
  ];

  // 뱃지 현황
  const userBadges = (target?.badges) || {};

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: '#FFFDE7',
      pt: '64px',
      pb: 4
    }}>
      {/* 상단 배너 */}
      <Box sx={{ 
        bgcolor: '#FFD600',
        py: 4,
        mb: 4,
        position: 'relative',
        overflow: 'visible',
        minHeight: { xs: 140, md: 180 },
      }}>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h4" sx={{ 
            fontWeight: 800,
            mb: 2,
            color: '#222'
          }}>
            마이페이지
          </Typography>
          <Typography variant="h6" sx={{ 
            color: '#666',
            fontWeight: 500
          }}>
            내 정보를 확인하고 관리해보세요
          </Typography>
          {/* 부모 계정일 때 자녀 선택 드롭다운 */}
          {isParent && children.length > 1 && (
            <FormControl sx={{ mt: 2, minWidth: 180 }} size="small">
              <InputLabel>자녀 선택</InputLabel>
              <Select
                value={selectedChildId || ''}
                label="자녀 선택"
                onChange={e => setSelectedChildId(e.target.value)}
              >
                {children.map(c => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Container>
        <Box
          component="img"
          src="/ryan-coin.png"
          alt="Ryan Coin"
          sx={{
            position: 'absolute',
            right: { xs: 0, md: 40 },
            bottom: -30,
            width: { xs: 120, md: 180, lg: 220 },
            height: 'auto',
            zIndex: 2,
            userSelect: 'none',
            pointerEvents: 'none',
            objectFit: 'contain',
            overflow: 'visible',
          }}
        />
      </Box>

      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="stretch">
          {/* 프로필 카드 (왼쪽) */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ 
              p: 3,
              borderRadius: 2,
              bgcolor: '#fff',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                <Avatar
                  src={user.profileImage}
                  alt={user.name}
                  sx={{ 
                    width: 120,
                    height: 120,
                    mb: 2,
                    bgcolor: '#FFD600',
                    fontSize: '3rem'
                  }}
                >
                  {user.name[0]}
                </Avatar>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  {user.name}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {user.role === 'parent' ? '부모님' : '자녀'}
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <List>
                <ListItem>
                  <ListItemIcon>
                    <EmailIcon sx={{ color: '#666' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="이메일"
                    secondary={user.email}
                    secondaryTypographyProps={{ color: '#666' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <PhoneIcon sx={{ color: '#666' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="전화번호"
                    secondary={user.phone}
                    secondaryTypographyProps={{ color: '#666' }}
                  />
                </ListItem>
              </List>
              <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={handleEdit}
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
                  프로필 수정
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleLogout}
                  sx={{
                    borderColor: '#d32f2f',
                    color: '#d32f2f',
                    '&:hover': {
                      borderColor: '#d32f2f',
                      bgcolor: '#ffebee',
                    },
                    fontWeight: 600,
                    borderRadius: 2,
                  }}
                >
                  로그아웃
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* 활동 통계 카드 (오른쪽, 2줄 3열) */}
          <Grid item xs={12} md={8} display="flex" alignItems="center">
            <Paper sx={{ 
              p: 3,
              borderRadius: 2,
              bgcolor: '#fff',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              width: '100%',
            }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
                활동 통계
              </Typography>
              <Grid container spacing={3}>
                {stats.map((stat, idx) => (
                  <Grid item xs={12} sm={6} md={4} key={stat.label || idx}>
                    <Card sx={{ 
                      borderRadius: 2,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Box sx={{ 
                            bgcolor: '#FFF9C4',
                            borderRadius: '50%',
                            p: 1,
                            mr: 1
                          }}>
                            {stat.icon}
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {stat.label}
                          </Typography>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {stat.value}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        {/* 최근 활동 */}
        <Paper sx={{ 
          p: 3,
          borderRadius: 2,
          bgcolor: '#fff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          mt: 4
        }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
            최근 활동
          </Typography>
          <List>
            {recentActivities.length > 0 ? recentActivities.map((activity, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemIcon>
                    {activity.type === '퀴즈' ? <SchoolIcon /> : activity.type === '미션' ? <EmojiEventsIcon /> : activity.type === '저축' ? <SavingsIcon /> : activity.type === '메모리게임' ? <StarIcon /> : <StarIcon />}
                  </ListItemIcon>
                  <ListItemText
                    primary={activity.title}
                    secondary={activity.date}
                  />
                  <Chip
                    label={`+${activity.points}${activity.type === '저축' ? '원' : '점'}`}
                    color="primary"
                    size="small"
                    sx={{ bgcolor: '#FFD600', color: '#222', fontWeight: 600 }}
                  />
                </ListItem>
                {index < recentActivities.length - 1 && <Divider />}
              </React.Fragment>
            )) : (
              <Typography color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>최근 활동이 없습니다.</Typography>
            )}
          </List>
        </Paper>

        {/* 내 뱃지 현황 */}
        <Paper sx={{ p: 3, my: 4, borderRadius: 2, bgcolor: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
            {isParent ? '자녀 뱃지' : '내 뱃지'}
          </Typography>
          <Grid container spacing={2}>
            {BADGE_TYPES.map(badge => {
              const currentTier = userBadges[badge.key] || null;
              return (
                <Grid item xs={12} sm={6} md={4} key={badge.key}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">{badge.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{badge.description}</Typography>
                      <Box sx={{ mt: 2 }}>
                        {badge.levels.map(level => (
                          <Chip
                            key={level.tier}
                            label={level.label + ' ' + level.condition}
                            color={currentTier === level.tier ? 'primary' : 'default'}
                            sx={{ mr: 1, mb: 1 }}
                            variant={currentTier === level.tier ? 'filled' : 'outlined'}
                          />
                        ))}
                        {!currentTier && (
                          <Typography variant="body2" sx={{ mt: 1 }} color="text.disabled">
                            아직 획득한 뱃지가 없어요.
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Paper>
      </Container>

      {/* 프로필 수정 다이얼로그 */}
      <Dialog open={editMode} onClose={handleCancel} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>프로필 수정</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="이름"
              name="name"
              value={editedUser?.name || ''}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="이메일"
              name="email"
              value={editedUser?.email || ''}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="전화번호"
              name="phone"
              value={editedUser?.phone || ''}
              onChange={handleChange}
              margin="normal"
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCancel}
            startIcon={<CancelIcon />}
            sx={{ color: '#666' }}
          >
            취소
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            startIcon={<SaveIcon />}
            sx={{
              bgcolor: '#FFD600',
              color: '#222',
              '&:hover': {
                bgcolor: '#FFE066',
              },
              fontWeight: 600,
            }}
          >
            저장
          </Button>
        </DialogActions>
      </Dialog>

      {/* 스낵바 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MyPage;

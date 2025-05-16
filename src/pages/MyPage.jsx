import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Chip,
} from '@mui/material';
import {
  AccountCircle,
  Settings,
  History,
  Notifications,
  Help,
  Logout,
  EmojiEvents as BadgeIcon,
} from '@mui/icons-material';
import ProfileCustomization from '../components/profile/ProfileCustomization';
import BadgeDetails from '../components/badges/BadgeDetails';
import ActivityHistory from '../components/activity/ActivityHistory';

const MyPage = () => {
  const [user, setUser] = useState({
    name: '홍길동',
    email: 'hong@example.com',
    profile: {
      selectedBadges: [1, 3],
      color: '#6C63FF',
      frame: 'default',
    },
  });

  const [badgeDetailsOpen, setBadgeDetailsOpen] = useState(false);
  const [userProgress, setUserProgress] = useState({
    1: 1, // 첫 저축 완료
    2: 7, // 10개 미션 중 7개 완료
    3: 85, // 퀴즈 85점
    4: 750000, // 75만원 저축
    5: 15, // 15일 연속 저축
  });

  const [activities, setActivities] = useState([
    {
      id: 1,
      type: 'saving',
      title: '첫 저축 목표 달성',
      date: '2024년 3월 15일',
    },
    {
      id: 2,
      type: 'quiz',
      title: '퀴즈 완료',
      date: '2024년 3월 14일',
    },
    {
      id: 3,
      type: 'goal',
      title: '새로운 목표 설정',
      date: '2024년 3월 13일',
    },
    {
      id: 4,
      type: 'badge',
      title: '첫 저축 뱃지 획득',
      date: '2024년 3월 15일',
    },
    {
      id: 5,
      type: 'mission',
      title: '일일 미션 완료',
      date: '2024년 3월 14일',
    },
  ]);

  const handleProfileUpdate = (updatedUser) => {
    setUser(updatedUser);
    // TODO: API 호출하여 서버에 업데이트
  };

  const menuItems = [
    { icon: <AccountCircle />, text: '계정 정보', path: '/mypage/account' },
    { icon: <Settings />, text: '설정', path: '/mypage/settings' },
    { icon: <History />, text: '활동 내역', path: '/mypage/history' },
    { icon: <Notifications />, text: '알림 설정', path: '/mypage/notifications' },
    { icon: <Help />, text: '고객 지원', path: '/mypage/support' },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4, pt: '72px', overflowX: 'auto' }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <ProfileCustomization user={user} onUpdate={handleProfileUpdate} />
          
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">뱃지 컬렉션</Typography>
                <IconButton onClick={() => setBadgeDetailsOpen(true)}>
                  <BadgeIcon />
                </IconButton>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {user.profile.selectedBadges.map(badgeId => (
                  <Chip
                    key={badgeId}
                    label={`뱃지 #${badgeId}`}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <List>
                {menuItems.map((item, index) => (
                  <React.Fragment key={item.text}>
                    <ListItem button>
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.text} />
                    </ListItem>
                    {index < menuItems.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
                <Divider />
                <ListItem button>
                  <ListItemIcon>
                    <Logout />
                  </ListItemIcon>
                  <ListItemText primary="로그아웃" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ minWidth: 320, maxWidth: '100%', overflowX: 'auto' }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                활동 요약
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" color="primary">
                      5
                    </Typography>
                    <Typography variant="body1">달성한 목표</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" color="primary">
                      3
                    </Typography>
                    <Typography variant="body1">획득한 뱃지</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" color="primary">
                      85%
                    </Typography>
                    <Typography variant="body1">목표 달성률</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" color="primary">
                      12
                    </Typography>
                    <Typography variant="body1">연속 저축일</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Box sx={{ mt: 3, minWidth: 320, maxWidth: '100%', overflowX: 'auto' }}>
            <ActivityHistory activities={activities} />
          </Box>
        </Grid>
      </Grid>

      <BadgeDetails
        open={badgeDetailsOpen}
        onClose={() => setBadgeDetailsOpen(false)}
        badge={{
          name: '첫 저축 뱃지',
          description: '첫 저축 목표를 달성하여 획득한 뱃지입니다.',
          requirement: '첫 저축 목표 달성',
          earnedDate: '2024년 3월 15일'
        }}
      />
    </Container>
  );
};

export default MyPage; 
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Share as ShareIcon,
  EmojiEvents as TrophyIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { BADGE_TYPES } from '../../constants/badgeTypes';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const SocialFeatures = () => {
  const user = JSON.parse(sessionStorage.getItem('user'));
  const [friends, setFriends] = useState(() => {
    // 친구 목록을 localStorage에서 불러오기
    return JSON.parse(localStorage.getItem('dondoli_friends_' + user.id) || '[]');
  });
  const [friendInput, setFriendInput] = useState('');
  const [achievements, setAchievements] = useState([]);
  const [quizRanking, setQuizRanking] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);

  // 친구별 뱃지/퀴즈/저축 비교 데이터 불러오기
  useEffect(() => {
    if (!user) return;
    // 예시: 모든 유저 중 친구만 필터링
    const users = JSON.parse(localStorage.getItem('dondoli_users') || '[]');
    const myFriends = users.filter(u => friends.some(f => f.id === u.id));
    setQuizRanking([
      ...myFriends.map(f => ({
        id: f.id,
        name: f.name,
        quizScore: (f.quizResults || []).reduce((sum, q) => sum + (q.score || 0), 0),
        badges: f.badges || {},
        savings: (f.savings || []).reduce((sum, s) => sum + (s.currentAmount || 0), 0),
      })),
      {
        id: user.id,
        name: user.name,
        quizScore: (user.quizResults || []).reduce((sum, q) => sum + (q.score || 0), 0),
        badges: user.badges || {},
        savings: (user.savings || []).reduce((sum, s) => sum + (s.currentAmount || 0), 0),
      }
    ].sort((a, b) => b.quizScore - a.quizScore));
  }, [friends, user]);

  // 친구 추가
  const handleAddFriend = () => {
    if (!friendInput.trim()) return;
    const users = JSON.parse(localStorage.getItem('dondoli_users') || '[]');
    const friend = users.find(u => u.name === friendInput.trim() && u.id !== user.id);
    if (friend && !friends.some(f => f.id === friend.id)) {
      const updated = [...friends, { id: friend.id, name: friend.name }];
      setFriends(updated);
      localStorage.setItem('dondoli_friends_' + user.id, JSON.stringify(updated));
      setFriendInput('');
    }
  };

  // 친구 삭제
  const handleRemoveFriend = (id) => {
    const updated = friends.filter(f => f.id !== id);
    setFriends(updated);
    localStorage.setItem('dondoli_friends_' + user.id, JSON.stringify(updated));
  };

  // 내 뱃지 자랑(친구에게 메시지로 공유)
  const handleShareBadge = (badgeKey) => {
    // 메시지 전송 예시
    alert('뱃지 자랑 메시지가 친구에게 전송되었습니다!');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        소셜 기능
      </Typography>
      <Grid container spacing={3}>
        {/* 친구 목록 및 비교 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">친구 목록</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    size="small"
                    placeholder="친구 이름"
                    value={friendInput}
                    onChange={e => setFriendInput(e.target.value)}
                  />
                  <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddFriend}>
                    친구 추가
                  </Button>
                </Box>
              </Box>
              <List>
                {friends.map((friend) => (
                  <React.Fragment key={friend.id}>
                    <ListItem button onClick={() => setSelectedFriend(friend)}>
                      <ListItemAvatar>
                        <Avatar>{friend.name[0]}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={friend.name}
                        secondary={
                          quizRanking.find(q => q.id === friend.id)
                            ? `저축액: ${quizRanking.find(q => q.id === friend.id).savings.toLocaleString()}원 | 퀴즈점수: ${quizRanking.find(q => q.id === friend.id).quizScore}`
                            : ''
                        }
                      />
                      <ListItemSecondaryAction>
                        <Button color="error" onClick={() => handleRemoveFriend(friend.id)}>삭제</Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* 퀴즈 랭킹/뱃지 자랑 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                퀴즈 랭킹 & 뱃지 자랑
              </Typography>
              <List>
                {quizRanking.map((user, idx) => (
                  <React.Fragment key={user.id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar>{user.name[0]}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${idx + 1}위: ${user.name}`}
                        secondary={`퀴즈점수: ${user.quizScore}점 | 저축액: ${user.savings.toLocaleString()}원`}
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {BADGE_TYPES.map(badge => {
                          const tier = user.badges?.[badge.key];
                          return tier ? (
                            <Chip
                              key={badge.key}
                              icon={<EmojiEventsIcon />}
                              label={badge.name + ' ' + tier}
                              color={user.id === user.id ? 'primary' : 'default'}
                              onClick={() => handleShareBadge(badge.key)}
                            />
                          ) : null;
                        })}
                      </Box>
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      {/* 친구 상세 비교(뱃지 등) */}
      {selectedFriend && (
        <Dialog open={!!selectedFriend} onClose={() => setSelectedFriend(null)} maxWidth="sm" fullWidth>
          <DialogTitle>{selectedFriend.name}님의 뱃지/퀴즈/저축 비교</DialogTitle>
          <DialogContent>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>뱃지 현황</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              {BADGE_TYPES.map(badge => {
                const tier = quizRanking.find(q => q.id === selectedFriend.id)?.badges?.[badge.key];
                return tier ? (
                  <Chip key={badge.key} icon={<EmojiEventsIcon />} label={badge.name + ' ' + tier} color="primary" />
                ) : null;
              })}
            </Box>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>퀴즈 점수: {quizRanking.find(q => q.id === selectedFriend.id)?.quizScore || 0}점</Typography>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>저축액: {quizRanking.find(q => q.id === selectedFriend.id)?.savings.toLocaleString() || 0}원</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedFriend(null)}>닫기</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default SocialFeatures; 
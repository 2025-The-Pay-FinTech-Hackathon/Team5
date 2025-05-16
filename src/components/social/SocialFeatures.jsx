import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Share as ShareIcon,
  EmojiEvents as TrophyIcon,
  Add as AddIcon,
} from '@mui/icons-material';

const SocialFeatures = () => {
  const [friends, setFriends] = useState([
    { id: 1, name: '친구1', savings: 150000, streak: 5 },
    { id: 2, name: '친구2', savings: 200000, streak: 8 },
    { id: 3, name: '친구3', savings: 180000, streak: 3 },
  ]);

  const [achievements, setAchievements] = useState([
    { id: 1, title: '첫 저축', description: '첫 저축 목표 달성!', date: '2024-03-15' },
    { id: 2, title: '미션 마스터', description: '10개의 미션 완료', date: '2024-03-14' },
    { id: 3, title: '퀴즈 전문가', description: '퀴즈 100점 달성', date: '2024-03-13' },
  ]);

  const handleShare = (achievement) => {
    // 공유 기능 구현
    console.log('Sharing achievement:', achievement);
  };

  const handleAddFriend = () => {
    // 친구 추가 기능 구현
    console.log('Adding new friend');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        소셜 기능
      </Typography>

      <Grid container spacing={3}>
        {/* 친구 목록 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">친구 목록</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddFriend}
                >
                  친구 추가
                </Button>
              </Box>
              <List>
                {friends.map((friend) => (
                  <React.Fragment key={friend.id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar>{friend.name[0]}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={friend.name}
                        secondary={`저축액: ${friend.savings.toLocaleString()}원 | 연속 ${friend.streak}일`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" aria-label="trophy">
                          <TrophyIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* 업적 공유 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                업적 공유
              </Typography>
              <List>
                {achievements.map((achievement) => (
                  <React.Fragment key={achievement.id}>
                    <ListItem>
                      <ListItemText
                        primary={achievement.title}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.primary">
                              {achievement.description}
                            </Typography>
                            <br />
                            {achievement.date}
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          aria-label="share"
                          onClick={() => handleShare(achievement)}
                        >
                          <ShareIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SocialFeatures; 
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { getNotifications, markNotificationAsRead } from '../../utils/notificationUtils';

const NotificationCenter = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // 알림 목록 불러오기
    const loadNotifications = () => {
      const user = JSON.parse(sessionStorage.getItem('user'));
      const userNotifications = getNotifications(user?.id) || [];
      setNotifications(userNotifications);
    };

    loadNotifications();
    // 30초마다 알림 갱신
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markNotificationAsRead(notification.id);
      setNotifications(notifications.map(n =>
        n.id === notification.id ? { ...n, read: true } : n
      ));
    }
    
    // 알림 타입에 따른 페이지 이동
    switch (notification.type) {
      case 'mission':
        navigate('/child/missions');
        break;
      case 'quiz':
        navigate('/child/quiz');
        break;
      case 'savings':
        navigate('/child/savings');
        break;
      case 'store':
        navigate('/child/store');
        break;
      default:
        break;
    }
    handleClose();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            maxHeight: 400,
            width: 360,
            bgcolor: '#FFFDE7',
            color: '#222',
            '& .MuiMenuItem-root': {
              '&:hover': {
                bgcolor: '#FFE066',
              },
            },
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>알림</Typography>
          {notifications.length > 0 && (
            <Button
              size="small"
              onClick={() => {
                notifications.forEach(n => markNotificationAsRead(n.id));
                setNotifications(notifications.map(n => ({ ...n, read: true })));
              }}
              sx={{ color: '#666' }}
            >
              모두 읽음
            </Button>
          )}
        </Box>
        <Divider />
        <List sx={{ width: '100%' }}>
          {notifications.length === 0 ? (
            <ListItem>
              <ListItemText 
                primary="새로운 알림이 없습니다" 
                sx={{ textAlign: 'center', color: '#666' }}
              />
            </ListItem>
          ) : (
            notifications.map((notification) => (
              <ListItem
                key={notification.id}
                button
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  bgcolor: notification.read ? 'inherit' : '#FFF9C4',
                  '&:hover': {
                    bgcolor: '#FFE066',
                  },
                }}
              >
                <ListItemText
                  primary={
                    <Typography variant="body1" sx={{ fontWeight: notification.read ? 400 : 700 }}>
                      {notification.title}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      {notification.message}
                    </Typography>
                  }
                />
              </ListItem>
            ))
          )}
        </List>
      </Menu>
    </>
  );
};

export default NotificationCenter; 
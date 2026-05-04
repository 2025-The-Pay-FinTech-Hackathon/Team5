import React, { useCallback, useState, useEffect } from 'react';
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
import {
  addNotification,
  getNotifications,
  loadNotifications as fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  NOTIFICATIONS_CHANGED_EVENT,
  updateNotification,
} from '../../utils/notificationUtils';
import { LOCAL_DATA_CHANGED_EVENT, findChildById, updateChild } from '../../utils/localData';

const NotificationCenter = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const loadLocalNotifications = useCallback(() => {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user?.id) {
      setNotifications([]);
      return;
    }

    setNotifications(getNotifications(user.id) || []);
  }, []);

  const refreshNotifications = useCallback(async () => {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user?.id) {
      setNotifications([]);
      return;
    }

    setNotifications(getNotifications(user.id) || []);
    const userNotifications = await fetchNotifications(user.id);
    setNotifications(userNotifications || []);
  }, []);

  useEffect(() => {
    refreshNotifications();
    const refreshTimers = [];

    const refreshNotificationsWithRetries = () => {
      refreshNotifications();

      [800, 1600].forEach((delay) => {
        const timer = window.setTimeout(refreshNotifications, delay);
        refreshTimers.push(timer);
      });
    };

    const handleStorage = (event) => {
      if (!event.key || event.key === 'dondoli_notifications') {
        loadLocalNotifications();
      }

      if (!event.key || event.key === 'children') {
        refreshNotificationsWithRetries();
      }
    };

    const handleLocalDataChanged = (event) => {
      if (!event.detail?.key || event.detail.key === 'children') {
        refreshNotificationsWithRetries();
      }
    };

    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, loadLocalNotifications);
    window.addEventListener(LOCAL_DATA_CHANGED_EVENT, handleLocalDataChanged);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, loadLocalNotifications);
      window.removeEventListener(LOCAL_DATA_CHANGED_EVENT, handleLocalDataChanged);
      window.removeEventListener('storage', handleStorage);
      refreshTimers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [loadLocalNotifications, refreshNotifications]);

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
    const user = JSON.parse(sessionStorage.getItem('user'));
    const basePath = user?.role === 'parent' ? '/parent' : '/child';

    // 알림 타입에 따른 페이지 이동
    switch (notification.type) {
      case 'mission':
        navigate(`${basePath}/missions`);
        break;
      case 'quiz':
        navigate(user?.role === 'parent' ? '/parent/report' : '/child/quiz');
        break;
      case 'savings':
        navigate(`${basePath}/savings`);
        break;
      case 'store':
        navigate('/child/store');
        break;
      case 'loan':
        navigate(basePath);
        break;
      case 'message':
        navigate(`${basePath}/messages`);
        break;
      case 'wishlist':
        navigate(`${basePath}/wishlist`);
        break;
      case 'ledger':
      case 'allowance':
        navigate(`${basePath}/ledger`);
        break;
      case 'store_approval':
        break;
      default:
        break;
    }
    handleClose();
  };

  const handleApproveStorePurchase = (event, notification) => {
    event.stopPropagation();

    const user = JSON.parse(sessionStorage.getItem('user'));
    const data = notification.data || {};
    const child = findChildById(data.childId);

    if (!user?.id || !child || notification.actionStatus === 'approved') return;

    const today = new Date().toISOString().slice(0, 10);
    const purchaseId = data.purchaseId;
    const cashAmount = Number(data.cashAmount || 0);
    const updated = { ...child };
    const purchase = (updated.purchases || []).find(item => item.purchaseId === purchaseId);

    if (!purchase || purchase.status === '승인완료') {
      updateNotification(user.id, notification.id, current => ({
        ...current,
        read: true,
        actionStatus: 'approved',
      }));
      loadLocalNotifications();
      return;
    }

    updated.purchases = (updated.purchases || []).map(purchase => (
      purchase.purchaseId === purchaseId
        ? { ...purchase, status: '승인완료', approvedAt: today }
        : purchase
    ));

    if (cashAmount > 0) {
      updated.balance = (updated.balance || 0) + cashAmount;
      updated.ledgers = [
        {
          id: `${Date.now()}-${purchaseId}`,
          type: '입금',
          amount: cashAmount,
          date: today,
          memo: `${data.itemName} 승인`,
        },
        ...(updated.ledgers || []),
      ];
    }

    updateChild(updated);
    addNotification(updated.id, {
      type: 'store',
      title: '보상 구매가 승인되었어요',
      message: cashAmount > 0
        ? `${data.itemName} 승인이 완료되어 ${cashAmount.toLocaleString()}원이 지급되었습니다.`
        : `${data.itemName} 구매가 승인되었습니다.`,
      dedupeKey: `store-approved:${updated.id}:${purchaseId}`,
      data: {
        purchaseId,
        itemName: data.itemName,
        cashAmount,
      },
    });

    updateNotification(user.id, notification.id, current => ({
      ...current,
      read: true,
      actionStatus: 'approved',
      title: '보상 구매 승인 완료',
      message: `${data.childName || updated.name}님의 ${data.itemName} 구매를 승인했습니다.`,
    }));
    loadLocalNotifications();
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
                const user = JSON.parse(sessionStorage.getItem('user'));
                markAllNotificationsAsRead(user?.id);
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
            notifications.map((notification) => {
              const canApproveStorePurchase =
                notification.action?.type === 'approveStorePurchase' &&
                notification.actionStatus !== 'approved';

              return (
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
                {canApproveStorePurchase && (
                  <Button
                    size="small"
                    variant="contained"
                    onClick={(event) => handleApproveStorePurchase(event, notification)}
                    sx={{ ml: 1, whiteSpace: 'nowrap' }}
                  >
                    승인
                  </Button>
                )}
                {notification.actionStatus === 'approved' && (
                  <Typography variant="caption" color="success.main" sx={{ ml: 1, whiteSpace: 'nowrap' }}>
                    승인완료
                  </Typography>
                )}
              </ListItem>
              );
            })
          )}
        </List>
      </Menu>
    </>
  );
};

export default NotificationCenter; 

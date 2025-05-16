import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  EmojiEvents as EmojiEventsIcon,
  Savings as SavingsIcon,
  ListAlt as ListAltIcon,
  Favorite as FavoriteIcon,
  Person as PersonIcon,
  AccountCircle,
  Notifications,
  ExitToApp as ExitToAppIcon,
} from '@mui/icons-material';
import NotificationCenter from './notifications/NotificationCenter';

function ParentNavigation({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const menuItems = [
    { text: '대시보드', icon: <DashboardIcon />, path: '/parent' },
    { text: '미션 관리', icon: <EmojiEventsIcon />, path: '/parent/missions' },
    { text: '저축 관리', icon: <SavingsIcon />, path: '/parent/savings' },
    { text: '가계부', icon: <ListAltIcon />, path: '/parent/ledger' },
    { text: '위시리스트', icon: <FavoriteIcon />, path: '/parent/wishlist' },
    { text: '마이페이지', icon: <PersonIcon />, path: '/parent/mypage' },
  ];

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleLogout = () => {
    handleClose();
    onLogout();
    navigate('/');
  };

  const handleNavigation = (path) => {
    if (location.pathname !== path) {
      navigate(path);
    }
    setDrawerOpen(false);
  };

  return (
    <AppBar position="fixed" sx={{ borderRadius: 0, boxShadow: 2, bgcolor: '#FFD600', color: '#222' }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        {/* 왼쪽: 햄버거/로고 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton color="inherit" edge="start" onClick={() => setDrawerOpen(true)} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700 }}>
            Dondoli
          </Typography>
        </Box>

        {/* 가운데: 메뉴 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {menuItems.map(item => (
            <Button
              key={item.text}
              color="inherit"
              startIcon={item.icon}
              onClick={() => handleNavigation(item.path)}
              sx={{
                fontWeight: 700,
                '&:hover': { bgcolor: 'rgba(0,0,0,0.1)' }
              }}
            >
              {item.text}
            </Button>
          ))}
        </Box>

        {/* 오른쪽: 알림/프로필/이름 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body1" sx={{ mr: 1, fontWeight: 600 }}>{user?.name}님</Typography>
          <NotificationCenter />
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#222' }}>
              {user?.name?.[0] || <AccountCircle />}
            </Avatar>
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            keepMounted
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={() => {
              handleClose();
              handleNavigation('/parent/mypage');
            }}>
              마이페이지
            </MenuItem>
            <MenuItem onClick={handleLogout}>로그아웃</MenuItem>
          </Menu>
        </Box>
      </Toolbar>

      {/* 드로어(사이드 메뉴) */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: '#FFFDE7',
            color: '#222',
          }
        }}
      >
        <Box sx={{ width: 250 }} role="presentation">
          <List>
            {menuItems.map((item) => (
              <ListItem
                button
                key={item.text}
                onClick={() => handleNavigation(item.path)}
                selected={location.pathname === item.path}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  '&.Mui-selected': {
                    bgcolor: '#FFD600',
                    '&:hover': { bgcolor: '#FFE066' }
                  }
                }}
              >
                <ListItemIcon sx={{ color: 'inherit' }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} sx={{ fontWeight: 600 }} />
              </ListItem>
            ))}
          </List>
          <Divider />
          <List>
            <ListItem
              button
              onClick={handleLogout}
              sx={{
                borderRadius: 2,
                color: '#d32f2f',
                '&:hover': { bgcolor: '#ffebee' }
              }}
            >
              <ListItemIcon sx={{ color: 'inherit' }}>
                <ExitToAppIcon />
              </ListItemIcon>
              <ListItemText primary="로그아웃" sx={{ fontWeight: 600 }} />
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
}

export default ParentNavigation; 
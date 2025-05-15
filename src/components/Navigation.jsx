import React from 'react';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Divider,
  Menu,
  MenuItem,
  Avatar,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  School as SchoolIcon,
  EmojiEvents as EmojiEventsIcon,
  Savings as SavingsIcon,
  Store as StoreIcon,
  ExitToApp as ExitToAppIcon,
  ListAlt as ListAltIcon,
  Favorite as FavoriteIcon,
  Person as PersonIcon,
  AccountCircle,
  Message,
  Analytics,
  People,
  Notifications,
} from '@mui/icons-material';

function Navigation({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);

  const isParent = user?.role === 'parent';

  const menuItems = isParent
    ? [
        { text: '대시보드', icon: <DashboardIcon />, path: '/parent' },
        { text: '미션 관리', icon: <EmojiEventsIcon />, path: '/parent/missions' },
        { text: '저축 관리', icon: <SavingsIcon />, path: '/parent/savings' },
        { text: '가계부', icon: <ListAltIcon />, path: '/ledger' },
        { text: '위시리스트', icon: <FavoriteIcon />, path: '/wishlist' },
        { text: '마이페이지', icon: <PersonIcon />, path: '/mypage' },
      ]
    : [
        { text: '대시보드', icon: <DashboardIcon />, path: '/child' },
        { text: '금융 퀴즈', icon: <SchoolIcon />, path: '/child/quiz' },
        { text: '미션', icon: <EmojiEventsIcon />, path: '/child/missions' },
        { text: '저축', icon: <SavingsIcon />, path: '/child/savings' },
        { text: '보상 상점', icon: <StoreIcon />, path: '/child/store' },
        { text: '가계부', icon: <ListAltIcon />, path: '/ledger' },
        { text: '위시리스트', icon: <FavoriteIcon />, path: '/wishlist' },
        { text: '마이페이지', icon: <PersonIcon />, path: '/mypage' },
      ];

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleNavigation = (path) => {
    if (location.pathname !== path) {
      window.location.href = path;
    }
    setDrawerOpen(false);
  };

  const handleLogoutClick = () => {
    onLogout();
    navigate('/');
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    handleLogoutClick();
  };

  const prefix = isParent ? '/parent' : '/child';

  return (
    <>
      <AppBar position="fixed" sx={{ borderRadius: 0, boxShadow: 2 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            MwoniMoney
          </Typography>
          <Typography variant="body1" sx={{ mr: 2 }}>
            {user?.name}님
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              color="inherit"
              onClick={() => navigate(`${prefix}/notifications`)}
            >
              <Notifications />
            </IconButton>

            <Button
              color="inherit"
              startIcon={<DashboardIcon />}
              onClick={() => navigate(prefix)}
            >
              대시보드
            </Button>

            <Button
              color="inherit"
              startIcon={<SchoolIcon />}
              onClick={() => navigate(`${prefix}/education`)}
            >
              금융 교육
            </Button>

            <Button
              color="inherit"
              startIcon={<Message />}
              onClick={() => navigate(`${prefix}/messages`)}
            >
              메시지
            </Button>

            <Button
              color="inherit"
              startIcon={<Analytics />}
              onClick={() => navigate(`${prefix}/analytics`)}
            >
              성과 분석
            </Button>

            <Button
              color="inherit"
              startIcon={<People />}
              onClick={() => navigate(`${prefix}/social`)}
            >
              소셜
            </Button>

            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                {user?.name?.[0] || <AccountCircle />}
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={() => {
                handleClose();
                navigate('/mypage');
              }}>
                마이페이지
              </MenuItem>
              <MenuItem onClick={handleLogout}>로그아웃</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        PaperProps={{ sx: { borderRadius: 0 } }}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
        >
          <List>
            {menuItems.map((item) => (
              <ListItem
                button
                key={item.text}
                onClick={() => handleNavigation(item.path)}
                selected={location.pathname === item.path}
                sx={{ borderRadius: 2, mb: 0.5 }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
          <Divider />
          <List>
            <ListItem button onClick={handleLogoutClick} sx={{ borderRadius: 2 }}>
              <ListItemIcon>
                <ExitToAppIcon />
              </ListItemIcon>
              <ListItemText primary="로그아웃" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
}

export default Navigation; 
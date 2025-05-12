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
} from '@mui/icons-material';

function Navigation({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

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
      navigate(path);
    }
    setDrawerOpen(false);
  };

  const handleLogoutClick = () => {
    onLogout();
    navigate('/');
  };

  return (
    <>
      <AppBar position="static" sx={{ borderRadius: 0, boxShadow: 2 }}>
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
          <Button color="inherit" onClick={handleLogoutClick} sx={{ fontWeight: 600 }}>
            로그아웃
          </Button>
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
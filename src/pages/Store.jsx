import { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  Info as InfoIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { findChildById, updateChild } from '../utils/localData';
import { useLocation } from 'react-router-dom';

const STORE_ITEMS = [
  {
    id: 1,
    name: '게임 시간 30분',
    description: '게임을 30분 더 할 수 있는 시간을 구매합니다.',
    points: 500,
    image: 'https://via.placeholder.com/150',
    category: '엔터테인먼트',
  },
  {
    id: 2,
    name: '용돈 5,000원',
    description: '5,000원의 용돈을 받을 수 있습니다.',
    points: 1000,
    image: 'https://via.placeholder.com/150',
    category: '용돈',
  },
  {
    id: 3,
    name: '영화 보기',
    description: '영화를 한 편 볼 수 있는 기회를 얻습니다.',
    points: 800,
    image: 'https://via.placeholder.com/150',
    category: '엔터테인먼트',
  },
  {
    id: 4,
    name: '용돈 10,000원',
    description: '10,000원의 용돈을 받을 수 있습니다.',
    points: 2000,
    image: 'https://via.placeholder.com/150',
    category: '용돈',
  },
];

function Store() {
  const user = JSON.parse(sessionStorage.getItem('user'));
  const isParent = user?.role === 'parent';
  const [child, setChild] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [tab, setTab] = useState(0);
  const location = useLocation();

  useEffect(() => {
    if (!isParent) {
      setChild(findChildById(user.id));
    }
  }, [user, location.pathname]);

  const handleOpenDialog = (item) => {
    setSelectedItem(item);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedItem(null);
  };

  const handlePurchase = () => {
    if (!child || !selectedItem) return;
    if ((child.points || 0) < selectedItem.points) {
      setSnackbar({ open: true, message: '포인트가 부족합니다.', severity: 'error' });
      handleCloseDialog();
      return;
    }
    const updated = { ...child };
    updated.points = (updated.points || 0) - selectedItem.points;
    updated.purchases = [
      ...(updated.purchases || []),
      { ...selectedItem, purchasedAt: new Date().toISOString().slice(0, 10) },
    ];
    updateChild(updated);
    setChild(updated);
    setSnackbar({ open: true, message: `${selectedItem.name} 구매 완료!`, severity: 'success' });
    handleCloseDialog();
  };

  // 구매 내역
  const purchaseHistory = (child?.purchases || []).slice().reverse();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, minHeight: '80vh' }}>
      <Grid container spacing={3} alignItems="flex-start">
        {/* Header */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ShoppingCartIcon sx={{ mr: 1, fontSize: 32 }} />
              <Typography variant="h4" component="h1">
                보상 상점
              </Typography>
            </Box>
            {!isParent && (
              <Chip
                icon={<StarIcon />}
                label={`보유 포인트: ${(child?.points || 0).toLocaleString()}`}
                color="primary"
                variant="outlined"
              />
            )}
          </Paper>
        </Grid>
        {/* Tabs */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, boxShadow: 1 }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} indicatorColor="primary" textColor="primary">
              <Tab label="상품 구매" />
              <Tab label="구매 내역" />
            </Tabs>
            {tab === 0 && (
              <Box sx={{ mt: 3 }}>
                <Grid container spacing={3} alignItems="flex-start">
                  {STORE_ITEMS.map((item) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={item.id} sx={{ display: 'flex' }}>
                      <Card sx={{ boxShadow: 2, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 320 }}>
                        <CardMedia
                          component="img"
                          height="140"
                          image={item.image}
                          alt={item.name}
                        />
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Typography variant="h6" component="div">
                              {item.name}
                            </Typography>
                            <Tooltip title="상품 상세 정보">
                              <IconButton size="small">
                                <InfoIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {item.description}
                          </Typography>
                          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Chip
                              icon={<StarIcon />}
                              label={`${item.points.toLocaleString()} 포인트`}
                              color="primary"
                              size="small"
                            />
                            <Chip
                              label={item.category}
                              color="secondary"
                              size="small"
                            />
                          </Box>
                        </CardContent>
                        <CardActions>
                          {!isParent && (
                            <Button
                              fullWidth
                              variant="contained"
                              color="primary"
                              onClick={() => handleOpenDialog(item)}
                              disabled={(child?.points || 0) < item.points}
                            >
                              구매하기
                            </Button>
                          )}
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
            {tab === 1 && (
              <Box sx={{ mt: 3, minHeight: 320, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                <Typography variant="h6" sx={{ mb: 2 }}>구매 내역</Typography>
                {purchaseHistory.length > 0 ? (
                  <List>
                    {purchaseHistory.map((purchase, idx) => (
                      <Box key={idx}>
                        <ListItem>
                          <ListItemText
                            primary={purchase.name}
                            secondary={`${purchase.purchasedAt} | ${purchase.points.toLocaleString()}점 | ${purchase.category}`}
                          />
                        </ListItem>
                        <Divider />
                      </Box>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', minHeight: 120 }}>
                    <Typography color="text.secondary">구매 내역이 없습니다.</Typography>
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Purchase Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>상품 구매</DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedItem.name}
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {selectedItem.description}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  필요 포인트: {selectedItem.points.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  보유 포인트: {(child?.points || 0).toLocaleString()}
                </Typography>
                <Typography
                  variant="body2"
                  color={(child?.points || 0) >= selectedItem.points ? 'success.main' : 'error.main'}
                  sx={{ mt: 1 }}
                >
                  {(child?.points || 0) >= selectedItem.points
                    ? '구매 가능합니다.'
                    : '포인트가 부족합니다.'}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>취소</Button>
          <Button
            onClick={handlePurchase}
            variant="contained"
            color="primary"
            disabled={!selectedItem || (child?.points || 0) < selectedItem.points}
          >
            구매하기
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for purchase feedback */}
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

export default Store; 
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
import { LOCAL_DATA_CHANGED_EVENT, findChildById, updateChild } from '../utils/localData';
import { addNotification } from '../utils/notificationUtils';
import { useLocation } from 'react-router-dom';
import gameImg from '../assets/store/game.png';
import moneyImg from '../assets/store/money-5k.png';
import movieImg from '../assets/store/movie.png';
import moneymanImg from '../assets/store/moneyman.png';


const STORE_ITEMS = [
  {
    id: 1,
    name: '게임 시간 30분',
    description: '게임을 30분 더 할 수 있는 시간을 구매합니다.',
    points: 500,
    image: gameImg,
    category: '엔터테인먼트',
  },
  {
    id: 2,
    name: '용돈 5,000원',
    description: '5,000원의 용돈을 받을 수 있습니다.',
    points: 1000,
     image: moneyImg,
    category: '용돈',
    cashAmount: 5000,
  },
  {
    id: 3,
    name: '영화 보기',
    description: '영화를 한 편 볼 수 있는 기회를 얻습니다.',
    points: 800,
    image: movieImg,
    category: '엔터테인먼트',
  },
  {
    id: 4,
    name: '용돈 10,000원',
    description: '10,000원의 용돈을 받을 수 있습니다.',
    points: 2000,
    image: moneymanImg,
    category: '용돈',
    cashAmount: 10000,
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
  const userId = user?.id;

  useEffect(() => {
    if (!isParent) {
      setChild(findChildById(userId));
    }
  }, [userId, location.pathname]);

  useEffect(() => {
    if (isParent || !userId) return undefined;

    const refreshChild = () => setChild(findChildById(userId));

    const handleLocalDataChanged = (event) => {
      if (!event.detail?.key || event.detail.key === 'children') {
        refreshChild();
      }
    };

    const handleStorage = (event) => {
      if (!event.key || event.key === 'children') {
        refreshChild();
      }
    };

    window.addEventListener(LOCAL_DATA_CHANGED_EVENT, handleLocalDataChanged);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(LOCAL_DATA_CHANGED_EVENT, handleLocalDataChanged);
      window.removeEventListener('storage', handleStorage);
    };
  }, [isParent, userId]);

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
    const purchaseId = `${Date.now()}-${selectedItem.id}`;
    const purchasedAt = new Date().toISOString().slice(0, 10);
    updated.points = (updated.points || 0) - selectedItem.points;
    updated.purchases = [
      ...(updated.purchases || []),
      {
        ...selectedItem,
        purchaseId,
        purchasedAt,
        status: '승인대기',
      },
    ];
    updateChild(updated);
    setChild(updated);

    if (updated.parentId && typeof navigator !== 'undefined' && !navigator.onLine) {
      addNotification(updated.parentId, {
        type: 'store_approval',
        title: '보상 구매 승인 요청',
        message: `${updated.name}님이 ${selectedItem.name} 구매를 요청했습니다.`,
        action: { type: 'approveStorePurchase' },
        actionStatus: 'pending',
        dedupeKey: `store-approval:${updated.id}:${purchaseId}`,
        data: {
          childId: updated.id,
          childName: updated.name,
          purchaseId,
          itemName: selectedItem.name,
          points: selectedItem.points,
          cashAmount: selectedItem.cashAmount || 0,
        },
      });
    }

    setSnackbar({ open: true, message: '구매 요청을 보냈습니다. 부모 승인 후 처리됩니다.', severity: 'success' });
    handleCloseDialog();
  };

  const purchaseHistory = (child?.purchases || []).slice().reverse();

  return (
    <Container maxWidth="lg" sx={{ pt: '64px', mt: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ShoppingCartIcon sx={{ mr: 1, fontSize: 30 }} />
          <Typography variant="h5" fontWeight={700}>보상 상점</Typography>
        </Box>
        {!isParent && (
          <Chip
            icon={<StarIcon />}
            label={`보유 포인트: ${(child?.points || 0).toLocaleString()}`}
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        )}
      </Box>

      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} indicatorColor="primary" textColor="primary">
          <Tab label="상품 구매" />
          <Tab label="구매 내역" />
        </Tabs>

        {tab === 0 && (
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {STORE_ITEMS.map((item) => {
              const canBuy = (child?.points || 0) >= item.points;
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                  <Card
                    sx={{
                      height: '100%',
                      borderRadius: 2,
                      boxShadow: 2,
                      transition: '0.2s',
                      '&:hover': { boxShadow: 5 },
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="140"
                      image={item.image}
                      alt={item.name}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1" fontWeight={600}>{item.name}</Typography>
                        <Tooltip title="상세정보">
                          <IconButton size="small"><InfoIcon /></IconButton>
                        </Tooltip>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {item.description}
                      </Typography>
                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                        <Chip icon={<StarIcon />} label={`${item.points.toLocaleString()} pt`} size="small" />
                        <Chip label={item.category} color="default" size="small" />
                      </Box>
                    </CardContent>
                    {!isParent && (
                      <CardActions sx={{ px: 2, pb: 2 }}>
                        <Button
                          fullWidth
                          variant="contained"
                          color="primary"
                          onClick={() => handleOpenDialog(item)}
                          disabled={!canBuy}
                        >
                          {canBuy ? '구매하기' : '포인트 부족'}
                        </Button>
                      </CardActions>
                    )}
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {tab === 1 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>구매 내역</Typography>
            {purchaseHistory.length > 0 ? (
              <List dense>
                {purchaseHistory.map((purchase, idx) => (
                  <Box key={idx}>
                    <ListItem>
                      <ListItemText
                        primary={purchase.name}
                        secondary={`${purchase.purchasedAt} | ${purchase.points.toLocaleString()} pt | ${purchase.category} | ${purchase.status || '완료'}`}
                      />
                    </ListItem>
                    <Divider />
                  </Box>
                ))}
              </List>
            ) : (
              <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                구매 내역이 없습니다.
              </Typography>
            )}
          </Box>
        )}
      </Paper>

      {/* 구매 확인 Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>상품 구매</DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="h6">{selectedItem.name}</Typography>
              <Typography variant="body1" color="text.secondary">{selectedItem.description}</Typography>
              <Typography variant="body2" sx={{ mt: 2 }}>
                필요 포인트: {selectedItem.points.toLocaleString()} pt
              </Typography>
              <Typography variant="body2">
                보유 포인트: {(child?.points || 0).toLocaleString()} pt
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
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>취소</Button>
          <Button
            onClick={handlePurchase}
            variant="contained"
            disabled={!selectedItem || (child?.points || 0) < selectedItem.points}
          >
            구매하기
          </Button>
        </DialogActions>
      </Dialog>

      {/* 구매 결과 알림 */}
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

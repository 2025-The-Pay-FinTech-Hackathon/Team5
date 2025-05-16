import React, { useState } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import ReceiptUploader from '../components/receipt/ReceiptUploader';

const AccountBook = () => {
  const [tabValue, setTabValue] = useState(0);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense',
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const categories = {
    expense: [
      '식비',
      '교통비',
      '주거비',
      '통신비',
      '의료비',
      '교육비',
      '문화생활',
      '기타',
    ],
    income: [
      '급여',
      '부수입',
      '투자수익',
      '기타',
    ],
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleAddTransaction = () => {
    setTransactions([
      ...transactions,
      {
        id: Date.now(),
        ...newTransaction,
        amount: Number(newTransaction.amount),
      },
    ]);
    setNewTransaction({
      type: 'expense',
      category: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
    setIsAddDialogOpen(false);
  };

  const handleDeleteTransaction = (id) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const handleReceiptSave = (receiptData) => {
    setTransactions([
      ...transactions,
      {
        id: Date.now(),
        type: 'expense',
        category: receiptData.category || '식비',
        amount: receiptData.totalAmount,
        description: `${receiptData.storeName} - ${receiptData.items.map(item => item.name).join(', ')}`,
        date: receiptData.date.split(' ')[0],
        receipt: receiptData,
      },
    ]);
    setIsReceiptDialogOpen(false);
  };

  const calculateTotal = (type) => {
    return transactions
      .filter(t => t.type === type)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4">가계부</Typography>
            <Box>
              <Button
                variant="outlined"
                startIcon={<ReceiptIcon />}
                onClick={() => setIsReceiptDialogOpen(true)}
                sx={{ mr: 1 }}
              >
                영수증 등록
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setIsAddDialogOpen(true)}
              >
                내역 추가
              </Button>
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                  <Tab label="지출" />
                  <Tab label="수입" />
                </Tabs>
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {tabValue === 0 ? '지출' : '수입'} 내역
                </Typography>
                <List>
                  {transactions
                    .filter(t => t.type === (tabValue === 0 ? 'expense' : 'income'))
                    .map((transaction) => (
                      <React.Fragment key={transaction.id}>
                        <ListItem>
                          <ListItemText
                            primary={transaction.description}
                            secondary={`${transaction.date} - ${transaction.category}`}
                          />
                          <ListItemSecondaryAction>
                            <Typography
                              variant="body1"
                              color={transaction.type === 'expense' ? 'error.main' : 'success.main'}
                              sx={{ mr: 2 }}
                            >
                              {new Intl.NumberFormat('ko-KR', {
                                style: 'currency',
                                currency: 'KRW',
                              }).format(transaction.amount)}
                            </Typography>
                            <IconButton
                              edge="end"
                              onClick={() => handleDeleteTransaction(transaction.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                        <Divider />
                      </React.Fragment>
                    ))}
                </List>
              </Box>

              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">
                  총 {tabValue === 0 ? '지출' : '수입'}
                </Typography>
                <Typography
                  variant="h6"
                  color={tabValue === 0 ? 'error.main' : 'success.main'}
                >
                  {new Intl.NumberFormat('ko-KR', {
                    style: 'currency',
                    currency: 'KRW',
                  }).format(calculateTotal(tabValue === 0 ? 'expense' : 'income'))}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 내역 추가 다이얼로그 */}
      <Dialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>내역 추가</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              select
              fullWidth
              label="유형"
              value={newTransaction.type}
              onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value })}
              margin="normal"
            >
              <MenuItem value="expense">지출</MenuItem>
              <MenuItem value="income">수입</MenuItem>
            </TextField>

            <TextField
              select
              fullWidth
              label="카테고리"
              value={newTransaction.category}
              onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
              margin="normal"
            >
              {categories[newTransaction.type].map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="금액"
              type="number"
              value={newTransaction.amount}
              onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
              margin="normal"
            />

            <TextField
              fullWidth
              label="설명"
              value={newTransaction.description}
              onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
              margin="normal"
            />

            <TextField
              fullWidth
              label="날짜"
              type="date"
              value={newTransaction.date}
              onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
              margin="normal"
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddDialogOpen(false)}>취소</Button>
          <Button onClick={handleAddTransaction} variant="contained">
            추가
          </Button>
        </DialogActions>
      </Dialog>

      {/* 영수증 업로드 다이얼로그 */}
      <Dialog
        open={isReceiptDialogOpen}
        onClose={() => setIsReceiptDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>영수증 등록</DialogTitle>
        <DialogContent>
          <ReceiptUploader onSave={handleReceiptSave} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsReceiptDialogOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AccountBook; 
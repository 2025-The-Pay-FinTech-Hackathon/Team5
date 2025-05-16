import React, { useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { processReceiptImage } from '../../services/ocrService';
import { preprocessImage } from '../../utils/imageProcessing';
import { classifyCategory } from '../../utils/categoryClassifier';

const ReceiptUploader = ({ onSave }) => {
  const [receiptImage, setReceiptImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editedItems, setEditedItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [storeName, setStoreName] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [error, setError] = useState('');
  const [detectedCategory, setDetectedCategory] = useState('');
  const fileInputRef = useRef(null);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setError('');
      setReceiptImage(URL.createObjectURL(file));
      setIsProcessing(true);

      try {
        // 이미지 전처리
        const processedImage = await preprocessImage(file);
        setReceiptImage(URL.createObjectURL(processedImage));

        // OCR 처리
        const result = await processReceiptImage(processedImage);
        setOcrResult(result);
        setEditedItems(result.items);
        setTotalAmount(result.totalAmount);
        setStoreName(result.storeName);
        setPurchaseDate(result.date);

        // 카테고리 자동 분류
        const category = classifyCategory(result.storeName, result.items);
        setDetectedCategory(category);

        setIsDialogOpen(true);
      } catch (err) {
        setError('영수증 처리 중 오류가 발생했습니다.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleEditItem = (index, field, value) => {
    const newItems = [...editedItems];
    newItems[index] = {
      ...newItems[index],
      [field]: field === 'price' ? Number(value) : value,
    };
    setEditedItems(newItems);
    updateTotalAmount(newItems);
  };

  const handleAddItem = () => {
    setEditedItems([
      ...editedItems,
      { name: '', price: 0, quantity: 1 },
    ]);
  };

  const handleRemoveItem = (index) => {
    const newItems = editedItems.filter((_, i) => i !== index);
    setEditedItems(newItems);
    updateTotalAmount(newItems);
  };

  const updateTotalAmount = (items) => {
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setTotalAmount(total);
  };

  const handleSave = () => {
    const receiptData = {
      storeName,
      date: purchaseDate,
      items: editedItems,
      totalAmount,
      image: receiptImage,
    };
    onSave(receiptData);
    setIsDialogOpen(false);
    setReceiptImage(null);
    setOcrResult(null);
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6">영수증 업로드</Typography>
          
          {error && (
            <Alert severity="error" sx={{ width: '100%' }}>
              {error}
            </Alert>
          )}

          <Box
            sx={{
              width: '100%',
              height: 200,
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {receiptImage ? (
              <>
                <img
                  src={receiptImage}
                  alt="Receipt"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                />
                <IconButton
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'background.paper',
                  }}
                  onClick={() => {
                    setReceiptImage(null);
                    setOcrResult(null);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </>
            ) : (
              <>
                <PhotoCameraIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                <Typography color="text.secondary" gutterBottom>
                  영수증 사진을 업로드하세요
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    '사진 선택'
                  )}
                </Button>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              hidden
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
          </Box>
        </Box>
      </CardContent>

      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>영수증 정보 확인</DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="가게 이름"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                margin="normal"
              />
              <TextField
                fullWidth
                label="구매 일시"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                margin="normal"
              />
              {detectedCategory && (
                <Box sx={{ mt: 2, mb: 2 }}>
                  <Chip
                    icon={<CategoryIcon />}
                    label={`감지된 카테고리: ${detectedCategory}`}
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              )}
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">구매 품목</Typography>
                <Button
                  startIcon={<CheckIcon />}
                  onClick={handleAddItem}
                >
                  품목 추가
                </Button>
              </Box>
              <List>
                {editedItems.map((item, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={4}>
                          <TextField
                            fullWidth
                            size="small"
                            value={item.name}
                            onChange={(e) => handleEditItem(index, 'name', e.target.value)}
                            placeholder="품목명"
                          />
                        </Grid>
                        <Grid item xs={3}>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            value={item.price}
                            onChange={(e) => handleEditItem(index, 'price', e.target.value)}
                            placeholder="가격"
                          />
                        </Grid>
                        <Grid item xs={3}>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleEditItem(index, 'quantity', e.target.value)}
                            placeholder="수량"
                          />
                        </Grid>
                        <Grid item xs={2}>
                          <Typography>
                            {new Intl.NumberFormat('ko-KR', {
                              style: 'currency',
                              currency: 'KRW',
                            }).format(item.price * item.quantity)}
                          </Typography>
                        </Grid>
                      </Grid>
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < editedItems.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Typography variant="h6">
                  총액: {new Intl.NumberFormat('ko-KR', {
                    style: 'currency',
                    currency: 'KRW',
                  }).format(totalAmount)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>취소</Button>
          <Button onClick={handleSave} variant="contained">
            저장
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default ReceiptUploader; 
import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const MessageCenter = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: Date.now(),
        text: newMessage,
        sender: 'parent', // or 'child'
        timestamp: new Date(),
      };
      setMessages([...messages, message]);
      setNewMessage('');
    }
  };

  return (
    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>
        메시지
      </Typography>
      <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
        <List>
          {messages.map((message) => (
            <ListItem
              key={message.id}
              sx={{
                flexDirection: message.sender === 'parent' ? 'row' : 'row-reverse',
              }}
            >
              <ListItemAvatar>
                <Avatar>{message.sender === 'parent' ? 'P' : 'C'}</Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={message.text}
                secondary={new Date(message.timestamp).toLocaleString()}
                sx={{
                  textAlign: message.sender === 'parent' ? 'left' : 'right',
                }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
      <Divider />
      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="메시지를 입력하세요..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <Button
          variant="contained"
          endIcon={<SendIcon />}
          onClick={handleSendMessage}
        >
          전송
        </Button>
      </Box>
    </Paper>
  );
};

export default MessageCenter; 
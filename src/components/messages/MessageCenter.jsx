import React, { useState, useEffect, useRef } from 'react';
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

const MESSAGE_KEY = 'dondoli_messages';

function getChatPartner(user) {
  if (!user) return null;
  if (user.role === 'parent') {
    // 부모: 첫 번째 자녀와 채팅(확장 시 자녀 선택 가능)
    const children = JSON.parse(localStorage.getItem('dondoli_children') || '[]');
    return children.length > 0 ? children[0] : null;
  } else {
    // 자녀: 부모와 채팅
    const users = JSON.parse(localStorage.getItem('dondoli_users') || '[]');
    return users.find(u => u.id === user.parentId && u.role === 'parent') || null;
  }
}

function getChatId(user, partner) {
  if (!user || !partner) return '';
  return [user.id, partner.id].sort().join('_');
}

const MessageCenter = () => {
  const user = JSON.parse(sessionStorage.getItem('user'));
  const partner = getChatPartner(user);
  const chatId = getChatId(user, partner);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  // 메시지 불러오기
  useEffect(() => {
    if (!chatId) return;
    const allMessages = JSON.parse(localStorage.getItem(MESSAGE_KEY) || '{}');
    setMessages(allMessages[chatId] || []);
  }, [chatId]);

  // 메시지 전송
  const handleSendMessage = () => {
    if (newMessage.trim() && chatId) {
      const message = {
        id: Date.now(),
        text: newMessage,
        sender: user.id,
        senderName: user.name,
        timestamp: new Date().toISOString(),
      };
      const allMessages = JSON.parse(localStorage.getItem(MESSAGE_KEY) || '{}');
      const chatMessages = allMessages[chatId] || [];
      const updatedMessages = [...chatMessages, message];
      allMessages[chatId] = updatedMessages;
      localStorage.setItem(MESSAGE_KEY, JSON.stringify(allMessages));
      setMessages(updatedMessages);
      setNewMessage('');
    }
  };

  // 실시간 동기화(다른 탭/부모/자녀에서 메시지 전송 시 반영)
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === MESSAGE_KEY) {
        const allMessages = JSON.parse(localStorage.getItem(MESSAGE_KEY) || '{}');
        setMessages(allMessages[chatId] || []);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [chatId]);

  // 스크롤 하단 이동
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!user || !partner) {
    return <Typography color="text.secondary">채팅 상대가 없습니다.</Typography>;
  }

  return (
    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>
        {partner.name}님과의 채팅
      </Typography>
      <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2, maxHeight: 400 }}>
        <List>
          {messages.map((message) => (
            <ListItem
              key={message.id}
              sx={{
                flexDirection: message.sender === user.id ? 'row-reverse' : 'row',
                alignItems: 'flex-end',
              }}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: message.sender === user.id ? '#FFD600' : '#40A9FF', color: '#222' }}>
                  {message.senderName ? message.senderName[0] : '?'}
                </Avatar>
              </ListItemAvatar>
              <Box sx={{
                bgcolor: message.sender === user.id ? '#FFF9C4' : '#E3F2FD',
                color: '#222',
                borderRadius: 2,
                px: 2,
                py: 1,
                maxWidth: 320,
                minWidth: 60,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                textAlign: message.sender === user.id ? 'right' : 'left',
              }}>
                <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>{message.text}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Box>
            </ListItem>
          ))}
          <div ref={messagesEndRef} />
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
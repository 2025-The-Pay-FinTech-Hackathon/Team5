import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextField,
  IconButton,
  Paper,
  Typography,
  Divider,
  InputAdornment,
} from '@mui/material';
import {
  Send as SendIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Search as SearchIcon,
  EmojiEmotions as EmojiIcon,
  Mic as MicIcon,
} from '@mui/icons-material';
import dondoliData from '../../data/dondoliData.json';

const MESSAGE_KEY = 'dondoli_messages';

function getAllUsers() {
  return JSON.parse(localStorage.getItem('users')) || dondoliData.users || [];
}

function getUserById(id) {
  return getAllUsers().find(u => String(u.id) === String(id));
}

function getFamilyUsers(user) {
  const allUsers = getAllUsers();
  const myId = String(user.id);
  if (user.role === 'parent') {
    // 부모: 내 자녀들만
    return allUsers.filter(u => String(u.parentId) === myId && u.role === 'child');
  } else if (user.role === 'child') {
    // 자녀: 내 부모와 형제자매(본인 제외)
    let myInfo = allUsers.find(u => String(u.id) === myId);
    if (!myInfo) myInfo = user; // fallback
    const parentId = myInfo?.parentId ? String(myInfo.parentId) : String(user.parentId);
    // 부모 찾기: users에 없으면 dondoliData.users에서라도 찾기
    let parent = allUsers.find(u => String(u.id) === parentId && u.role === 'parent');
    if (!parent && dondoliData && dondoliData.users) {
      parent = dondoliData.users.find(u => String(u.id) === parentId && u.role === 'parent');
    }
    const siblings = allUsers.filter(u => String(u.parentId) === parentId && String(u.id) !== myId && u.role === 'child');
    return [parent, ...siblings].filter(Boolean);
  }
  return [];
}

function getChatId(userId1, userId2) {
  return [String(userId1), String(userId2)].sort().join('_');
}

function loadMessagesFromStorage() {
  return JSON.parse(localStorage.getItem(MESSAGE_KEY) || '{}');
}

function saveMessagesToStorage(messages) {
  localStorage.setItem(MESSAGE_KEY, JSON.stringify(messages));
}

const MessageCenter = () => {
  const user = JSON.parse(sessionStorage.getItem('user'));
  const [messages, setMessages] = useState({});
  const [favorites, setFavorites] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);

  // 가족 대화상대 불러오기
  useEffect(() => {
    if (!user) return setUsers([]);
    const familyUsers = getFamilyUsers(user);
    setUsers(familyUsers);
  }, [user]);

  // 메시지 불러오기
  useEffect(() => {
    setMessages(loadMessagesFromStorage());
  }, [selectedUser]);

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedUser) {
      const chatId = getChatId(user.id, selectedUser.id);
      const allMessages = loadMessagesFromStorage();
      const msg = {
        id: Date.now(),
        text: newMessage,
        sender: user.id,
        receiver: selectedUser.id,
        timestamp: new Date().toISOString(),
      };
      const updated = {
        ...allMessages,
        [chatId]: [...(allMessages[chatId] || []), msg],
      };
      saveMessagesToStorage(updated);
      setMessages(updated);
      setNewMessage('');
    }
  };

  const toggleFavorite = (userId) => {
    setFavorites(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const filteredUsers = users
    .filter(u => u && u.name && u.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const aFav = favorites.includes(a.id);
      const bFav = favorites.includes(b.id);
      if (aFav === bFav) return 0;
      return aFav ? -1 : 1;
    });

  const chatId = selectedUser ? getChatId(user.id, selectedUser.id) : null;
  const chatMessages = chatId && messages[chatId] ? messages[chatId] : [];

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', mt: '64px', display: 'flex', bgcolor: '#f8f8f8' }}>
      {/* Sidebar */}
      <Paper sx={{ width: 300, display: 'flex', flexDirection: 'column', borderRight: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          가족 채팅
        </Typography>

        <TextField
          size="small"
          placeholder="검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ m: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        <List sx={{ flexGrow: 1, overflow: 'auto' }}>
          {filteredUsers.length === 0 ? (
            <ListItem>
              <ListItemText primary="대화 가능한 가족이 없습니다." />
            </ListItem>
          ) : (
            filteredUsers.map((u) => (
              <ListItem
                key={u.id}
                button
                selected={selectedUser?.id === u.id}
                onClick={() => setSelectedUser(u)}
              >
                <ListItemAvatar>
                  <Avatar>{u.name[0]}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={u.name}
                  secondary={(() => {
                    const cid = getChatId(user.id, u.id);
                    const msgs = messages[cid] || [];
                    return msgs.length > 0 ? msgs[msgs.length - 1].text : '최근 메시지 없음';
                  })()}
                />
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(u.id);
                  }}
                >
                  {favorites.includes(u.id) ? <StarIcon color="warning" /> : <StarBorderIcon />}
                </IconButton>
              </ListItem>
            ))
          )}
        </List>
      </Paper>

      {/* Chat Window */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedUser ? (
          <>
            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                {selectedUser.name}
              </Typography>
              <IconButton onClick={() => toggleFavorite(selectedUser.id)}>
                {favorites.includes(selectedUser.id) ? <StarIcon color="warning" /> : <StarBorderIcon />}
              </IconButton>
            </Paper>

            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, bgcolor: '#fffbe9' }}>
              {chatMessages.map((message, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: message.sender === user.id ? 'flex-end' : 'flex-start',
                    mb: 2,
                  }}
                >
                  <Paper
                    sx={{
                      p: 2,
                      maxWidth: '70%',
                      bgcolor: message.sender === user.id ? 'warning.main' : 'white',
                      color: message.sender === user.id ? 'text.primary' : 'text.primary',
                    }}
                  >
                    <Typography>{message.text}</Typography>
                  </Paper>
                </Box>
              ))}
            </Box>

            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton>
                <EmojiIcon />
              </IconButton>
              <TextField
                fullWidth
                placeholder="메시지를 입력해 주세요."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                sx={{ bgcolor: '#f8f8f8' }}
              />
              <IconButton>
                <MicIcon />
              </IconButton>
              <IconButton color="warning" onClick={handleSendMessage}>
                <SendIcon />
              </IconButton>
            </Paper>
          </>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography variant="h6" color="text.secondary">
              대화할 상대를 선택해주세요
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MessageCenter; 
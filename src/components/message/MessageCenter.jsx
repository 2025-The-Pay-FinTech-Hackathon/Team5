import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Avatar,
  Box,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import {
  EmojiEmotions as EmojiIcon,
  Mic as MicIcon,
  Search as SearchIcon,
  Send as SendIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import dondoliData from '../../data/dondoliData.json';
import { apiRequest, isNetworkError } from '../../services/api';
import {
  MESSAGE_CHANGED_EVENT,
  MESSAGE_KEY,
  getStoredMessages,
  replaceMessages,
  upsertMessage,
} from '../../services/realtime';
import { addNotification } from '../../utils/notificationUtils';
import { LOCAL_DATA_CHANGED_EVENT } from '../../utils/localData';

function parseJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function getStoredUser() {
  return parseJson(sessionStorage.getItem('user'), null);
}

function getAllUsers() {
  return parseJson(localStorage.getItem('users'), dondoliData.users || []);
}

function getFamilyUsers(user) {
  if (!user) return [];

  const allUsers = getAllUsers();
  const myId = String(user.id);

  if (user.role === 'parent') {
    return allUsers.filter((familyUser) => (
      String(familyUser.parentId) === myId && familyUser.role === 'child'
    ));
  }

  if (user.role === 'child') {
    const myInfo = allUsers.find((familyUser) => String(familyUser.id) === myId) || user;
    const parentId = myInfo?.parentId ? String(myInfo.parentId) : String(user.parentId);
    const parent =
      allUsers.find((familyUser) => String(familyUser.id) === parentId && familyUser.role === 'parent') ||
      (dondoliData.users || []).find((familyUser) => String(familyUser.id) === parentId && familyUser.role === 'parent');
    const siblings = allUsers.filter((familyUser) => (
      String(familyUser.parentId) === parentId &&
      String(familyUser.id) !== myId &&
      familyUser.role === 'child'
    ));

    return [parent, ...siblings].filter(Boolean);
  }

  return [];
}

function getChatId(userId1, userId2) {
  return [String(userId1), String(userId2)].sort().join('_');
}

const MessageCenter = () => {
  const [user, setUser] = useState(getStoredUser);
  const [messages, setMessages] = useState(getStoredMessages);
  const [favorites, setFavorites] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const messagesEndRef = useRef(null);

  const syncStoredUser = useCallback(() => {
    setUser(getStoredUser());
  }, []);

  const syncMessages = useCallback((event) => {
    setMessages(event?.detail?.messages || getStoredMessages());
  }, []);

  useEffect(() => {
    window.addEventListener('auth:user-changed', syncStoredUser);
    window.addEventListener('storage', syncStoredUser);

    return () => {
      window.removeEventListener('auth:user-changed', syncStoredUser);
      window.removeEventListener('storage', syncStoredUser);
    };
  }, [syncStoredUser]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (!event.key || event.key === MESSAGE_KEY) {
        syncMessages();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(MESSAGE_CHANGED_EVENT, syncMessages);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(MESSAGE_CHANGED_EVENT, syncMessages);
    };
  }, [syncMessages]);

  useEffect(() => {
    if (!user?.id) return undefined;

    let active = true;

    apiRequest(`/api/messages/${user.id}`)
      .then((serverMessages) => {
        if (!active) return;
        replaceMessages(serverMessages);
        setMessages(serverMessages);
      })
      .catch((error) => {
        if (!isNetworkError(error)) {
          console.error(error);
        }
      });

    return () => {
      active = false;
    };
  }, [user?.id]);

  useEffect(() => {
    const familyUsers = getFamilyUsers(user);
    setUsers(familyUsers);
    setSelectedUser((current) => {
      if (current) {
        const refreshedUser = familyUsers.find((familyUser) => String(familyUser.id) === String(current.id));
        if (refreshedUser) {
          return refreshedUser;
        }
      }

      return familyUsers[0] || null;
    });
  }, [user]);

  useEffect(() => {
    const refreshFamilyUsers = () => {
      const familyUsers = getFamilyUsers(user);
      setUsers(familyUsers);
      setSelectedUser((current) => {
        if (current) {
          const refreshedUser = familyUsers.find((familyUser) => String(familyUser.id) === String(current.id));
          if (refreshedUser) {
            return refreshedUser;
          }
        }

        return familyUsers[0] || null;
      });
    };

    window.addEventListener(LOCAL_DATA_CHANGED_EVENT, refreshFamilyUsers);
    window.addEventListener('storage', refreshFamilyUsers);

    return () => {
      window.removeEventListener(LOCAL_DATA_CHANGED_EVENT, refreshFamilyUsers);
      window.removeEventListener('storage', refreshFamilyUsers);
    };
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedUser]);

  const handleSendMessage = async () => {
    const text = newMessage.trim();

    if (!text || !user || !selectedUser) {
      return;
    }

    const activeChatId = getChatId(user.id, selectedUser.id);
    const localMessage = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      text,
      sender: user.id,
      senderName: user.name,
      receiver: selectedUser.id,
      timestamp: new Date().toISOString(),
      pending: true,
    };

    setNewMessage('');
    upsertMessage(activeChatId, localMessage);
    setMessages(getStoredMessages());

    try {
      const result = await apiRequest('/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          senderId: user.id,
          senderName: user.name,
          receiverId: selectedUser.id,
          text,
        }),
      });

      upsertMessage(result.chatId, result.message, localMessage.id);
      setMessages(getStoredMessages());
    } catch (error) {
      if (!isNetworkError(error)) {
        console.error(error);
      }

      upsertMessage(activeChatId, { ...localMessage, pending: false, failed: true }, localMessage.id);
      setMessages(getStoredMessages());
      addNotification(selectedUser.id, {
        type: 'message',
        title: '새 메시지',
        message: `${user.name || '가족'}님이 메시지를 보냈습니다.`,
        dedupeKey: `message:${localMessage.id}`,
        data: {
          chatId: activeChatId,
          senderId: user.id,
          senderName: user.name,
        },
      });
    }
  };

  const toggleFavorite = (userId) => {
    setFavorites((current) => (
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    ));
  };

  const filteredUsers = useMemo(() => (
    users
      .filter((familyUser) => (
        familyUser?.name?.toLowerCase().includes(search.toLowerCase())
      ))
      .sort((a, b) => {
        const aFav = favorites.includes(a.id);
        const bFav = favorites.includes(b.id);
        if (aFav === bFav) return 0;
        return aFav ? -1 : 1;
      })
  ), [favorites, search, users]);

  const chatId = user && selectedUser ? getChatId(user.id, selectedUser.id) : null;
  const chatMessages = chatId ? messages[chatId] || [] : [];

  if (!user) {
    return (
      <Box sx={{ pt: '96px', textAlign: 'center' }}>
        <Typography color="text.secondary">로그인이 필요합니다.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', mt: '64px', display: 'flex', bgcolor: '#f8f8f8' }}>
      <Paper sx={{ width: 300, display: 'flex', flexDirection: 'column', borderRight: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          가족 채팅
        </Typography>

        <TextField
          size="small"
          placeholder="검색"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
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
            filteredUsers.map((familyUser) => {
              const familyChatId = getChatId(user.id, familyUser.id);
              const familyMessages = messages[familyChatId] || [];
              const lastMessage = familyMessages.at(-1)?.text || '최근 메시지 없음';

              return (
                <ListItem key={familyUser.id} disablePadding secondaryAction={
                  <IconButton
                    edge="end"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleFavorite(familyUser.id);
                    }}
                  >
                    {favorites.includes(familyUser.id) ? <StarIcon color="warning" /> : <StarBorderIcon />}
                  </IconButton>
                }>
                  <ListItemButton
                    selected={selectedUser?.id === familyUser.id}
                    onClick={() => setSelectedUser(familyUser)}
                  >
                    <ListItemAvatar>
                      <Avatar>{familyUser.name?.[0] || '?'}</Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={familyUser.name} secondary={lastMessage} />
                  </ListItemButton>
                </ListItem>
              );
            })
          )}
        </List>
      </Paper>

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
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
              {chatMessages.map((message) => (
                <Box
                  key={message.id}
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
                      color: 'text.primary',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    <Typography>{message.text}</Typography>
                  </Paper>
                </Box>
              ))}
              <div ref={messagesEndRef} />
            </Box>

            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton>
                <EmojiIcon />
              </IconButton>
              <TextField
                fullWidth
                placeholder="메시지를 입력해 주세요"
                value={newMessage}
                onChange={(event) => setNewMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleSendMessage();
                  }
                }}
                sx={{ bgcolor: '#f8f8f8' }}
              />
              <IconButton>
                <MicIcon />
              </IconButton>
              <IconButton color="warning" onClick={handleSendMessage} disabled={!newMessage.trim()}>
                <SendIcon />
              </IconButton>
            </Paper>
          </>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography variant="h6" color="text.secondary">
              대화할 가족을 선택해 주세요
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MessageCenter;

const express = require('express');
const {
  addNotificationToData,
  createId,
  findUserById,
  readData,
  toId,
  updateData,
} = require('../storage');
const { publishToUsers } = require('../realtime');

const router = express.Router();

function getChatId(userId1, userId2) {
  return [toId(userId1), toId(userId2)].sort().join('_');
}

function getVisibleMessages(messages, userId) {
  const normalizedUserId = toId(userId);

  return Object.fromEntries(
    Object.entries(messages || {}).filter(([chatId]) => (
      chatId.split('_').includes(normalizedUserId)
    )),
  );
}

router.get('/thread/:userId/:partnerId', (req, res) => {
  const data = readData();
  const chatId = getChatId(req.params.userId, req.params.partnerId);
  res.json(data.messages?.[chatId] || []);
});

router.get('/:userId', (req, res) => {
  const data = readData();
  res.json(getVisibleMessages(data.messages || {}, req.params.userId));
});

router.post('/', (req, res) => {
  const senderId = toId(req.body.senderId || req.body.sender);
  const receiverId = toId(req.body.receiverId || req.body.receiver);
  const text = String(req.body.text || '').trim();

  if (!senderId || !receiverId || !text) {
    return res.status(400).json({ error: '보낸 사람, 받는 사람, 메시지를 모두 입력해 주세요.' });
  }

  const result = updateData((data) => {
    const sender = findUserById(data, senderId);
    const receiver = findUserById(data, receiverId);
    const chatId = getChatId(senderId, receiverId);
    const message = {
      id: createId(),
      text,
      sender: senderId,
      senderName: req.body.senderName || sender?.name || '',
      receiver: receiverId,
      timestamp: new Date().toISOString(),
    };

    data.messages = data.messages || {};
    data.messages[chatId] = [...(data.messages[chatId] || []), message];

    const notification = addNotificationToData(data, receiverId, {
      type: 'message',
      title: '새 메시지',
      message: `${message.senderName || '가족'}님이 메시지를 보냈습니다.`,
      dedupeKey: `message:${message.id}`,
      data: {
        chatId,
        senderId,
        senderName: message.senderName,
      },
    });

    return {
      chatId,
      message,
      notification,
      senderId,
      receiverId,
      senderName: sender?.name,
      receiverName: receiver?.name,
    };
  });

  publishToUsers([senderId, receiverId], {
    type: 'chat_message',
    chatId: result.chatId,
    message: result.message,
  });

  if (result.notification) {
    publishToUsers([receiverId], {
      type: 'notification',
      notification: result.notification,
    });
  }

  return res.status(201).json(result);
});

module.exports = router;

const express = require('express');
const {
  addNotificationToData,
  deleteNotificationFromData,
  getNotificationsForUser,
  markAllNotificationsReadInData,
  readData,
  updateData,
  updateNotificationInData,
} = require('../storage');
const { publishToUser } = require('../realtime');

const router = express.Router();

router.get('/:userId', (req, res) => {
  const data = readData();
  res.json(getNotificationsForUser(data, req.params.userId));
});

router.post('/:userId', (req, res) => {
  const notification = updateData((data) => (
    addNotificationToData(data, req.params.userId, req.body || {})
  ));

  if (notification) {
    publishToUser(req.params.userId, { type: 'notification', notification });
  }

  res.status(201).json(notification);
});

router.patch('/:userId/:notificationId', (req, res) => {
  const notification = updateData((data) => (
    updateNotificationInData(data, req.params.userId, req.params.notificationId, req.body || {})
  ));

  if (!notification) {
    return res.status(404).json({ error: '알림을 찾을 수 없습니다.' });
  }

  publishToUser(req.params.userId, { type: 'notification_updated', notification });
  return res.json(notification);
});

router.post('/:userId/read-all', (req, res) => {
  const notifications = updateData((data) => (
    markAllNotificationsReadInData(data, req.params.userId)
  ));

  publishToUser(req.params.userId, { type: 'notifications_read_all', notifications });
  res.json(notifications);
});

router.delete('/:userId/:notificationId', (req, res) => {
  const removed = updateData((data) => (
    deleteNotificationFromData(data, req.params.userId, req.params.notificationId)
  ));

  if (!removed) {
    return res.status(404).json({ error: '알림을 찾을 수 없습니다.' });
  }

  publishToUser(req.params.userId, {
    type: 'notification_deleted',
    notificationId: req.params.notificationId,
  });

  return res.json({ ok: true });
});

module.exports = router;

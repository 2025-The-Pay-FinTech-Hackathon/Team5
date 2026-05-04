const fs = require('fs');
const path = require('path');

const DB_FILE = process.env.DB_FILE || path.join(__dirname, 'data', 'db.json');

const defaultData = {
  users: [
    { id: '1', name: '부모', email: 'parent@test.com', password: '1234', role: 'parent', parentId: null },
    { id: '2', name: '자녀', email: 'child@test.com', password: '1234', role: 'child', parentId: '1' },
  ],
  children: [
    {
      id: '2',
      name: '자녀',
      email: 'child@test.com',
      password: '1234',
      parentId: '1',
      balance: 0,
      creditScore: 700,
      points: 0,
      missions: [],
      savings: [],
      ledgers: [],
      wishlist: [],
      purchases: [],
      loans: [],
      loanRequests: [],
      quizResults: [],
      memoryGameResults: [],
      badges: {},
    },
  ],
  messages: {},
  notifications: {},
};

function toId(id) {
  return String(id ?? '');
}

function createId() {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

function normalizeUser(user) {
  return {
    ...user,
    id: toId(user.id || user._id),
    parentId: user.parentId ? toId(user.parentId) : null,
  };
}

function normalizeChild(child) {
  return {
    balance: 0,
    creditScore: 700,
    points: 0,
    missions: [],
    savings: [],
    ledgers: [],
    wishlist: [],
    purchases: [],
    loans: [],
    loanRequests: [],
    quizResults: [],
    memoryGameResults: [],
    badges: {},
    ...child,
    id: toId(child.id || child._id),
    parentId: child.parentId ? toId(child.parentId) : null,
  };
}

function createChildProfile(user, parentId) {
  return normalizeChild({
    id: user.id,
    name: user.name,
    email: user.email,
    password: user.password,
    parentId,
  });
}

function ensureDbFile() {
  if (!fs.existsSync(DB_FILE)) {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2));
  }
}

function normalizeData(data) {
  return {
    users: (data.users || []).map(normalizeUser),
    children: (data.children || []).map(normalizeChild),
    messages: data.messages || {},
    notifications: data.notifications || {},
  };
}

function readData() {
  ensureDbFile();
  const raw = fs.readFileSync(DB_FILE, 'utf8');
  return normalizeData(JSON.parse(raw));
}

function writeData(data) {
  const normalized = normalizeData(data);
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(normalized, null, 2));
  return normalized;
}

function updateData(mutator) {
  const data = readData();
  const result = mutator(data);
  writeData(data);
  return result;
}

function publicUser(user) {
  if (!user) return null;
  const safeUser = normalizeUser(user);
  delete safeUser.password;
  return safeUser;
}

function findUserByEmail(data, email) {
  return data.users.find((user) => user.email?.toLowerCase() === email?.toLowerCase());
}

function findUserById(data, id) {
  return data.users.find((user) => toId(user.id) === toId(id));
}

function findChildById(data, id) {
  return data.children.find((child) => toId(child.id) === toId(id));
}

function getNotificationsForUser(data, userId) {
  return data.notifications?.[toId(userId)] || [];
}

function addNotificationToData(data, userId, notification) {
  const normalizedUserId = toId(userId);
  if (!normalizedUserId) return null;

  data.notifications = data.notifications || {};
  const notifications = data.notifications[normalizedUserId] || [];
  const existing = notification.dedupeKey
    ? notifications.find((item) => item.dedupeKey === notification.dedupeKey)
    : notifications.find((item) => notification.id && toId(item.id) === toId(notification.id));

  if (existing) {
    return existing;
  }

  const nextNotification = {
    ...notification,
    id: toId(notification.id || createId()),
    timestamp: notification.timestamp || new Date().toISOString(),
    read: Boolean(notification.read),
  };

  data.notifications[normalizedUserId] = [nextNotification, ...notifications].slice(0, 100);
  return nextNotification;
}

function updateNotificationInData(data, userId, notificationId, changes) {
  const normalizedUserId = toId(userId);
  const notifications = getNotificationsForUser(data, normalizedUserId);
  let updated = null;

  data.notifications = data.notifications || {};
  data.notifications[normalizedUserId] = notifications.map((notification) => {
    if (toId(notification.id) !== toId(notificationId)) {
      return notification;
    }

    updated = {
      ...notification,
      ...changes,
    };

    return updated;
  });

  return updated;
}

function markAllNotificationsReadInData(data, userId) {
  const normalizedUserId = toId(userId);
  const notifications = getNotificationsForUser(data, normalizedUserId);

  data.notifications = data.notifications || {};
  data.notifications[normalizedUserId] = notifications.map((notification) => ({
    ...notification,
    read: true,
  }));

  return data.notifications[normalizedUserId];
}

function deleteNotificationFromData(data, userId, notificationId) {
  const normalizedUserId = toId(userId);
  const notifications = getNotificationsForUser(data, normalizedUserId);
  const before = notifications.length;

  data.notifications = data.notifications || {};
  data.notifications[normalizedUserId] = notifications.filter(
    (notification) => toId(notification.id) !== toId(notificationId),
  );

  return data.notifications[normalizedUserId].length !== before;
}

module.exports = {
  addNotificationToData,
  createChildProfile,
  createId,
  defaultData,
  deleteNotificationFromData,
  findChildById,
  findUserByEmail,
  findUserById,
  getNotificationsForUser,
  markAllNotificationsReadInData,
  normalizeChild,
  publicUser,
  readData,
  toId,
  updateData,
  updateNotificationInData,
  writeData,
};

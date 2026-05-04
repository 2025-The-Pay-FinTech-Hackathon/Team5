import { API_BASE_URL, apiRequest } from '../services/api';

const NOTIFICATIONS_KEY = 'dondoli_notifications';

export const NOTIFICATIONS_CHANGED_EVENT = 'dondoli:notifications-changed';

function readAllNotifications() {
  try {
    return JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY)) || {};
  } catch (error) {
    console.error('알림을 불러오는 중 오류가 발생했습니다:', error);
    return {};
  }
}

function writeAllNotifications(notifications) {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(NOTIFICATIONS_CHANGED_EVENT));
  }
}

function sortNotifications(notifications) {
  return [...(notifications || [])].sort(
    (a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0),
  );
}

function mergeNotifications(current, incoming) {
  const byId = new Map();

  [...(current || []), ...(incoming || [])].forEach((notification) => {
    const dedupeKey = notification.dedupeKey ? `dedupe:${notification.dedupeKey}` : null;
    const idKey = notification.id ? `id:${notification.id}` : null;
    const existingKey = dedupeKey && byId.has(dedupeKey) ? dedupeKey : idKey;
    const key = existingKey || dedupeKey || idKey || `temp:${Math.random()}`;
    const previous = byId.get(key);

    byId.set(key, previous ? { ...previous, ...notification } : notification);
  });

  return sortNotifications([...byId.values()]).slice(0, 100);
}

function saveUserNotifications(userId, notifications) {
  if (!userId) return [];

  const allNotifications = readAllNotifications();
  allNotifications[userId] = mergeNotifications([], notifications);
  writeAllNotifications(allNotifications);
  return allNotifications[userId];
}

function persist(path, options = {}) {
  return fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  }).catch(() => null);
}

export const getNotifications = (userId) => {
  if (!userId) return [];
  return readAllNotifications()[userId] || [];
};

export const saveNotifications = (userId, notifications) => {
  try {
    return saveUserNotifications(userId, notifications);
  } catch (error) {
    console.error('알림을 저장하는 중 오류가 발생했습니다:', error);
    return [];
  }
};

export const loadNotifications = async (userId) => {
  if (!userId) return [];

  try {
    const notifications = await apiRequest(`/api/notifications/${userId}`);
    return saveUserNotifications(userId, notifications);
  } catch {
    return getNotifications(userId);
  }
};

export const mergeNotification = (userId, notification) => {
  if (!userId || !notification) return [];

  const merged = mergeNotifications(getNotifications(userId), [notification]);
  return saveUserNotifications(userId, merged);
};

export const replaceNotification = (userId, notification) => {
  if (!userId || !notification?.id) return [];

  const notifications = getNotifications(userId).map((item) => (
    item.id === notification.id ? { ...item, ...notification } : item
  ));
  return saveUserNotifications(userId, notifications);
};

export const removeNotification = (userId, notificationId) => {
  if (!userId || !notificationId) return [];

  const notifications = getNotifications(userId).filter(
    (notification) => notification.id !== notificationId,
  );
  return saveUserNotifications(userId, notifications);
};

export const addNotification = (userId, notification) => {
  try {
    if (!userId) return null;

    const newNotification = {
      id: notification.id || `${Date.now()}-${Math.random()}`,
      timestamp: notification.timestamp || new Date().toISOString(),
      read: false,
      ...notification,
    };

    mergeNotification(userId, newNotification);

    persist(`/api/notifications/${userId}`, {
      method: 'POST',
      body: JSON.stringify(newNotification),
    });

    return newNotification;
  } catch (error) {
    console.error('알림을 추가하는 중 오류가 발생했습니다:', error);
    return null;
  }
};

export const updateNotification = (userId, notificationId, updater) => {
  try {
    const notifications = getNotifications(userId);
    let updatedNotification = null;
    const updatedNotifications = notifications.map((notification) => {
      if (notification.id !== notificationId) return notification;
      updatedNotification = typeof updater === 'function' ? updater(notification) : { ...notification, ...updater };
      return updatedNotification;
    });

    saveUserNotifications(userId, updatedNotifications);

    if (updatedNotification) {
      persist(`/api/notifications/${userId}/${notificationId}`, {
        method: 'PATCH',
        body: JSON.stringify(updatedNotification),
      });
    }
  } catch (error) {
    console.error('알림을 수정하는 중 오류가 발생했습니다:', error);
  }
};

export const markNotificationAsRead = (notificationId) => {
  try {
    const allNotifications = readAllNotifications();
    let ownerId = null;

    Object.keys(allNotifications).forEach((userId) => {
      allNotifications[userId] = allNotifications[userId].map((notification) => {
        if (notification.id !== notificationId) return notification;
        ownerId = userId;
        return { ...notification, read: true };
      });
    });

    writeAllNotifications(allNotifications);

    if (ownerId) {
      persist(`/api/notifications/${ownerId}/${notificationId}`, {
        method: 'PATCH',
        body: JSON.stringify({ read: true }),
      });
    }
  } catch (error) {
    console.error('알림을 읽음으로 표시하는 중 오류가 발생했습니다:', error);
  }
};

export const markAllNotificationsAsRead = (userId) => {
  try {
    const notifications = getNotifications(userId).map((notification) => ({
      ...notification,
      read: true,
    }));
    saveUserNotifications(userId, notifications);

    persist(`/api/notifications/${userId}/read-all`, { method: 'POST' });
  } catch (error) {
    console.error('모든 알림을 읽음으로 표시하는 중 오류가 발생했습니다:', error);
  }
};

export const deleteNotification = (userId, notificationId) => {
  try {
    removeNotification(userId, notificationId);
    persist(`/api/notifications/${userId}/${notificationId}`, { method: 'DELETE' });
  } catch (error) {
    console.error('알림을 삭제하는 중 오류가 발생했습니다:', error);
  }
};

export const createNotification = (userId, type, title, message) => (
  addNotification(userId, { type, title, message })
);

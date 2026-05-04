import { API_BASE_URL, apiRequest, isNetworkError } from './api';
import { deleteChild, syncChildFromBackend } from '../utils/localData';
import {
  loadNotifications,
  mergeNotification,
  removeNotification,
  replaceNotification,
  saveNotifications,
} from '../utils/notificationUtils';

export const MESSAGE_CHANGED_EVENT = 'dondoli:messages-changed';
export const MESSAGE_KEY = 'dondoli_messages';

let activeConnection = null;
const pendingChildRefreshes = new Map();
const childRefreshTimers = new Map();
const notificationRefreshTimers = new Set();

function parseJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function parseEvent(event) {
  return parseJson(event.data, null);
}

export function getStoredMessages() {
  return parseJson(localStorage.getItem(MESSAGE_KEY), {});
}

function saveMessages(messages) {
  const nextMessages = messages || {};
  const serialized = JSON.stringify(nextMessages);

  if (localStorage.getItem(MESSAGE_KEY) === serialized) {
    return false;
  }

  localStorage.setItem(MESSAGE_KEY, serialized);
  window.dispatchEvent(new CustomEvent(MESSAGE_CHANGED_EVENT, { detail: { messages: nextMessages } }));
  return true;
}

export function mergeMessage(chatId, message) {
  if (!chatId || !message) return false;

  const messages = getStoredMessages();
  const thread = messages[chatId] || [];

  if (thread.some((item) => item.id === message.id)) {
    return false;
  }

  return saveMessages({
    ...messages,
    [chatId]: [...thread, message],
  });
}

export function upsertMessage(chatId, message, replaceId) {
  if (!chatId || !message) return false;

  const messages = getStoredMessages();
  const thread = messages[chatId] || [];
  const nextThread = [];
  let didInsert = false;

  thread.forEach((item) => {
    if ((replaceId && item.id === replaceId) || item.id === message.id) {
      if (!didInsert) {
        nextThread.push(message);
        didInsert = true;
      }

      return;
    }

    nextThread.push(item);
  });

  return saveMessages({
    ...messages,
    [chatId]: didInsert ? nextThread : [...thread, message],
  });
}

export function replaceMessages(messages) {
  return saveMessages(messages || {});
}

function closeConnection(connection) {
  connection.source.close();
  childRefreshTimers.forEach((timer) => clearTimeout(timer));
  childRefreshTimers.clear();
  notificationRefreshTimers.forEach((timer) => clearTimeout(timer));
  notificationRefreshTimers.clear();
  pendingChildRefreshes.clear();

  if (activeConnection === connection) {
    activeConnection = null;
  }
}

function releaseConnection(connection) {
  connection.subscribers -= 1;

  if (connection.subscribers <= 0) {
    closeConnection(connection);
  }
}

function childRefreshKey(payload) {
  return String(payload?.childId || '');
}

async function refreshChangedChild(payload) {
  const key = childRefreshKey(payload);
  if (!key) return;

  if (document.visibilityState === 'hidden') {
    pendingChildRefreshes.set(key, payload);
    return;
  }

  pendingChildRefreshes.delete(key);

  if (payload.action === 'deleted') {
    deleteChild(key);
    return;
  }

  try {
    const child = await apiRequest(`/api/children/${encodeURIComponent(key)}`);
    syncChildFromBackend(child);
  } catch (error) {
    if (!isNetworkError(error)) {
      console.error(error);
    }
  }
}

function scheduleChildRefresh(payload) {
  const key = childRefreshKey(payload);
  if (!key) return;

  clearTimeout(childRefreshTimers.get(key));
  childRefreshTimers.set(key, setTimeout(() => {
    childRefreshTimers.delete(key);
    refreshChangedChild(payload);
  }, 350));
}

function flushPendingChildRefreshes() {
  if (document.visibilityState === 'hidden') return;

  [...pendingChildRefreshes.values()].forEach(scheduleChildRefresh);
}

function scheduleNotificationRefresh(userId) {
  if (!userId) return;

  [150, 800, 1600].forEach((delay) => {
    const timer = setTimeout(() => {
      notificationRefreshTimers.delete(timer);
      loadNotifications(userId);
    }, delay);

    notificationRefreshTimers.add(timer);
  });
}

export function connectRealtime(userId) {
  if (!userId || typeof EventSource === 'undefined') {
    return () => {};
  }

  const normalizedUserId = String(userId);

  if (
    activeConnection?.userId === normalizedUserId &&
    activeConnection.source.readyState !== EventSource.CLOSED
  ) {
    activeConnection.subscribers += 1;
    const connection = activeConnection;
    return () => releaseConnection(connection);
  }

  if (activeConnection) {
    closeConnection(activeConnection);
  }

  const source = new EventSource(`${API_BASE_URL}/api/events/${encodeURIComponent(normalizedUserId)}`);
  const connection = {
    source,
    subscribers: 1,
    userId: normalizedUserId,
  };

  activeConnection = connection;

  source.addEventListener('notification', (event) => {
    const payload = parseEvent(event);
    mergeNotification(normalizedUserId, payload?.notification);
  });

  source.addEventListener('notification_updated', (event) => {
    const payload = parseEvent(event);
    replaceNotification(normalizedUserId, payload?.notification);
  });

  source.addEventListener('notifications_read_all', (event) => {
    const payload = parseEvent(event);
    saveNotifications(normalizedUserId, payload?.notifications || []);
  });

  source.addEventListener('notification_deleted', (event) => {
    const payload = parseEvent(event);
    removeNotification(normalizedUserId, payload?.notificationId);
  });

  source.addEventListener('child_changed', (event) => {
    const payload = parseEvent(event);
    scheduleChildRefresh(payload);
    scheduleNotificationRefresh(normalizedUserId);
  });

  source.addEventListener('child_updated', (event) => {
    const payload = parseEvent(event);
    scheduleChildRefresh({
      action: 'updated',
      childId: payload?.child?.id,
      parentId: payload?.child?.parentId,
    });
    scheduleNotificationRefresh(normalizedUserId);
  });

  source.addEventListener('child_deleted', (event) => {
    const payload = parseEvent(event);
    if (payload?.childId) {
      scheduleChildRefresh({ action: 'deleted', childId: payload.childId });
    }
    scheduleNotificationRefresh(normalizedUserId);
  });

  const handleChatMessage = (event) => {
    const payload = parseEvent(event);
    mergeMessage(payload?.chatId, payload?.message);
  };

  source.addEventListener('chat_message', handleChatMessage);
  source.addEventListener('message', handleChatMessage);

  source.addEventListener('error', () => {
    if (source.readyState === EventSource.CLOSED && activeConnection === connection) {
      activeConnection = null;
    }
  });

  document.addEventListener('visibilitychange', flushPendingChildRefreshes);

  return () => {
    document.removeEventListener('visibilitychange', flushPendingChildRefreshes);
    releaseConnection(connection);
  };
}

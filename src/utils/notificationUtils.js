export {};
// 알림 데이터를 로컬 스토리지에서 관리
const NOTIFICATIONS_KEY = 'dondoli_notifications';

// 알림 목록 가져오기
export const getNotifications = (userId) => {
  try {
    const notifications = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY)) || {};
    return notifications[userId] || [];
  } catch (error) {
    console.error('알림을 불러오는 중 오류가 발생했습니다:', error);
    return [];
  }
};

// 알림 저장하기
export const saveNotifications = (userId, notifications) => {
  try {
    const allNotifications = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY)) || {};
    allNotifications[userId] = notifications;
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(allNotifications));
  } catch (error) {
    console.error('알림을 저장하는 중 오류가 발생했습니다:', error);
  }
};

// 새 알림 추가하기
export const addNotification = (userId, notification) => {
  try {
    const notifications = getNotifications(userId);
    const newNotification = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification,
    };
    const updatedNotifications = [newNotification, ...notifications];
    saveNotifications(userId, updatedNotifications);
    return newNotification;
  } catch (error) {
    console.error('알림을 추가하는 중 오류가 발생했습니다:', error);
    return null;
  }
};

// 알림을 읽음으로 표시
export const markNotificationAsRead = (notificationId) => {
  try {
    const allNotifications = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY)) || {};
    Object.keys(allNotifications).forEach(userId => {
      const userNotifications = allNotifications[userId];
      const updatedNotifications = userNotifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      );
      allNotifications[userId] = updatedNotifications;
    });
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(allNotifications));
  } catch (error) {
    console.error('알림을 읽음으로 표시하는 중 오류가 발생했습니다:', error);
  }
};

// 모든 알림을 읽음으로 표시
export const markAllNotificationsAsRead = (userId) => {
  try {
    const notifications = getNotifications(userId);
    const updatedNotifications = notifications.map(notification => ({
      ...notification,
      read: true,
    }));
    saveNotifications(userId, updatedNotifications);
  } catch (error) {
    console.error('모든 알림을 읽음으로 표시하는 중 오류가 발생했습니다:', error);
  }
};

// 알림 삭제하기
export const deleteNotification = (userId, notificationId) => {
  try {
    const notifications = getNotifications(userId);
    const updatedNotifications = notifications.filter(
      notification => notification.id !== notificationId
    );
    saveNotifications(userId, updatedNotifications);
  } catch (error) {
    console.error('알림을 삭제하는 중 오류가 발생했습니다:', error);
  }
};

// 알림 생성 헬퍼 함수
export const createNotification = (userId, type, title, message) => {
  return addNotification(userId, {
    type,
    title,
    message,
  });
}; 
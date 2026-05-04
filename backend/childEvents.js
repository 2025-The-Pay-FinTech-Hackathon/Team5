const { toId } = require('./storage');
const { publishToUsers } = require('./realtime');

function publishChildChanged(child, notifications = [], action = 'updated') {
  if (!child) return;

  publishToUsers([child.id, child.parentId], {
    type: 'child_changed',
    action,
    childId: toId(child.id),
    parentId: child.parentId ? toId(child.parentId) : null,
  });

  notifications.forEach(({ userId, notification }) => {
    publishToUsers([userId], {
      type: 'notification',
      notification,
    });
  });
}

module.exports = {
  publishChildChanged,
};

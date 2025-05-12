// Local data utility for MwoniMoney (JSON 파일 기반)
import mwoniData from '../data/mwoniData.json';

// User management
export function getUsers() {
  return JSON.parse(localStorage.getItem('users')) || mwoniData.users || [];
}

export function saveUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}

export function addUser(user) {
  const users = getUsers();
  users.push(user);
  saveUsers(users);
}

export function updateUser(updatedUser) {
  const users = getUsers();
  const index = users.findIndex(u => u.id === updatedUser.id);
  if (index !== -1) {
    users[index] = updatedUser;
    saveUsers(users);
  }
}

export function deleteUser(userId) {
  const users = getUsers().filter(u => u.id !== userId);
  saveUsers(users);
}

export function findUserByEmail(email) {
  return getUsers().find(u => u.email === email);
}

export function findUserById(id) {
  return getUsers().find(u => u.id === id);
}

// Child management
export function getChildren() {
  return JSON.parse(localStorage.getItem('children')) || mwoniData.children || [];
}

export function saveChildren(children) {
  localStorage.setItem('children', JSON.stringify(children));
}

export function addChild(child) {
  const children = getChildren();
  children.push(child);
  saveChildren(children);
}

export function updateChild(updatedChild) {
  const children = getChildren();
  const index = children.findIndex(c => c.id === updatedChild.id);
  if (index !== -1) {
    children[index] = updatedChild;
    saveChildren(children);
  }
}

export function deleteChild(childId) {
  const children = getChildren().filter(c => c.id !== childId);
  saveChildren(children);
}

export function findChildById(id) {
  return getChildren().find(c => c.id === id);
}

export function getChildrenByParent(parentId) {
  return getChildren().filter(c => c.parentId === parentId);
}

// Data management (for backup/restore, not used in main flow)
export function getMwoniData() {
  return {
    users: getUsers(),
    children: getChildren(),
  };
}

export function setMwoniData(data) {
  if (data.users) saveUsers(data.users);
  if (data.children) saveChildren(data.children);
}

// 이하 CRUD 함수는 실제 파일에 반영되지 않으므로, 테스트/프론트엔드 개발용으로만 사용 
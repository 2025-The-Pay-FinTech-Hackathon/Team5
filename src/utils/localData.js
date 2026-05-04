import dondoliData from '../data/dondoliData.json';

const USERS_KEY = 'users';
const CHILDREN_KEY = 'children';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const LOCAL_DATA_CHANGED_EVENT = 'dondoli:local-data-changed';

export const toId = (id) => String(id ?? '');

export function createId() {
  return String(Date.now());
}

function readStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (error) {
    console.warn(`Failed to read ${key} from localStorage`, error);
    return fallback;
  }
}

function writeStorage(key, value) {
  const serialized = JSON.stringify(value);

  if (localStorage.getItem(key) === serialized) {
    return false;
  }

  localStorage.setItem(key, serialized);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(LOCAL_DATA_CHANGED_EVENT, { detail: { key } }));
  }

  return true;
}

function normalizeUser(user) {
  return {
    ...user,
    id: toId(user.id),
    parentId: user.parentId ? toId(user.parentId) : null,
  };
}

function syncCurrentSessionUser(nextUser) {
  try {
    const currentUser = JSON.parse(sessionStorage.getItem('user') || 'null');

    if (!currentUser || toId(currentUser.id) !== toId(nextUser.id)) {
      return;
    }

    const nextSessionUser = {
      ...currentUser,
      ...nextUser,
    };
    delete nextSessionUser.password;

    const serialized = JSON.stringify(nextSessionUser);

    if (sessionStorage.getItem('user') !== serialized) {
      sessionStorage.setItem('user', serialized);
      window.dispatchEvent(new Event('auth:user-changed'));
    }
  } catch (error) {
    console.warn('Failed to sync session user', error);
  }
}

function syncUserFromChildProfile(child) {
  const childId = toId(child?.id);

  if (!childId) return;

  const users = getUsers();
  const index = users.findIndex((user) => toId(user.id) === childId);
  const existingUser = index !== -1 ? users[index] : null;

  if (!existingUser && !child.name && !child.email) {
    return;
  }

  const nextUser = normalizeUser({
    ...(existingUser || { id: childId, role: 'child' }),
    id: childId,
    role: existingUser?.role || 'child',
    parentId: child.parentId ?? existingUser?.parentId ?? null,
    name: child.name ?? existingUser?.name ?? '',
    email: child.email ?? existingUser?.email ?? '',
    phone: child.phone ?? existingUser?.phone ?? '',
    profileImage: child.profileImage ?? existingUser?.profileImage ?? '',
  });

  if (child.password) {
    nextUser.password = child.password;
  }

  const hasChanged = !existingUser || JSON.stringify(existingUser) !== JSON.stringify(nextUser);

  if (hasChanged) {
    if (index !== -1) {
      users[index] = nextUser;
    } else {
      users.push(nextUser);
    }

    saveUsers(users);
  }

  syncCurrentSessionUser(nextUser);
}

function withChildDefaults(child) {
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
    id: toId(child.id),
    parentId: child.parentId ? toId(child.parentId) : null,
  };
}

function syncChildToBackend(child) {
  fetch(`${API_BASE_URL}/api/children/${child.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(child),
  }).catch(() => {
    // Local storage remains the offline fallback when the backend is unavailable.
  });
}

export function createChildProfile(user, parentId) {
  return withChildDefaults({
    id: user.id,
    name: user.name,
    email: user.email,
    password: user.password,
    parentId,
  });
}

export function getUsers() {
  return readStorage(USERS_KEY, dondoliData.users || []).map(normalizeUser);
}

export function saveUsers(users) {
  return writeStorage(USERS_KEY, users.map(normalizeUser));
}

export function addUser(user) {
  const users = getUsers();
  const normalizedUser = normalizeUser(user);
  users.push(normalizedUser);
  saveUsers(users);
  return normalizedUser;
}

export function updateUser(updatedUser) {
  const normalizedUser = normalizeUser(updatedUser);
  const users = getUsers();
  const index = users.findIndex((user) => toId(user.id) === toId(normalizedUser.id));

  if (index !== -1) {
    users[index] = { ...users[index], ...normalizedUser };
  } else {
    users.push(normalizedUser);
  }

  saveUsers(users);

  const currentUser = JSON.parse(sessionStorage.getItem('user') || 'null');
  if (currentUser && toId(currentUser.id) === toId(normalizedUser.id)) {
    sessionStorage.setItem('user', JSON.stringify({ ...currentUser, ...normalizedUser }));
  }

  if (normalizedUser.role === 'child') {
    const existingChild = findChildById(normalizedUser.id);
    if (existingChild) {
      updateChild({
        ...existingChild,
        name: normalizedUser.name,
        email: normalizedUser.email,
        phone: normalizedUser.phone,
        profileImage: normalizedUser.profileImage,
      });
    }
  }

  return users.find((user) => toId(user.id) === toId(normalizedUser.id)) || normalizedUser;
}

export function deleteUser(userId) {
  saveUsers(getUsers().filter((user) => toId(user.id) !== toId(userId)));
}

export function findUserByEmail(email) {
  return getUsers().find((user) => user.email?.toLowerCase() === email?.toLowerCase());
}

export function findUserById(id) {
  return getUsers().find((user) => toId(user.id) === toId(id));
}

export function getChildren() {
  return readStorage(CHILDREN_KEY, dondoliData.children || []).map(withChildDefaults);
}

export function saveChildren(children) {
  return writeStorage(CHILDREN_KEY, children.map(withChildDefaults));
}

export function addChild(child) {
  const children = getChildren();
  const normalizedChild = withChildDefaults(child);
  children.push(normalizedChild);
  saveChildren(children);
  syncUserFromChildProfile(normalizedChild);
  syncChildToBackend(normalizedChild);
  return normalizedChild;
}

export function updateChild(updatedChild, options = {}) {
  const children = getChildren();
  const childId = toId(updatedChild.id);
  const index = children.findIndex((child) => toId(child.id) === childId);
  const nextChild = withChildDefaults(
    index !== -1
      ? { ...children[index], ...updatedChild, id: childId }
      : { ...updatedChild, id: childId },
  );
  const hasChanged = index === -1 || JSON.stringify(children[index]) !== JSON.stringify(nextChild);

  if (index !== -1) {
    children[index] = nextChild;
  } else {
    children.push(nextChild);
  }

  if (hasChanged) {
    saveChildren(children);
    syncUserFromChildProfile(nextChild);

    if (options.syncBackend !== false) {
      syncChildToBackend(nextChild);
    }
  } else {
    syncUserFromChildProfile(nextChild);
  }

  return nextChild;
}

export function syncChildFromBackend(child) {
  if (!child) return null;
  return updateChild(child, { syncBackend: false });
}

export function syncChildrenFromBackend(incomingChildren) {
  if (!Array.isArray(incomingChildren)) return [];

  const childrenById = new Map(getChildren().map((child) => [toId(child.id), child]));
  const syncedChildren = incomingChildren.map(withChildDefaults);

  syncedChildren.forEach((child) => {
    const existing = childrenById.get(toId(child.id));
    childrenById.set(toId(child.id), existing ? { ...existing, ...child } : child);
  });

  const nextChildren = [...childrenById.values()];
  saveChildren(nextChildren);
  syncedChildren.forEach(syncUserFromChildProfile);
  return syncedChildren;
}

export function deleteChild(childId) {
  saveChildren(getChildren().filter((child) => toId(child.id) !== toId(childId)));
}

export function findChildById(id) {
  return getChildren().find((child) => toId(child.id) === toId(id));
}

export function getChildrenByParent(parentId) {
  return getChildren().filter((child) => toId(child.parentId) === toId(parentId));
}

export function linkChildToParent(childId, parentId) {
  const parent = findUserById(parentId);
  if (!parent || parent.role !== 'parent') {
    throw new Error('부모 계정을 찾을 수 없습니다.');
  }

  const users = getUsers();
  const userIndex = users.findIndex((user) => toId(user.id) === toId(childId));
  const childUser = users[userIndex];

  if (!childUser || childUser.role !== 'child') {
    throw new Error('자녀 계정을 찾을 수 없습니다.');
  }

  if (childUser.parentId && toId(childUser.parentId) !== toId(parentId)) {
    throw new Error('이미 다른 부모 계정과 연결된 자녀입니다.');
  }

  users[userIndex] = { ...childUser, parentId: toId(parentId) };
  saveUsers(users);

  const existingChild = findChildById(childUser.id);
  const child = updateChild({
    ...(existingChild || createChildProfile(users[userIndex], toId(parentId))),
    parentId: toId(parentId),
    name: users[userIndex].name,
    email: users[userIndex].email,
    password: users[userIndex].password,
  });

  return { user: users[userIndex], child };
}

export function getDondoliData() {
  return {
    users: getUsers(),
    children: getChildren(),
  };
}

export function setDondoliData(data) {
  if (data.users) saveUsers(data.users);
  if (data.children) saveChildren(data.children);
}

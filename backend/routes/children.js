const express = require('express');
const {
  createChildProfile,
  createId,
  findChildById,
  findUserByEmail,
  findUserById,
  normalizeChild,
  publicUser,
  readData,
  toId,
  updateData,
  addNotificationToData,
} = require('../storage');
const { collectChildUpdateNotifications } = require('../domainNotifications');
const { publishChildChanged } = require('../childEvents');

const router = express.Router();

function requireParent(data, parentId) {
  const parent = findUserById(data, parentId);
  if (!parent || parent.role !== 'parent') {
    const error = new Error('부모 계정을 찾을 수 없습니다.');
    error.status = 404;
    throw error;
  }
  return parent;
}

router.get('/parent/:parentId', (req, res) => {
  const data = readData();
  const children = data.children.filter((child) => toId(child.parentId) === toId(req.params.parentId));
  res.json(children);
});

router.get('/parent/:parentId/transactions', (req, res) => {
  const data = readData();
  const children = data.children.filter((child) => toId(child.parentId) === toId(req.params.parentId));
  const transactions = children
    .flatMap((child) => (child.ledgers || []).map((ledger) => ({
      id: ledger.id || `${child.id}-${Math.random()}`,
      childId: child.id,
      childName: child.name,
      type: ledger.type,
      amount: ledger.amount,
      date: ledger.date,
      memo: ledger.memo,
    })))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  res.json(transactions);
});

router.post('/', (req, res) => {
  const { name, email, password, parentId } = req.body;

  if (!name || !email || !password || !parentId) {
    return res.status(400).json({ error: '이름, 이메일, 비밀번호, 부모 ID를 모두 입력해 주세요.' });
  }

  try {
    const result = updateData((data) => {
      const parent = requireParent(data, parentId);

      const existingUser = findUserByEmail(data, email);

      if (existingUser) {
        if (existingUser.role !== 'child') {
          const error = new Error('이미 부모 계정으로 사용 중인 이메일입니다.');
          error.status = 409;
          throw error;
        }

        if (existingUser.parentId && toId(existingUser.parentId) !== toId(parentId)) {
          const error = new Error('이미 다른 부모 계정과 연결된 자녀입니다.');
          error.status = 409;
          throw error;
        }

        existingUser.parentId = toId(parentId);
        let child = findChildById(data, existingUser.id);

        if (!child) {
          child = createChildProfile(existingUser, parentId);
          data.children.push(child);
        } else {
          Object.assign(child, normalizeChild({
            ...child,
            name: existingUser.name,
            email: existingUser.email,
            password: existingUser.password,
            parentId,
          }));
        }

        const notification = addNotificationToData(data, existingUser.id, {
          type: 'account',
          title: '부모 계정과 연결되었어요',
          message: `${parent.name || '부모'}님과 계정이 연결되었습니다.`,
          dedupeKey: `child-linked:${existingUser.id}:${parentId}`,
        });

        return {
          user: publicUser(existingUser),
          child,
          notifications: notification ? [{ userId: existingUser.id, notification }] : [],
        };
      }

      const user = {
        id: createId(),
        name,
        email,
        password,
        role: 'child',
        parentId: toId(parentId),
      };
      const child = createChildProfile(user, parentId);

      data.users.push(user);
      data.children.push(child);

      return { user: publicUser(user), child, notifications: [] };
    });

    res.status(201).json({ message: '자녀 계정이 연결되었습니다.', ...result });
    publishChildChanged(result.child, result.notifications);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || '자녀 추가 중 오류가 발생했습니다.' });
  }
});

router.get('/:childId', (req, res) => {
  const data = readData();
  const child = findChildById(data, req.params.childId);

  if (!child) {
    return res.status(404).json({ error: '자녀 정보를 찾을 수 없습니다.' });
  }

  res.json(child);
});

router.put('/:childId', (req, res) => {
  try {
    const result = updateData((data) => {
      const index = data.children.findIndex((item) => toId(item.id) === toId(req.params.childId));

      if (index === -1) {
        const error = new Error('자녀 정보를 찾을 수 없습니다.');
        error.status = 404;
        throw error;
      }

      const previousChild = JSON.parse(JSON.stringify(data.children[index]));
      data.children[index] = normalizeChild({ ...data.children[index], ...req.body, id: req.params.childId });

      const duplicatedEmailUser = findUserByEmail(data, data.children[index].email);
      if (duplicatedEmailUser && toId(duplicatedEmailUser.id) !== toId(req.params.childId)) {
        const error = new Error('이미 사용 중인 이메일입니다.');
        error.status = 409;
        throw error;
      }

      const user = findUserById(data, req.params.childId);
      if (user) {
        user.name = data.children[index].name;
        user.email = data.children[index].email;
        user.phone = data.children[index].phone || user.phone || '';
        user.profileImage = data.children[index].profileImage || user.profileImage || '';
        if (data.children[index].password) {
          user.password = data.children[index].password;
        }
      }

      return {
        child: data.children[index],
        notifications: collectChildUpdateNotifications(data, previousChild, data.children[index]),
      };
    });

    publishChildChanged(result.child, result.notifications);
    res.json(result.child);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || '자녀 정보 수정 중 오류가 발생했습니다.' });
  }
});

router.delete('/:childId', (req, res) => {
  const removedChild = updateData((data) => {
    const child = findChildById(data, req.params.childId);
    data.children = data.children.filter((item) => toId(item.id) !== toId(req.params.childId));
    data.users = data.users.filter((user) => toId(user.id) !== toId(req.params.childId));
    return child;
  });

  publishChildChanged(removedChild, [], 'deleted');

  res.json({ message: '자녀 계정이 삭제되었습니다.' });
});

router.post('/:childId/allowance', (req, res) => {
  const amount = Number(req.body.amount);

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: '올바른 금액을 입력해 주세요.' });
  }

  try {
    const result = updateData((data) => {
      const target = findChildById(data, req.params.childId);

      if (!target) {
        const error = new Error('자녀 정보를 찾을 수 없습니다.');
        error.status = 404;
        throw error;
      }

      target.balance = (target.balance || 0) + amount;
      target.ledgers = [
        {
          id: createId(),
          type: '입금',
          amount,
          date: new Date().toISOString().slice(0, 10),
          memo: '부모 입금',
        },
        ...(target.ledgers || []),
      ];

      const notification = addNotificationToData(data, target.id, {
        type: 'allowance',
        title: '용돈이 도착했어요',
        message: `${amount.toLocaleString()}원이 입금되었습니다.`,
        dedupeKey: `allowance:${target.id}:${target.ledgers[0].id}`,
        data: {
          childId: target.id,
          amount,
          ledgerId: target.ledgers[0].id,
        },
      });

      return {
        child: target,
        notifications: notification ? [{ userId: target.id, notification }] : [],
      };
    });

    publishChildChanged(result.child, result.notifications);
    res.json({ message: '용돈이 지급되었습니다.', child: result.child });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || '용돈 지급 중 오류가 발생했습니다.' });
  }
});

router.put('/:childId/points', (req, res) => {
  const amount = Number(req.body.amount);

  if (!Number.isFinite(amount)) {
    return res.status(400).json({ error: '포인트 증감 값을 입력해 주세요.' });
  }

  const child = updateData((data) => {
    const target = findChildById(data, req.params.childId);
    if (!target) return null;
    target.points = (target.points || 0) + amount;
    return target;
  });

  if (!child) {
    return res.status(404).json({ error: '자녀 정보를 찾을 수 없습니다.' });
  }

  publishChildChanged(child);
  res.json({ points: child.points, child });
});

module.exports = router;

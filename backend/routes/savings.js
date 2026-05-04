const express = require('express');
const { createId, findChildById, updateData, toId } = require('../storage');
const { publishChildChanged } = require('../childEvents');
const { collectChildUpdateNotifications } = require('../domainNotifications');

const router = express.Router();

router.post('/:childId', (req, res) => {
  const { title, targetAmount, deadline } = req.body;

  if (!title || !targetAmount || !deadline) {
    return res.status(400).json({ error: '목표명, 목표 금액, 마감일을 입력해 주세요.' });
  }

  const result = updateData((data) => {
    const child = findChildById(data, req.params.childId);
    if (!child) return null;
    const previousChild = JSON.parse(JSON.stringify(child));

    const newGoal = {
      id: createId(),
      title,
      targetAmount: Number(targetAmount),
      currentAmount: 0,
      deadline,
      createdAt: new Date().toISOString(),
    };

    child.savings = [...(child.savings || []), newGoal];
    return {
      child,
      goal: newGoal,
      notifications: collectChildUpdateNotifications(data, previousChild, child),
    };
  });

  if (!result?.goal) {
    return res.status(404).json({ error: '자녀 정보를 찾을 수 없습니다.' });
  }

  publishChildChanged(result.child, result.notifications);
  res.status(201).json(result.goal);
});

router.patch('/:childId/:goalId', (req, res) => {
  const result = updateData((data) => {
    const child = findChildById(data, req.params.childId);
    if (!child) return null;
    const previousChild = JSON.parse(JSON.stringify(child));

    child.savings = (child.savings || []).map((item) => (
      toId(item.id) === toId(req.params.goalId) ? { ...item, ...req.body, id: item.id } : item
    ));

    const goal = child.savings.find((item) => toId(item.id) === toId(req.params.goalId));
    return {
      child,
      goal,
      notifications: collectChildUpdateNotifications(data, previousChild, child),
    };
  });

  if (!result?.goal) {
    return res.status(404).json({ error: '저축 목표를 찾을 수 없습니다.' });
  }

  publishChildChanged(result.child, result.notifications);
  res.json(result.goal);
});

router.post('/:childId/:goalId/transaction', (req, res) => {
  const amount = Number(req.body.amount);
  const type = req.body.type === 'withdraw' ? 'withdraw' : 'deposit';

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: '올바른 금액을 입력해 주세요.' });
  }

  try {
    const result = updateData((data) => {
      const child = findChildById(data, req.params.childId);
      if (!child) {
        const error = new Error('자녀 정보를 찾을 수 없습니다.');
        error.status = 404;
        throw error;
      }
      const previousChild = JSON.parse(JSON.stringify(child));

      const goal = (child.savings || []).find((item) => toId(item.id) === toId(req.params.goalId));
      if (!goal) {
        const error = new Error('저축 목표를 찾을 수 없습니다.');
        error.status = 404;
        throw error;
      }

      if (type === 'deposit' && (child.balance || 0) < amount) {
        const error = new Error('잔액이 부족합니다.');
        error.status = 400;
        throw error;
      }

      goal.currentAmount = Math.max(
        0,
        Math.min(goal.targetAmount, (goal.currentAmount || 0) + (type === 'deposit' ? amount : -amount)),
      );
      goal.lastUpdated = new Date().toISOString().slice(0, 10);
      child.balance = (child.balance || 0) + (type === 'deposit' ? -amount : amount);

      return {
        child,
        goal,
        notifications: collectChildUpdateNotifications(data, previousChild, child),
      };
    });

    publishChildChanged(result.child, result.notifications);
    res.json({ child: result.child, goal: result.goal });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || '저축 거래 중 오류가 발생했습니다.' });
  }
});

module.exports = router;

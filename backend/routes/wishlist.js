const express = require('express');
const { createId, findChildById, readData, toId, updateData } = require('../storage');
const { publishChildChanged } = require('../childEvents');
const { collectChildUpdateNotifications } = require('../domainNotifications');

const router = express.Router();

router.get('/:childId', (req, res) => {
  const data = readData();
  const child = findChildById(data, req.params.childId);

  if (!child) {
    return res.status(404).json({ error: '자녀 정보를 찾을 수 없습니다.' });
  }

  res.json(child.wishlist || []);
});

router.post('/:childId', (req, res) => {
  const { name, targetAmount, memo } = req.body;

  if (!name || !targetAmount) {
    return res.status(400).json({ error: '이름과 목표 금액을 입력해 주세요.' });
  }

  const result = updateData((data) => {
    const child = findChildById(data, req.params.childId);
    if (!child) return null;
    const previousChild = JSON.parse(JSON.stringify(child));

    const wishlistItem = {
      id: createId(),
      name,
      targetAmount: Number(targetAmount),
      memo: memo || '',
      createdAt: new Date().toISOString(),
    };

    child.wishlist = [...(child.wishlist || []), wishlistItem];
    return {
      child,
      item: wishlistItem,
      notifications: collectChildUpdateNotifications(data, previousChild, child),
    };
  });

  if (!result?.item) {
    return res.status(404).json({ error: '자녀 정보를 찾을 수 없습니다.' });
  }

  publishChildChanged(result.child, result.notifications);
  res.status(201).json(result.item);
});

router.put('/:childId/:itemId', (req, res) => {
  const result = updateData((data) => {
    const child = findChildById(data, req.params.childId);
    if (!child) return null;
    const previousChild = JSON.parse(JSON.stringify(child));

    child.wishlist = (child.wishlist || []).map((wishlistItem) => (
      toId(wishlistItem.id) === toId(req.params.itemId)
        ? { ...wishlistItem, ...req.body, id: wishlistItem.id }
        : wishlistItem
    ));

    const item = child.wishlist.find((wishlistItem) => toId(wishlistItem.id) === toId(req.params.itemId));
    return {
      child,
      item,
      notifications: collectChildUpdateNotifications(data, previousChild, child),
    };
  });

  if (!result?.item) {
    return res.status(404).json({ error: '위시리스트 항목을 찾을 수 없습니다.' });
  }

  publishChildChanged(result.child, result.notifications);
  res.json(result.item);
});

router.delete('/:childId/:itemId', (req, res) => {
  const result = updateData((data) => {
    const child = findChildById(data, req.params.childId);
    if (!child) return { removed: false };
    const previousChild = JSON.parse(JSON.stringify(child));

    const before = (child.wishlist || []).length;
    child.wishlist = (child.wishlist || []).filter((item) => toId(item.id) !== toId(req.params.itemId));
    const removed = before !== child.wishlist.length;
    return {
      child,
      removed,
      notifications: removed ? collectChildUpdateNotifications(data, previousChild, child) : [],
    };
  });

  if (result?.removed) {
    publishChildChanged(result.child, result.notifications);
  }

  if (!result?.removed) {
    return res.status(404).json({ error: '위시리스트 항목을 찾을 수 없습니다.' });
  }

  res.json({ message: '위시리스트 항목이 삭제되었습니다.' });
});

module.exports = router;

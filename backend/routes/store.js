const express = require('express');
const { addNotificationToData, createId, findChildById, updateData } = require('../storage');
const { publishChildChanged } = require('../childEvents');

const router = express.Router();

const storeItems = [
  { id: 'game-30', name: '게임 시간 30분', points: 500, category: '엔터테인먼트' },
  { id: 'allowance-5000', name: '용돈 5,000원', points: 1000, category: '용돈' },
  { id: 'movie', name: '영화 보기', points: 800, category: '엔터테인먼트' },
  { id: 'allowance-10000', name: '용돈 10,000원', points: 2000, category: '용돈' },
];

router.get('/items', (req, res) => {
  res.json(storeItems);
});

router.post('/purchase', (req, res) => {
  const { childId, item } = req.body;

  if (!childId || !item?.points) {
    return res.status(400).json({ error: '자녀 ID와 상품 정보를 입력해 주세요.' });
  }

  try {
    const result = updateData((data) => {
      const child = findChildById(data, childId);

      if (!child) {
        const error = new Error('자녀 정보를 찾을 수 없습니다.');
        error.status = 404;
        throw error;
      }

      if ((child.points || 0) < Number(item.points)) {
        const error = new Error('포인트가 부족합니다.');
        error.status = 400;
        throw error;
      }

      const purchase = {
        ...item,
        id: item.id,
        purchaseId: createId(),
        purchasedAt: new Date().toISOString().slice(0, 10),
        status: item.status || '승인대기',
      };

      child.points -= Number(item.points);
      child.purchases = [...(child.purchases || []), purchase];

      const notification = child.parentId
        ? addNotificationToData(data, child.parentId, {
          type: 'store_approval',
          title: '보상 구매 승인 요청',
          message: `${child.name || '자녀'}님이 ${purchase.name || '보상'} 구매를 요청했습니다.`,
          action: { type: 'approveStorePurchase' },
          actionStatus: 'pending',
          dedupeKey: `store-approval:${child.id}:${purchase.purchaseId}`,
          data: {
            childId: child.id,
            childName: child.name,
            purchaseId: purchase.purchaseId,
            itemName: purchase.name,
            points: purchase.points,
            cashAmount: purchase.cashAmount || 0,
          },
        })
        : null;

      return {
        child,
        purchase,
        notifications: notification ? [{ userId: child.parentId, notification }] : [],
      };
    });

    publishChildChanged(result.child, result.notifications);
    res.status(201).json({ child: result.child, purchase: result.purchase });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || '상품 구매 중 오류가 발생했습니다.' });
  }
});

module.exports = router;

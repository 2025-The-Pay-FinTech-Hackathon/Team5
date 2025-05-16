const express = require('express');
const router = express.Router();
const Child = require('../models/Child');
const User = require('../models/User');

// [GET] 특정 부모의 자녀 목록 조회
router.get('/parent/:parentId', async (req, res) => {
  try {
    const children = await Child.find({ parentId: req.params.parentId });
    res.json(children);
  } catch (error) {
    console.error('자녀 목록 조회 실패:', error);
    res.status(500).json({ error: '서버 오류' });
  }
});


// POST /api/children - 자녀 추가
router.post('/', async (req, res) => {
    const { name, email, password, parentId } = req.body;

  if (!name || !email || !password || !parentId) {
    return res.status(400).json({ error: '모든 항목을 입력해주세요.' });
  }

  try {
    const existing = await Child.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: '이미 존재하는 이메일입니다.' });
    }

    const newChild = new Child({
      name,
      email,
      password,
      parentId,
      balance: 0,
      creditScore: 700,
      points: 0,
      missions: [],
      savings: [],
      transactions: [],
      ledgers: [],
      loans: [],
      loanRequests: [],
    });

    await newChild.save();
    res.status(201).json(newChild);
  } catch (err) {
    console.error('자녀 추가 실패:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// POST /api/children/:childId/allowance
router.post('/:childId/allowance', async (req, res) => {
  const { childId } = req.params;
  const { amount } = req.body;

  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: '유효한 금액을 입력해주세요.' });
  }

  try {
    const child = await Child.findById(childId);
    if (!child) {
      return res.status(404).json({ error: '자녀를 찾을 수 없습니다.' });
    }

    // 잔액 증가
    child.balance = (child.balance || 0) + Number(amount);

    // ledger 추가
    const ledgerEntry = {
      type: '입금',
      amount: Number(amount),
      date: new Date().toISOString().slice(0, 10),
      memo: '부모 입금',
    };
    child.ledgers = [ledgerEntry, ...(child.ledgers || [])];

    await child.save();

    res.json({ message: '용돈이 성공적으로 지급되었습니다.', child });
  } catch (err) {
    console.error('용돈 지급 실패:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// routes/children.js
router.get('/:childId', async (req, res) => {
  try {
    const child = await Child.findById(req.params.childId);
    if (!child) return res.status(404).json({ error: '자녀를 찾을 수 없습니다.' });
    res.json(child);
  } catch (err) {
    console.error('자녀 정보 조회 실패:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// DELETE /api/children/:childId - 자녀 삭제
// DELETE /api/children/:childId - 자녀 삭제
router.delete('/:childId', async (req, res) => {
  const { childId } = req.params;

  try {
    await Child.findByIdAndDelete(childId);
    await User.findByIdAndDelete(childId); // child 계정도 users에서 삭제
    res.json({ message: '자녀가 삭제되었습니다.' });
  } catch (err) {
    console.error('자녀 삭제 실패:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// GET /api/children/:parentId/transactions
router.get('/:parentId/transactions', async (req, res) => {
  const { parentId } = req.params;

  try {
    const children = await Child.find({ parentId });

    const allTransactions = children.flatMap(child =>
      (child.ledgers || []).map(ledger => ({
        id: ledger.id || `${child._id}-${Math.random()}`,
        childId: child._id,
        childName: child.name,
        type: ledger.type,
        amount: ledger.amount,
        date: ledger.date,
        memo: ledger.memo,
      }))
    ).sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(allTransactions);
  } catch (err) {
    console.error('거래 내역 조회 실패:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});


module.exports = router;

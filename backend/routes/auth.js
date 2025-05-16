const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 회원가입입
// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  // 필수 값 확인
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: '모든 항목을 입력해주세요.' });
  }

  try {
    // 중복 이메일 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: '이미 존재하는 이메일입니다.' });
    }

    // 새 유저 생성 후 저장
    const newUser = new User({ name, email, password, role });
    await newUser.save();

    res.status(201).json({ message: '회원가입 성공' });
  } catch (error) {
    console.error('회원가입 오류:', error);
    res.status(500).json({ error: '서버 오류' });
  }
});


// 로그인
// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: '모든 항목을 입력해주세요.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: '존재하지 않는 이메일입니다.' });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: '비밀번호가 일치하지 않습니다.' });
    }

    if (user.role !== role) {
      return res.status(403).json({ error: `${role === 'parent' ? '부모' : '자녀'} 계정이 아닙니다.` });
    }

    // 자녀 계정일 경우 parentId 유효성 확인 (옵션)
    if (role === 'child' && !user.parentId) {
      return res.status(400).json({ error: '이 자녀 계정은 부모와 연동되어 있지 않습니다.' });
    }

    res.json({
  id: user._id,               // ✅ 꼭 있어야 프론트에서 parentId로 사용 가능
  name: user.name,
  email: user.email,
  role: user.role,
  parentId: user.parentId || null, // 자녀 계정인 경우
});

  } catch (err) {
    console.error('로그인 실패:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = router;

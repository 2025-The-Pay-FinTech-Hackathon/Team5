const express = require('express');
const {
  createChildProfile,
  createId,
  findChildById,
  findUserByEmail,
  findUserById,
  publicUser,
  toId,
  updateData,
} = require('../storage');

const router = express.Router();

router.post('/register', (req, res) => {
  const { name, email, password, role, parentEmail, parentId } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: '이름, 이메일, 비밀번호, 계정 유형을 모두 입력해 주세요.' });
  }

  if (!['parent', 'child'].includes(role)) {
    return res.status(400).json({ error: '계정 유형은 parent 또는 child만 가능합니다.' });
  }

  try {
    const result = updateData((data) => {
      if (findUserByEmail(data, email)) {
        const error = new Error('이미 존재하는 이메일입니다.');
        error.status = 409;
        throw error;
      }

      let resolvedParentId = null;

      if (role === 'child') {
        const parent = parentId
          ? findUserById(data, parentId)
          : findUserByEmail(data, parentEmail);

        if (!parent || parent.role !== 'parent') {
          const error = new Error('연결할 부모 계정을 찾을 수 없습니다.');
          error.status = 400;
          throw error;
        }

        resolvedParentId = toId(parent.id);
      }

      const user = {
        id: createId(),
        name,
        email,
        password,
        role,
        parentId: resolvedParentId,
      };

      data.users.push(user);

      let child = null;
      if (role === 'child') {
        child = createChildProfile(user, resolvedParentId);
        data.children.push(child);
      }

      return { user: publicUser(user), child };
    });

    res.status(201).json({ message: '회원가입이 완료되었습니다.', ...result });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || '회원가입 중 오류가 발생했습니다.' });
  }
});

router.post('/login', (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: '이메일, 비밀번호, 계정 유형을 모두 입력해 주세요.' });
  }

  try {
    const result = updateData((data) => {
      const user = findUserByEmail(data, email);

      if (!user) {
        const error = new Error('존재하지 않는 이메일입니다.');
        error.status = 404;
        throw error;
      }

      if (user.password !== password) {
        const error = new Error('비밀번호가 일치하지 않습니다.');
        error.status = 401;
        throw error;
      }

      if (user.role !== role) {
        const error = new Error(role === 'parent' ? '부모 계정이 아닙니다.' : '자녀 계정이 아닙니다.');
        error.status = 403;
        throw error;
      }

      if (role === 'child' && !user.parentId) {
        const error = new Error('이 자녀 계정은 아직 부모 계정과 연결되어 있지 않습니다.');
        error.status = 400;
        throw error;
      }

      let child = null;
      if (role === 'child') {
        child = findChildById(data, user.id);
        if (!child) {
          child = createChildProfile(user, user.parentId);
          data.children.push(child);
        }
      }

      return { user: publicUser(user), child };
    });

    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || '로그인 중 오류가 발생했습니다.' });
  }
});

router.post('/logout', (req, res) => {
  res.json({ message: '로그아웃되었습니다.' });
});

router.put('/users/:id', (req, res) => {
  const { name, email, phone, profileImage } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: '이름과 이메일을 입력해 주세요.' });
  }

  try {
    const user = updateData((data) => {
      const target = findUserById(data, req.params.id);

      if (!target) {
        const error = new Error('사용자 정보를 찾을 수 없습니다.');
        error.status = 404;
        throw error;
      }

      const duplicatedEmailUser = findUserByEmail(data, email);
      if (duplicatedEmailUser && toId(duplicatedEmailUser.id) !== toId(target.id)) {
        const error = new Error('이미 사용 중인 이메일입니다.');
        error.status = 409;
        throw error;
      }

      target.name = name;
      target.email = email;
      target.phone = phone || '';
      target.profileImage = profileImage || target.profileImage || '';

      if (target.role === 'child') {
        const child = findChildById(data, target.id);
        if (child) {
          child.name = name;
          child.email = email;
          child.phone = phone || '';
          child.profileImage = profileImage || child.profileImage || '';
        }
      }

      return publicUser(target);
    });

    res.json({ user });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || '프로필 수정 중 오류가 발생했습니다.' });
  }
});

module.exports = router;

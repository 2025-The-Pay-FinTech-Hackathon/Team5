import { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Button, Modal,
  Form, ProgressBar, Alert, ListGroup, Badge
} from 'react-bootstrap';
import { findChildById, updateChild, getChildrenByParent } from '../utils/localData';
import { useLocation } from 'react-router-dom';

function Wishlist() {
  const location = useLocation();
  const user = JSON.parse(sessionStorage.getItem('user'));
  const isParent = user?.role === 'parent';

  const [child, setChild] = useState(null);
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editIdx, setEditIdx] = useState(-1);
  const [form, setForm] = useState({ name: '', targetAmount: '', memo: '', currentAmount: 0 });
  const [error, setError] = useState('');
  const [sortKey, setSortKey] = useState('latest');

  useEffect(() => {
    if (isParent) {
      const kids = getChildrenByParent(user.id);
      setChildren(kids);
      if (kids.length > 0) setSelectedChildId(kids[0].id);
    } else {
      setChild(findChildById(user.id));
    }
  }, [user, location.pathname]);

  useEffect(() => {
    if (isParent && selectedChildId) {
      setChild(findChildById(selectedChildId));
    }
  }, [selectedChildId, isParent]);

  const wishlist = child?.wishlist || [];

  const handleSave = () => {
    setError('');
    if (!form.name || !form.targetAmount) {
      setError('이름과 목표 금액을 입력하세요.');
      return;
    }
    const updated = { ...child };
    if (editIdx === -1) {
      updated.wishlist = [...(updated.wishlist || []), {
        ...form,
        targetAmount: Number(form.targetAmount),
        currentAmount: 0,
        id: Date.now()
      }];
    } else {
      updated.wishlist = [...(updated.wishlist || [])];
      updated.wishlist[editIdx] = { ...form, targetAmount: Number(form.targetAmount) };
    }
    updateChild(updated);
    setChild(updated);
    setShowModal(false);
    setForm({ name: '', targetAmount: '', memo: '', currentAmount: 0 });
    setEditIdx(-1);
  };

  const handleEdit = (idx) => {
    setForm(wishlist[idx]);
    setEditIdx(idx);
    setShowModal(true);
  };

  const handleDelete = (idx) => {
    const updated = { ...child };
    updated.wishlist = [...(updated.wishlist || [])];
    updated.wishlist.splice(idx, 1);
    updateChild(updated);
    setChild(updated);
  };

  const sortedWishlist = [...wishlist].sort((a, b) => {
    if (sortKey === 'amount') return b.targetAmount - a.targetAmount;
    if (sortKey === 'name') return a.name.localeCompare(b.name);
    return b.id - a.id;
  });

  return (
    <Container className="pt-5" style={{ paddingTop: '72px', minHeight: '100vh' }}>
      <h2 className="text-warning fw-bold mb-4">🎯 위시리스트</h2>

      {isParent && (
        <Form.Select
          className="mb-3 w-auto"
          value={selectedChildId}
          onChange={(e) => setSelectedChildId(e.target.value)}
        >
          {children.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Form.Select>
      )}

      {!isParent && (
        <div className="d-flex justify-content-between align-items-center mb-3">
          <Button variant="warning" className="fw-bold rounded-pill px-4" onClick={() => setShowModal(true)}>
            + 추가
          </Button>
          <Form.Select
            className="w-auto rounded-pill"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
          >
            <option value="latest">최신순</option>
            <option value="amount">금액순</option>
            <option value="name">이름순</option>
          </Form.Select>
        </div>
      )}

      {sortedWishlist.length === 0 ? (
        <p className="text-muted text-center">위시리스트가 없습니다.</p>
      ) : (
        <ListGroup>
          {sortedWishlist.map((item, idx) => (
            <ListGroup.Item key={item.id} className="mb-3 p-3 shadow-sm rounded-4">
              <div className="d-flex justify-content-between align-items-start">
                <div className="flex-grow-1">
                  <h5 className="fw-bold mb-1">{item.name}</h5>
                  <small className="text-muted">목표 금액: {item.targetAmount.toLocaleString()}원</small>
                  <ProgressBar
                    now={(item.currentAmount / item.targetAmount) * 100}
                    className="my-2 rounded-pill"
                    style={{ height: 10 }}
                    variant="warning"
                  />
                  <div className="text-muted small">
                    {item.currentAmount.toLocaleString()}원 / {item.targetAmount.toLocaleString()}원
                  </div>
                  {item.memo && <div className="text-muted small mt-1">{item.memo}</div>}
                </div>
                {!isParent && (
                  <div className="ms-3">
                    <Button variant="outline-secondary" size="sm" onClick={() => handleEdit(idx)} className="me-1">수정</Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(idx)}>삭제</Button>
                  </div>
                )}
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editIdx === -1 ? '위시리스트 추가' : '위시리스트 수정'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form.Group className="mb-3">
            <Form.Label>이름</Form.Label>
            <Form.Control
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>목표 금액</Form.Label>
            <Form.Control
              type="number"
              value={form.targetAmount}
              onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>메모</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={form.memo}
              onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>취소</Button>
          <Button variant="warning" onClick={handleSave}>저장</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default Wishlist;

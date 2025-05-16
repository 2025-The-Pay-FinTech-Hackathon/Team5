import { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Button, Modal, Form, ProgressBar, Alert
} from 'react-bootstrap';
import { BsBarChart, BsPencilSquare } from 'react-icons/bs';
import {
  findChildById, updateChild, getChildrenByParent
} from '../utils/localData';
import { useLocation } from 'react-router-dom';

function Savings() {
  const location = useLocation();
  const user = JSON.parse(sessionStorage.getItem('user'));
  const isParent = user?.role === 'parent';

  const [child, setChild] = useState(null);
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', targetAmount: '', deadline: '' });
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionType, setTransactionType] = useState('deposit');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isParent) {
      const kids = getChildrenByParent(user.id);
      setChildren(kids);
      if (kids.length > 0) {
        setChild(kids[0]);
        setSelectedChildId(kids[0].id);
      }
    } else {
      setChild(findChildById(user.id));
    }
  }, [user, location.pathname]);

  const handleChildSelect = (id) => {
    const selected = children.find(c => c.id === parseInt(id));
    setChild(selected);
    setSelectedChildId(id);
  };

  const handleSubmitGoal = () => {
    if (!newGoal.title || !newGoal.targetAmount || !newGoal.deadline) {
      setError('모든 필드를 입력해주세요.');
      return;
    }
    if (!child) return;

    const updated = { ...child };
    updated.savings = [
      ...(updated.savings || []),
      {
        id: Date.now(),
        ...newGoal,
        targetAmount: Number(newGoal.targetAmount),
        currentAmount: 0,
      },
    ];
    updateChild(updated);
    setChild(updated);
    setShowModal(false);
    setNewGoal({ title: '', targetAmount: '', deadline: '' });
    setError('');
  };

  const handleTransaction = () => {
    setError('');
    const amount = Number(transactionAmount);
    if (!selectedGoal || isNaN(amount) || amount <= 0) {
      setError('올바른 금액을 입력해주세요.');
      return;
    }

    const updated = { ...child };
    updated.savings = (updated.savings || []).map(goal => {
      if (goal.id === selectedGoal.id) {
        let newAmount = transactionType === 'deposit'
          ? goal.currentAmount + amount
          : goal.currentAmount - amount;
        newAmount = Math.max(0, Math.min(newAmount, goal.targetAmount));
        return { ...goal, currentAmount: newAmount };
      }
      return goal;
    });

    if (!updated.balance) updated.balance = 0;
    updated.balance += (transactionType === 'withdraw' ? amount : -amount);

    updateChild(updated);
    setChild(updated);
    setSelectedGoal(null);
    setTransactionAmount('');
    setTransactionType('deposit');
  };

  return (
 <Container
  fluid
  style={{
    paddingTop: '72px', // <-- 여기 명시적으로 고정값으로! 변수 말고!
    backgroundColor: '#fffbe9',
    minHeight: '100vh',
    boxSizing: 'border-box',
    position: 'relative',
    zIndex: 0, // Navigation보다 낮아도 무관, 안 겹치기만 하면 됨
  }}
>


      <header className="mb-4">
        <h4 className="d-flex align-items-center gap-2 text-warning fw-bold">
          <BsBarChart /> 저금 요약
        </h4>
        <h5 className="fw-bold">
          {isParent ? '자녀의 저금 목표를 도와주세요' : `${child?.name}의 저금 현황`}
        </h5>
        {isParent && (
          <Form.Select
            className="my-3 rounded-pill w-auto"
            value={selectedChildId}
            onChange={(e) => handleChildSelect(e.target.value)}
          >
            {children.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Form.Select>
        )}
      </header>

      <section className="mb-4">
        <Row>
          <Col md={6}>
            <Card className="mb-3 shadow-sm rounded-4 border-0">
              <Card.Body>
                <h6 className="text-muted">전체 잔액</h6>
                <h4 className="fw-bold text-warning">{child?.balance?.toLocaleString() || 0} 원</h4>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="mb-3 shadow-sm rounded-4 border-0">
              <Card.Body>
                <h6 className="text-muted">저금 목표 수</h6>
                <h4 className="fw-bold">{child?.savings?.length || 0} 개</h4>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </section>

      <section className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold d-flex align-items-center gap-2 text-dark">
            <BsPencilSquare /> 저금 목표
          </h5>
          {!isParent && (
            <Button
              variant="warning"
              className="fw-bold rounded-pill px-4"
              onClick={() => setShowModal(true)}
            >
              새 목표 만들기
            </Button>
          )}
        </div>

        {(child?.savings || []).length === 0 && (
          <p className="text-muted">아직 저금 목표가 없습니다.</p>
        )}

        {(child?.savings || []).map(goal => (
          <Card key={goal.id} className="mb-3 rounded-4 shadow-sm border-0">
            <Card.Body>
              <h6 className="fw-bold mb-1">{goal.title}</h6>
              <small className="text-muted">목표 금액: {goal.targetAmount.toLocaleString()}원</small>
              <ProgressBar
                now={(goal.currentAmount / goal.targetAmount) * 100}
                className="my-3 rounded-pill"
                style={{ height: 12 }}
                variant="warning"
              />
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">현재: {goal.currentAmount.toLocaleString()}원</span>
                <Button
                  size="sm"
                  variant="outline-warning"
                  className="rounded-pill fw-bold px-3"
                  onClick={() => setSelectedGoal(goal)}
                >
                  {isParent ? '입금 도와주기' : '입금 / 출금'}
                </Button>
              </div>
            </Card.Body>
          </Card>
        ))}
      </section>

      {/* 새 목표 생성 모달 */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>새 저금 목표 만들기</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger" className="rounded-4">{error}</Alert>}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>목표 이름</Form.Label>
              <Form.Control
                type="text"
                className="rounded-pill bg-light border-0 shadow-sm"
                value={newGoal.title}
                onChange={e => setNewGoal(g => ({ ...g, title: e.target.value }))}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>목표 금액</Form.Label>
              <Form.Control
                type="number"
                className="rounded-pill bg-light border-0 shadow-sm"
                value={newGoal.targetAmount}
                onChange={e => setNewGoal(g => ({ ...g, targetAmount: e.target.value }))}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>마감일</Form.Label>
              <Form.Control
                type="date"
                className="rounded-pill bg-light border-0 shadow-sm"
                value={newGoal.deadline}
                onChange={e => setNewGoal(g => ({ ...g, deadline: e.target.value }))}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>취소</Button>
          <Button variant="warning" className="rounded-pill px-4 fw-bold" onClick={handleSubmitGoal}>
            목표 저장
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 입금 / 출금 모달 */}
      <Modal show={!!selectedGoal} onHide={() => setSelectedGoal(null)}>
        <Modal.Header closeButton>
          <Modal.Title>{selectedGoal?.title} - 현재 {selectedGoal?.currentAmount.toLocaleString()}원</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger" className="rounded-4">{error}</Alert>}
          <Form.Group className="mb-3">
            <Form.Label>금액</Form.Label>
            <Form.Control
              type="number"
              className="rounded-pill bg-light border-0 shadow-sm"
              value={transactionAmount}
              onChange={e => setTransactionAmount(e.target.value)}
            />
          </Form.Group>
          {!isParent && (
            <Form.Group className="mb-3">
              <Form.Label>유형</Form.Label>
              <Form.Select
                className="rounded-pill bg-light border-0 shadow-sm"
                value={transactionType}
                onChange={e => setTransactionType(e.target.value)}
              >
                <option value="deposit">입금</option>
                <option value="withdraw">출금</option>
              </Form.Select>
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSelectedGoal(null)}>취소</Button>
          <Button
            variant="warning"
            className="rounded-pill px-4 fw-bold"
            onClick={handleTransaction}
            disabled={!transactionAmount || Number(transactionAmount) <= 0}
          >
            {isParent ? '입금 도와주기' : transactionType === 'deposit' ? '입금' : '출금'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default Savings;

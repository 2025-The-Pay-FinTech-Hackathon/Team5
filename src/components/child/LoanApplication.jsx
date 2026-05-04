import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useAuth } from '../../contexts/AuthContext';
import { useFirestore } from '../../contexts/FirestoreContext';
import { Card, Button, Table, Modal, Form, Alert } from 'react-bootstrap';
import { FaMoneyBillWave, FaHistory } from 'react-icons/fa';

const LoanApplication = () => {
  const { user } = useAuth();
  const { getLoans, addLoan } = useFirestore();
  const [loans, setLoans] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLoans = async () => {
      if (user?.uid) {
        const loansData = await getLoans(user.uid);
        setLoans(loansData);
      }
    };
    fetchLoans();
  }, [user, getLoans]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !purpose) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    try {
      const newLoan = {
        childId: user.uid,
        amount: Number(amount),
        purpose,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      await addLoan(newLoan);
      setShowModal(false);
      setAmount('');
      setPurpose('');
      // Refresh loans list
      const loansData = await getLoans(user.uid);
      setLoans(loansData);
    } catch (error) {
      setError('대출 신청 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="container py-4">
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h4 className="mb-0">대출 신청</h4>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <div className="d-flex justify-content-between mb-4">
            <h5>대출 현황</h5>
            <Button variant="primary" onClick={() => setShowModal(true)}>
              <FaMoneyBillWave className="me-2" />
              새 대출 신청
            </Button>
          </div>

          <Table responsive hover>
            <thead>
              <tr>
                <th>대출 금액</th>
                <th>목적</th>
                <th>상태</th>
                <th>신청일</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan.id}>
                  <td>{loan.amount.toLocaleString()}원</td>
                  <td>{loan.purpose}</td>
                  <td>
                    <span className={`badge bg-${loan.status === 'approved' ? 'success' : loan.status === 'rejected' ? 'danger' : 'warning'}`}>
                      {loan.status === 'approved' ? '승인' : loan.status === 'rejected' ? '거절' : '대기중'}
                    </span>
                  </td>
                  <td>{new Date(loan.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>새 대출 신청</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>대출 금액</Form.Label>
              <Form.Control
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="대출 금액을 입력하세요"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>대출 목적</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="대출 목적을 입력하세요"
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100">
              대출 신청
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default LoanApplication; 

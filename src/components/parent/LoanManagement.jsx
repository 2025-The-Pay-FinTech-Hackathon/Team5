import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useFirestore } from '../../contexts/FirestoreContext';
import { Card, Button, Table, Modal, Form, Alert } from 'react-bootstrap';
import { FaMoneyBillWave, FaCheck, FaTimes } from 'react-icons/fa';

const LoanManagement = () => {
  const { user } = useAuth();
  const { getLoans, updateLoan, addLoan } = useFirestore();
  const [loans, setLoans] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [amount, setAmount] = useState('');
  const [interest, setInterest] = useState('');
  const [term, setTerm] = useState('');
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

  const handleApprove = async (loanId) => {
    try {
      await updateLoan(loanId, { status: 'approved' });
      setLoans(loans.map(loan => 
        loan.id === loanId ? { ...loan, status: 'approved' } : loan
      ));
    } catch (error) {
      setError('대출 승인 중 오류가 발생했습니다.');
    }
  };

  const handleReject = async (loanId) => {
    try {
      await updateLoan(loanId, { status: 'rejected' });
      setLoans(loans.map(loan => 
        loan.id === loanId ? { ...loan, status: 'rejected' } : loan
      ));
    } catch (error) {
      setError('대출 거절 중 오류가 발생했습니다.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !interest || !term) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    try {
      const newLoan = {
        parentId: user.uid,
        amount: Number(amount),
        interest: Number(interest),
        term: Number(term),
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      await addLoan(newLoan);
      setShowModal(false);
      setAmount('');
      setInterest('');
      setTerm('');
      // Refresh loans list
      const loansData = await getLoans(user.uid);
      setLoans(loansData);
    } catch (error) {
      setError('대출 등록 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="container py-4">
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h4 className="mb-0">대출 관리</h4>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <div className="d-flex justify-content-between mb-4">
            <h5>대출 현황</h5>
            <Button variant="primary" onClick={() => setShowModal(true)}>
              <FaMoneyBillWave className="me-2" />
              새 대출 등록
            </Button>
          </div>

          <Table responsive hover>
            <thead>
              <tr>
                <th>대출 금액</th>
                <th>이자율</th>
                <th>기간(개월)</th>
                <th>상태</th>
                <th>신청일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan.id}>
                  <td>{loan.amount.toLocaleString()}원</td>
                  <td>{loan.interest}%</td>
                  <td>{loan.term}개월</td>
                  <td>
                    <span className={`badge bg-${loan.status === 'approved' ? 'success' : loan.status === 'rejected' ? 'danger' : 'warning'}`}>
                      {loan.status === 'approved' ? '승인' : loan.status === 'rejected' ? '거절' : '대기중'}
                    </span>
                  </td>
                  <td>{new Date(loan.createdAt).toLocaleDateString()}</td>
                  <td>
                    {loan.status === 'pending' && (
                      <div className="btn-group">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleApprove(loan.id)}
                        >
                          <FaCheck />
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleReject(loan.id)}
                        >
                          <FaTimes />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>새 대출 등록</Modal.Title>
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
              <Form.Label>이자율 (%)</Form.Label>
              <Form.Control
                type="number"
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
                placeholder="이자율을 입력하세요"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>기간 (개월)</Form.Label>
              <Form.Control
                type="number"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="대출 기간을 입력하세요"
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100">
              대출 등록
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default LoanManagement; 
// pages/MemoryGame.jsx
import { useState, useEffect, useRef } from 'react';
import {
  Container, Row, Col, Card, Button, Alert, Badge
} from 'react-bootstrap';
import { BsClockHistory, BsPatchQuestionFill } from 'react-icons/bs';
import { cardPairs } from '../utils/cardPairs'; // 카드 데이터 파일
import { findChildById, updateChild } from '../utils/localData';

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function MemoryGame() {
  const user = JSON.parse(sessionStorage.getItem('user'));
  const [cards, setCards] = useState([]);       // 카드 데이터
  const [flippedCards, setFlippedCards] = useState([]);  // 뒤집어진 카드들
  const [matchedPairs, setMatchedPairs] = useState([]);   // 매칭된 카드 쌍
  const [gameStarted, setGameStarted] = useState(false);  // 게임 시작 여부
  const [time, setTime] = useState(0);            // 경과 시간
  const timerRef = useRef(null);
  const [showInfo, setShowInfo] = useState(true); // 게임 정보 표시 여부
  const [rewarded, setRewarded] = useState(false); // 포인트 지급 여부
  const [reward, setReward] = useState(0); // 지급 포인트

  useEffect(() => {
    const shuffled = shuffle(cardPairs).slice(0, 8);  // 카드 데이터 8개 랜덤 추출 (단어와 뜻 각각 다르게)

    // 8개의 단어 카드와 8개의 뜻 카드를 만들기
    const words = shuffled.map((c, i) => ({
      ...c,
      id: `word-${i}`,
      flipped: false,  // 카드 뒤집힘 상태
      matched: false,  // 카드 매칭 여부
      type: 'word',     // 단어 카드
      pairId: `pair-${i}`  // 고유한 pairId 부여
    }));

    const definitions = shuffled.map((c, i) => ({
      ...c,
      id: `def-${i}`,
      flipped: false,  // 카드 뒤집힘 상태
      matched: false,  // 카드 매칭 여부
      type: 'definition',  // 뜻 카드
      pairId: `pair-${i}`  // 고유한 pairId 부여 (단어 카드와 동일한 pairId)
    }));

    // 단어 카드와 뜻 카드를 합쳐서 하나의 배열로 만듦
    const finalCards = [...words, ...definitions];

    setCards(shuffle(finalCards));  // 카드 배열 랜덤 섞기
    setMatchedPairs([]);
    setFlippedCards([]);
    setGameStarted(false);
    setTime(0);
    setRewarded(false);
    setReward(0);

    // 3초 후에 게임 시작
    const memoryTimeout = setTimeout(() => {
      setGameStarted(true);
      setShowInfo(false);
      startTimer();
    }, 3000);

    return () => clearTimeout(memoryTimeout);
  }, []);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTime((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    clearInterval(timerRef.current);
  };

  const handleFlip = (card) => {
    if (!gameStarted || card.flipped || matchedPairs.includes(card.pairId)) return;

    // 카드 뒤집기
    setFlippedCards((prev) => [...prev, card]);

    const updatedCards = cards.map((c) =>
      c.id === card.id ? { ...c, flipped: true } : c
    );
    setCards(updatedCards);

    if (flippedCards.length === 1) {
      const [firstCard] = flippedCards;

      // 두 카드가 매칭되는지 확인
      if (firstCard.pairId === card.pairId) {
        setMatchedPairs((prev) => [...prev, firstCard.pairId]);
        setFlippedCards([]);
      } else {
        setTimeout(() => {
          const resetCards = cards.map((c) =>
            c.id === firstCard.id || c.id === card.id
              ? { ...c, flipped: false }
              : c
          );
          setCards(resetCards);
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  useEffect(() => {
    if (matchedPairs.length === 8 && !rewarded) {
      stopTimer();
      // 포인트 지급: 8페어 기준, 시간에 따라 차등 지급(예: 60초 이내 100점, 120초 이내 70점, 그 외 50점)
      let point = 50;
      if (time <= 60) point = 100;
      else if (time <= 120) point = 70;
      setReward(point);
      if (user?.role === 'child') {
        const child = findChildById(user.id);
        if (child) {
          const updated = { ...child };
          updated.points = (updated.points || 0) + point;
          // 메모리 게임 결과 저장
          updated.memoryGameResults = [
            ...(updated.memoryGameResults || []),
            {
              id: Date.now(),
              date: new Date().toISOString().slice(0, 10),
              points: point,
              time: time,
              pairs: matchedPairs.length
            }
          ];
          updateChild(updated);
        }
      }
      setRewarded(true);
    }
  }, [matchedPairs, rewarded, time, user]);

  const handleRestart = () => {
    window.location.reload();
  };

  return (
    <Container fluid style={{ backgroundColor: '#fffbe9', minHeight: '100vh', paddingTop: '96px' }}>
      <div className="mx-auto" style={{ maxWidth: 700 }}>
        <h2 className="fw-bold mb-4 text-center" style={{ color: '#3C1E1E' }}>🧠 금융 카드 매칭 게임</h2>

        {showInfo && (
          <Alert variant="warning" className="text-center fw-semibold">
            🧠 3초 동안 카드를 암기하세요!<br />같은 카드를 매칭해보세요.
          </Alert>
        )}

        {!showInfo && (
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0 text-dark">
              <BsClockHistory className="me-2" />경과 시간: <Badge bg="warning" text="dark">{time}초</Badge>
            </h6>
            <span className="text-muted">남은 페어: {8 - matchedPairs.length}</span>
          </div>
        )}

        <Row className="g-3">
          {cards.map((card) => (
            <Col xs={3} key={card.id}>
              <Card
                className={`text-center ${card.flipped || matchedPairs.includes(card.pairId) ? 'bg-success text-white' : 'bg-light'}`}
                style={{ cursor: 'pointer', height: 100, borderRadius: 16, boxShadow: '0 2px 8px #F5F5F5', fontWeight: 600, fontSize: '1.1rem' }}
                onClick={() => handleFlip(card)}
              >
                <Card.Body className="d-flex align-items-center justify-content-center p-2">
                  <Card.Text className="mb-0 fw-semibold" style={{ fontSize: '1rem' }}>
                    {card.flipped || matchedPairs.includes(card.pairId) ? card.text : <BsPatchQuestionFill />}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {matchedPairs.length === 8 && (
          <div className="text-center mt-5">
            <h5 className="fw-bold text-success mb-3">🎉 축하합니다!</h5>
            <p>전체 매칭 완료! <Badge bg="info">{time}초</Badge></p>
            {rewarded && (
              <Alert variant="success" className="fw-semibold">{reward} 포인트가 지급되었습니다!</Alert>
            )}
            <Button variant="warning" onClick={handleRestart} className="rounded-pill px-4 fw-bold text-dark">
              🔁 다시 하기
            </Button>
          </div>
        )}
      </div>
    </Container>
  );
}

export default MemoryGame;

// pages/MemoryGame.jsx
import { useState, useEffect } from 'react';
import { cardPairs } from '../utils/cardPairs';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  Button,
} from '@mui/material';

function shuffleCards(cards) {
  return [...cards].sort(() => Math.random() - 0.5);
}

function MemoryGame() {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [score, setScore] = useState(0);

  const [showAll, setShowAll] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);

  // 초기 카드 셔플 + 암기 시간
  useEffect(() => {
    const shuffled = shuffleCards(cardPairs);
    setCards(shuffled);
    setShowAll(true);
    setGameStarted(false);

    const timer = setTimeout(() => {
      setShowAll(false);
      setGameStarted(true);
    }, 3000); // 3초 보여주기

    return () => clearTimeout(timer);
  }, []);

  const handleFlip = (card) => {
    if (!gameStarted || flipped.length === 2 || flipped.includes(card.id) || matched.includes(card.id)) return;

    const newFlipped = [...flipped, card.id];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      const [firstId, secondId] = newFlipped;
      const firstCard = cards.find((c) => c.id === firstId);
      const secondCard = cards.find((c) => c.id === secondId);

      if (firstCard.pairId === secondCard.pairId) {
        setMatched((prev) => [...prev, firstId, secondId]);
        setScore((prev) => prev + 10);
      }

      setTimeout(() => {
        setFlipped([]);
      }, 800);
    }
  };

  const isFlipped = (id) => showAll || flipped.includes(id) || matched.includes(id);

  const handleRestart = () => {
    const reshuffled = shuffleCards(cardPairs);
    setCards(reshuffled);
    setFlipped([]);
    setMatched([]);
    setScore(0);
    setShowAll(true);
    setGameStarted(false);

    setTimeout(() => {
      setShowAll(false);
      setGameStarted(true);
    }, 3000);
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        🧩 금융 상식 카드 매칭 게임
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 3 }}>
        점수: {score}점 | 남은 페어: {(cards.length - matched.length) / 2}
      </Typography>

      <Grid container spacing={2}>
        {cards.map((card) => (
          <Grid item xs={4} sm={3} key={card.id}>
           <Paper
  onClick={() => handleFlip(card)}
  sx={{
    p: 2,
    height: 100,
    textAlign: 'center',
    borderRadius: 2,
    backgroundColor: isFlipped(card.id)
      ? card.type === 'concept'
        ? '#e3f2fd' // 연한 파랑
        : '#f0f0f0' // 연한 회색
      : '#ddd',
    cursor: isFlipped(card.id) ? 'default' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.3s',
    fontWeight: isFlipped(card.id)
      ? card.type === 'concept'
        ? 700
        : 400
      : 300,
  }}
  elevation={isFlipped(card.id) ? 3 : 1}
>
  <Typography
    variant={card.type === 'concept' ? 'body1' : 'body2'}
    align="center"
  >
    {isFlipped(card.id) ? card.text : '❓'}
  </Typography>
</Paper>

          </Grid>
        ))}
      </Grid>

      {/* 게임 완료 메시지 */}
      {matched.length === cards.length && (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            🎉 게임 완료! 최종 점수: {score}점
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleRestart}
            sx={{ mt: 2 }}
          >
            다시 하기
          </Button>
        </Box>
      )}
    </Container>
  );
}

export default MemoryGame;

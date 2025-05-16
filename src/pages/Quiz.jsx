import { useState } from 'react';
import { findChildById, updateChild } from '../utils/localData';
import { checkAndUpdateBadges } from '../utils/badgeUtils';
import {
  Paper,
  Typography,
  Box,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

function Quiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const user = JSON.parse(sessionStorage.getItem('user'));
  const [child, setChild] = useState(user?.role === 'child' ? findChildById(user.id) : null);

  const questions = [
    {
      question: '저축이란 무엇인가요?',
      options: ['돈을 쓰는 것', '돈을 모으는 것', '돈을 빌리는 것', '돈을 잃는 것'],
      correctAnswer: '돈을 모으는 것',
      explanation: '저축은 미래를 위해 돈을 모으는 행동입니다. 필요할 때 사용할 수 있도록 돈을 보관하는 것이죠.',
    },
    {
      question: '이자란 무엇인가요?',
      options: ['빌린 돈을 갚는 것', '돈을 빌려주고 받는 보상', '돈을 잃는 것', '돈을 쓰는 것'],
      correctAnswer: '돈을 빌려주고 받는 보상',
      explanation: '이자는 돈을 빌려주고 받는 보상입니다. 은행에 돈을 맡기면 이자를 받고, 돈을 빌리면 이자를 내야 해요.',
    },
  ];

  const handleAnswerSelect = (event) => setSelectedAnswer(event.target.value);

  const handleSubmit = () => {
    const isCorrect = selectedAnswer === questions[currentQuestion].correctAnswer;
    if (isCorrect) setScore(score + 1);

    if (child) {
      const updated = { ...child };
      updated.quizzes = [
        ...(child.quizzes || []),
        {
          id: Date.now(),
          isCorrect,
          answeredAt: new Date().toISOString().slice(0, 10),
        },
      ];
      updateChild(updated);
      setChild(updated);
      checkAndUpdateBadges(updated);
    }

    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer('');
      setShowExplanation(false);
    } else {
      setQuizCompleted(true);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedAnswer('');
    setShowExplanation(false);
    setScore(0);
    setQuizCompleted(false);
  };

  return (
    <Box
      sx={{
        backgroundColor: '#f9f9f9',
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        px: 2,
        py: 4,
      }}
    >
      <Paper
        sx={{
          width: '100%',
          maxWidth: 960,
          minHeight: 500,
          mx: 'auto', // 수평 정렬 강제
          p: 4,
          borderRadius: 4,
          backgroundColor: '#fff',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {quizCompleted ? (
          <Box sx={{ textAlign: 'center', width: '100%' }}>
            <Typography variant="h4" gutterBottom>
              퀴즈 완료!
            </Typography>
            <Typography variant="h5" sx={{ color: '#FFD600' }} gutterBottom>
              점수: {score} / {questions.length}
            </Typography>
            <Button
              variant="contained"
              onClick={handleRestart}
              sx={{
                mt: 2,
                backgroundColor: '#FFD600',
                color: '#222',
                fontWeight: 700,
                borderRadius: 99,
                '&:hover': { backgroundColor: '#FFEA70' },
              }}
            >
              다시 시작하기
            </Button>
          </Box>
        ) : (
          <Box sx={{ width: '100%' }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">
                문제 {currentQuestion + 1} / {questions.length}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={((currentQuestion + 1) / questions.length) * 100}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  mt: 1,
                  backgroundColor: '#FFF9C4',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#FFD600',
                  },
                }}
              />
            </Box>

            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{ mb: 2, textAlign: 'left' }}
            >
              {questions[currentQuestion].question}
            </Typography>

            <FormControl component="fieldset" fullWidth>
              <RadioGroup value={selectedAnswer} onChange={handleAnswerSelect}>
                {questions[currentQuestion].options.map((option, index) => (
                  <FormControlLabel
                    key={index}
                    value={option}
                    control={<Radio sx={{ display: 'none' }} />}
                    label={
                      <Box
                        sx={{
                          width: '100%',
                          border: '1px solid #ddd',
                          borderRadius: 2,
                          px: 2,
                          py: 1.5,
                          mb: 1.5,
                          cursor: 'pointer',
                          backgroundColor: selectedAnswer === option ? '#FFD600' : '#fff',
                          color: selectedAnswer === option ? '#222' : '#000',
                          boxShadow: selectedAnswer === option ? 2 : 0,
                          transition: 'all 0.2s',
                          '&:hover': {
                            backgroundColor:
                              selectedAnswer === option ? '#FFEA70' : '#f5f5f5',
                          },
                        }}
                      >
                        <Typography>
                          <strong>{String.fromCharCode(65 + index)}.</strong> {option}
                        </Typography>
                      </Box>
                    }
                    disabled={showExplanation}
                    sx={{ margin: 0 }}
                  />
                ))}
              </RadioGroup>
            </FormControl>

            {showExplanation && (
              <Alert
                severity={
                  selectedAnswer === questions[currentQuestion].correctAnswer
                    ? 'success'
                    : 'error'
                }
                sx={{
                  mt: 2,
                  borderRadius: 2,
                  backgroundColor:
                    selectedAnswer === questions[currentQuestion].correctAnswer
                      ? '#FFF8B0'
                      : '#FFE5E5',
                  color: '#000',
                  width: '100%',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {selectedAnswer === questions[currentQuestion].correctAnswer ? (
                    <CheckCircleIcon />
                  ) : (
                    <CancelIcon />
                  )}
                  <Typography fontWeight="bold">
                    {selectedAnswer === questions[currentQuestion].correctAnswer
                      ? '정답입니다!'
                      : '틀렸습니다.'}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {questions[currentQuestion].explanation}
                </Typography>
              </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Button
                variant="contained"
                onClick={showExplanation ? handleNext : handleSubmit}
                disabled={!selectedAnswer && !showExplanation}
                sx={{
                  backgroundColor: '#FFD600',
                  color: '#222',
                  fontWeight: 700,
                  borderRadius: 99,
                  py: 1,
                  px: 4,
                  '&:hover': { backgroundColor: '#FFEA70' },
                }}
              >
                {showExplanation ? '다음 문제' : '제출하기'}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default Quiz;

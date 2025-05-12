import { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { CheckCircle as CheckCircleIcon, Cancel as CancelIcon } from '@mui/icons-material';

function Quiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const questions = [
    {
      question: '저축이란 무엇인가요?',
      options: [
        '돈을 쓰는 것',
        '돈을 모으는 것',
        '돈을 빌리는 것',
        '돈을 잃는 것',
      ],
      correctAnswer: '돈을 모으는 것',
      explanation: '저축은 미래를 위해 돈을 모으는 행동입니다. 필요할 때 사용할 수 있도록 돈을 보관하는 것이죠.',
    },
    {
      question: '이자란 무엇인가요?',
      options: [
        '빌린 돈을 갚는 것',
        '돈을 빌려주고 받는 보상',
        '돈을 잃는 것',
        '돈을 쓰는 것',
      ],
      correctAnswer: '돈을 빌려주고 받는 보상',
      explanation: '이자는 돈을 빌려주고 받는 보상입니다. 은행에 돈을 맡기면 이자를 받고, 돈을 빌리면 이자를 내야 해요.',
    },
    // Add more questions here
  ];

  const handleAnswerSelect = (event) => {
    setSelectedAnswer(event.target.value);
  };

  const handleSubmit = () => {
    if (selectedAnswer === questions[currentQuestion].correctAnswer) {
      setScore(score + 1);
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

  if (quizCompleted) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            퀴즈 완료!
          </Typography>
          <Typography variant="h5" color="primary" gutterBottom>
            점수: {score} / {questions.length}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleRestart}
            sx={{ mt: 2 }}
          >
            다시 시작하기
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            금융 퀴즈
          </Typography>
          <LinearProgress
            variant="determinate"
            value={(currentQuestion / questions.length) * 100}
            sx={{ height: 10, borderRadius: 5 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {currentQuestion + 1} / {questions.length}
          </Typography>
        </Box>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {questions[currentQuestion].question}
            </Typography>
            <FormControl component="fieldset">
              <RadioGroup
                value={selectedAnswer}
                onChange={handleAnswerSelect}
              >
                {questions[currentQuestion].options.map((option, index) => (
                  <FormControlLabel
                    key={index}
                    value={option}
                    control={<Radio />}
                    label={option}
                    disabled={showExplanation}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          </CardContent>
        </Card>

        {showExplanation && (
          <Alert
            severity={selectedAnswer === questions[currentQuestion].correctAnswer ? 'success' : 'error'}
            sx={{ mb: 3 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {selectedAnswer === questions[currentQuestion].correctAnswer ? (
                <CheckCircleIcon sx={{ mr: 1 }} />
              ) : (
                <CancelIcon sx={{ mr: 1 }} />
              )}
              <Typography>
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

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          {!showExplanation ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={!selectedAnswer}
            >
              제출하기
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
            >
              다음 문제
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
}

export default Quiz; 
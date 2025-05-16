import { useState, useEffect } from 'react';
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

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

const ALL_QUESTIONS = [
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
  {
    question: '가계부를 쓰는 목적은?',
    options: ['돈을 더 쓰기 위해', '지출과 수입을 관리하기 위해', '은행에 돈을 맡기기 위해', '카드를 만들기 위해'],
    correctAnswer: '지출과 수입을 관리하기 위해',
    explanation: '가계부는 돈의 흐름을 파악하고 계획적으로 소비하기 위해 작성합니다.',
  },
  {
    question: '신용카드와 체크카드의 차이는?',
    options: ['둘 다 똑같다', '신용카드는 외상, 체크카드는 즉시 출금', '체크카드는 외상, 신용카드는 즉시 출금', '둘 다 현금만 사용'],
    correctAnswer: '신용카드는 외상, 체크카드는 즉시 출금',
    explanation: '신용카드는 외상(나중에 결제), 체크카드는 결제 즉시 내 통장에서 출금됩니다.',
  },
  {
    question: '금융사기(피싱) 예방법은?',
    options: ['모르는 링크 클릭', '비밀번호 공유', '의심되는 전화 끊기', '개인정보 SNS에 올리기'],
    correctAnswer: '의심되는 전화 끊기',
    explanation: '금융사기는 의심되는 전화나 문자를 무시하고, 개인정보를 타인에게 알려주지 않아야 예방할 수 있습니다.',
  },
  {
    question: '적금이란?',
    options: ['한 번에 큰 돈을 맡기는 것', '매달 일정 금액을 저축하는 것', '돈을 빌리는 것', '카드를 만드는 것'],
    correctAnswer: '매달 일정 금액을 저축하는 것',
    explanation: '적금은 매달 일정 금액을 은행에 저축하는 상품입니다.',
  },
  {
    question: '예금자 보호 제도란?',
    options: ['은행이 망해도 일정 금액까지 돌려주는 제도', '은행이 돈을 빌려주는 제도', '카드 포인트 제도', '적금 이자 제도'],
    correctAnswer: '은행이 망해도 일정 금액까지 돌려주는 제도',
    explanation: '예금자 보호 제도는 은행이 파산해도 일정 금액까지 예금을 보호해주는 제도입니다.',
  },
  {
    question: '이체 수수료란?',
    options: ['돈을 빌릴 때 내는 돈', '돈을 보낼 때 내는 비용', '카드 연회비', '적금 이자'],
    correctAnswer: '돈을 보낼 때 내는 비용',
    explanation: '이체 수수료는 돈을 다른 계좌로 보낼 때 내는 비용입니다.',
  },
  {
    question: '신용점수가 낮아지면?',
    options: ['대출이 쉬워진다', '이자가 줄어든다', '대출이 어려워진다', '카드 발급이 쉬워진다'],
    correctAnswer: '대출이 어려워진다',
    explanation: '신용점수가 낮으면 대출이나 카드 발급이 어려워집니다.',
  },
  {
    question: '자동이체의 장점은?',
    options: ['돈을 더 쓸 수 있다', '납부를 깜빡하지 않는다', '이자가 늘어난다', '카드 포인트가 쌓인다'],
    correctAnswer: '납부를 깜빡하지 않는다',
    explanation: '자동이체는 정기적으로 돈이 빠져나가서 납부를 잊지 않게 해줍니다.',
  },
  {
    question: '현금영수증의 장점은?',
    options: ['세금 혜택', '돈을 더 쓸 수 있다', '카드 포인트', '이자가 늘어난다'],
    correctAnswer: '세금 혜택',
    explanation: '현금영수증을 발급받으면 연말정산 등에서 세금 혜택을 받을 수 있습니다.',
  },
  {
    question: '적금 만기란?',
    options: ['적금이 끝나는 시점', '적금 이자 받는 날', '적금 시작일', '카드 결제일'],
    correctAnswer: '적금이 끝나는 시점',
    explanation: '적금 만기는 적금 계약이 끝나는 시점입니다.',
  },
  {
    question: '이체 한도란?',
    options: ['이체할 수 있는 최대 금액', '카드 한도', '적금 이자', '대출 한도'],
    correctAnswer: '이체할 수 있는 최대 금액',
    explanation: '이체 한도는 한 번에 이체할 수 있는 최대 금액을 의미합니다.',
  },
  {
    question: '금융상품 가입 전 확인할 점은?',
    options: ['이자율, 수수료, 조건', '광고만 보기', '친구 추천', '은행 위치'],
    correctAnswer: '이자율, 수수료, 조건',
    explanation: '금융상품은 이자율, 수수료, 조건 등을 꼼꼼히 확인해야 합니다.',
  },
  {
    question: '카드 결제일이란?',
    options: ['카드 발급일', '카드 대금이 빠져나가는 날', '카드 만기일', '카드 포인트 적립일'],
    correctAnswer: '카드 대금이 빠져나가는 날',
    explanation: '카드 결제일은 사용한 금액이 내 통장에서 빠져나가는 날입니다.',
  },
  {
    question: '금융교육이 중요한 이유는?',
    options: ['돈을 잘 쓰기 위해', '돈을 잘 모으기 위해', '금융사기를 예방하기 위해', '모두 해당'],
    correctAnswer: '모두 해당',
    explanation: '금융교육은 돈을 잘 쓰고 모으고, 금융사기를 예방하는 데 모두 중요합니다.',
  },
  {
    question: '대출이란?',
    options: ['돈을 빌리는 것', '돈을 모으는 것', '카드를 만드는 것', '이자를 받는 것'],
    correctAnswer: '돈을 빌리는 것',
    explanation: '대출은 은행 등에서 돈을 빌리는 것을 의미합니다.',
  },
  {
    question: '이자율이 높을수록?',
    options: ['이자가 많아진다', '이자가 적어진다', '대출이 쉬워진다', '카드 포인트가 쌓인다'],
    correctAnswer: '이자가 많아진다',
    explanation: '이자율이 높을수록 받거나 내야 하는 이자가 많아집니다.',
  },
  {
    question: '금융사기(보이스피싱) 대처법은?',
    options: ['의심되면 바로 끊기', '모르는 링크 클릭', '비밀번호 공유', '개인정보 SNS에 올리기'],
    correctAnswer: '의심되면 바로 끊기',
    explanation: '보이스피싱 등 금융사기는 의심되면 바로 끊고, 개인정보를 타인에게 알려주지 않아야 합니다.',
  },
  {
    question: '저축 목표를 세우는 이유는?',
    options: ['목표를 이루기 위해', '돈을 다 쓰기 위해', '카드를 만들기 위해', '이자를 받기 위해'],
    correctAnswer: '목표를 이루기 위해',
    explanation: '저축 목표를 세우면 돈을 모으는 목적이 생겨 더 잘 실천할 수 있습니다.',
  },
];

function Quiz() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [reward, setReward] = useState(0);
  const user = JSON.parse(sessionStorage.getItem('user'));
  const [child, setChild] = useState(user?.role === 'child' ? findChildById(user.id) : null);

  useEffect(() => {
    // 20문항 중 랜덤 5문항 출제
    setQuestions(shuffle(ALL_QUESTIONS).slice(0, 5));
  }, []);

  const handleAnswerSelect = (event) => setSelectedAnswer(event.target.value);

  const handleNext = () => {
    if (!selectedAnswer) return;
    const isCorrect = selectedAnswer === questions[currentQuestion].correctAnswer;
    let newScore = score;
    let newReward = reward;
    if (isCorrect) {
      newScore += 1;
      newReward += 20; // 1문제당 20점
    }
    setScore(newScore);
    setReward(newReward);
    setShowExplanation(true);
    setTimeout(() => {
      setShowExplanation(false);
      setSelectedAnswer('');
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        setQuizCompleted(true);
        // 포인트 지급
        if (user?.role === 'child') {
          const childObj = findChildById(user.id);
          if (childObj) {
            const updated = { ...childObj };
            updated.points = (updated.points || 0) + newReward;
            // 퀴즈 결과 저장
            updated.quizResults = [
              ...(updated.quizResults || []),
              {
                id: Date.now(),
                date: new Date().toISOString().slice(0, 10),
                score: newReward,
                correctAnswers: newScore,
                totalQuestions: questions.length,
                questions: questions.map(q => ({
                  question: q.question,
                  correctAnswer: q.correctAnswer
                }))
              }
            ];
            updateChild(updated);
            setChild(updated);
          }
        }
      }
    }, 1200);
  };

  if (questions.length === 0) return null;

  return (
    <Paper sx={{ maxWidth: 600, mx: 'auto', mt: 6, p: 4, borderRadius: 4, boxShadow: 3 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        금융 퀴즈
      </Typography>
      <LinearProgress variant="determinate" value={((currentQuestion + (quizCompleted ? 1 : 0)) / questions.length) * 100} sx={{ mb: 3 }} />
      {!quizCompleted ? (
        <>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Q{currentQuestion + 1}. {questions[currentQuestion].question}
          </Typography>
          <FormControl component="fieldset">
            <RadioGroup value={selectedAnswer} onChange={handleAnswerSelect}>
              {questions[currentQuestion].options.map((option, idx) => (
                <FormControlLabel
                  key={idx}
                  value={option}
                  control={<Radio />}
                  label={option}
                  disabled={showExplanation}
                />
              ))}
            </RadioGroup>
          </FormControl>
          {showExplanation && (
            <Alert severity={selectedAnswer === questions[currentQuestion].correctAnswer ? 'success' : 'error'} sx={{ mt: 2 }}>
              {selectedAnswer === questions[currentQuestion].correctAnswer ? (
                <>
                  <CheckCircleIcon sx={{ verticalAlign: 'middle', mr: 1 }} /> 정답! {questions[currentQuestion].explanation}
                </>
              ) : (
                <>
                  <CancelIcon sx={{ verticalAlign: 'middle', mr: 1 }} /> 오답! {questions[currentQuestion].explanation}
                </>
              )}
            </Alert>
          )}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
              disabled={!selectedAnswer || showExplanation}
            >
              {currentQuestion === questions.length - 1 ? '제출' : '다음'}
            </Button>
          </Box>
        </>
      ) : (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" fontWeight={700} color="success.main" gutterBottom>
            퀴즈 완료!<br />정답 {score}개 / {questions.length}문제<br />
            <span style={{ color: '#FFD600' }}>{reward} 포인트</span>가 지급되었습니다!
          </Typography>
          <Button variant="outlined" onClick={() => window.location.reload()} sx={{ mt: 2 }}>
            다시 풀기
          </Button>
        </Box>
      )}
    </Paper>
  );
}

export default Quiz;

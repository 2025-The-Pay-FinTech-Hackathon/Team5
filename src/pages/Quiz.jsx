import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

function Quiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

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

  const handleAnswerSelect = (value) => {
    setSelectedAnswer(value);
  };

  const handleSubmit = () => {
    const isCorrect = selectedAnswer === questions[currentQuestion].correctAnswer;
    if (isCorrect) setScore(score + 1);
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
    <div className="container-fluid bg-light min-vh-100 d-flex justify-content-center align-items-center py-5">
      <div className="card shadow-lg w-100" style={{ maxWidth: 700 }}>
        <div className="card-body">
          {quizCompleted ? (
            <div className="text-center">
              <h2 className="mb-3">퀴즈 완료!</h2>
              <h4 className="text-warning mb-4">점수: {score} / {questions.length}</h4>
              <button className="btn btn-warning fw-bold rounded-pill px-4" onClick={handleRestart}>
                다시 시작하기
              </button>
            </div>
          ) : (
            <>
              {/* Progress */}
              <div className="mb-3">
                <small className="text-muted">문제 {currentQuestion + 1} / {questions.length}</small>
                <div className="progress mt-1" style={{ height: 10 }}>
                  <div
                    className="progress-bar bg-warning"
                    role="progressbar"
                    style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* 질문 */}
              <h5 className="fw-bold mb-3">{questions[currentQuestion].question}</h5>

              {/* 선택지 */}
              <div className="mb-3">
                {questions[currentQuestion].options.map((option, index) => (
                  <div
                    key={index}
                    className={`border rounded p-3 mb-2 ${selectedAnswer === option ? 'bg-warning shadow-sm' : 'bg-white'}`}
                    onClick={() => !showExplanation && handleAnswerSelect(option)}
                    style={{ cursor: showExplanation ? 'default' : 'pointer' }}
                  >
                    <strong>{String.fromCharCode(65 + index)}.</strong> {option}
                  </div>
                ))}
              </div>

              {/* 해설 */}
              {showExplanation && (
                <div
                  className={`alert ${selectedAnswer === questions[currentQuestion].correctAnswer ? 'alert-success' : 'alert-danger'}`}
                >
                  <div className="d-flex align-items-center">
                    <i className={`bi ${selectedAnswer === questions[currentQuestion].correctAnswer ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} me-2`}></i>
                    <strong>{selectedAnswer === questions[currentQuestion].correctAnswer ? '정답입니다!' : '틀렸습니다.'}</strong>
                  </div>
                  <div className="mt-2">{questions[currentQuestion].explanation}</div>
                </div>
              )}

              {/* 버튼 */}
              <div className="text-center mt-4">
                <button
                  className="btn btn-warning fw-bold rounded-pill px-4"
                  onClick={showExplanation ? handleNext : handleSubmit}
                  disabled={!selectedAnswer && !showExplanation}
                >
                  {showExplanation ? '다음 문제' : '제출하기'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Quiz;

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Grid,
} from '@mui/material';

const FinancialEducation = () => {
  const [activeStep, setActiveStep] = useState(0);

  const educationContent = [
    {
      title: '저축의 중요성',
      content: '저축은 미래를 위한 준비입니다. 정기적인 저축 습관을 기르는 것이 중요합니다.',
      quiz: {
        question: '저축의 가장 큰 장점은 무엇일까요?',
        options: [
          '즉각적인 만족',
          '미래를 위한 준비',
          '현재의 쾌락',
          '즉흥적인 소비'
        ],
        correctAnswer: 1
      }
    },
    {
      title: '예산 관리',
      content: '수입과 지출을 기록하고 관리하는 것이 예산 관리의 기본입니다.',
      quiz: {
        question: '효과적인 예산 관리의 첫 단계는?',
        options: [
          '지출하기',
          '수입 파악하기',
          '저축하기',
          '투자하기'
        ],
        correctAnswer: 1
      }
    },
    {
      title: '투자의 기초',
      content: '투자는 돈을 불리는 방법 중 하나입니다. 하지만 위험도 함께 고려해야 합니다.',
      quiz: {
        question: '투자할 때 가장 중요한 것은?',
        options: [
          '빠른 수익',
          '위험 관리',
          '많은 투자',
          '즉각적인 결과'
        ],
        correctAnswer: 1
      }
    }
  ];

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {educationContent.map((content, index) => (
          <Step key={index}>
            <StepLabel>{content.title}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {educationContent[activeStep].title}
          </Typography>
          <Typography variant="body1" paragraph>
            {educationContent[activeStep].content}
          </Typography>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              퀴즈
            </Typography>
            <Typography variant="body1" gutterBottom>
              {educationContent[activeStep].quiz.question}
            </Typography>
            <Grid container spacing={2}>
              {educationContent[activeStep].quiz.options.map((option, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => {
                      if (index === educationContent[activeStep].quiz.correctAnswer) {
                        // 정답 처리
                        handleNext();
                      }
                    }}
                  >
                    {option}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
        >
          이전
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={activeStep === educationContent.length - 1}
        >
          다음
        </Button>
      </Box>
    </Box>
  );
};

export default FinancialEducation; 
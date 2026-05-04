import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const PerformanceAnalytics = ({ data }) => {
  const savingsData = [
    { month: '1월', amount: 100000 },
    { month: '2월', amount: 150000 },
    { month: '3월', amount: 200000 },
    { month: '4월', amount: 180000 },
    { month: '5월', amount: 250000 },
    { month: '6월', amount: 300000 },
  ];

  const goals = [
    { title: '월 저축 목표', current: 250000, target: 300000 },
    { title: '미션 완료율', current: 8, target: 10 },
    { title: '퀴즈 정답률', current: 85, target: 100 },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        성과 분석
      </Typography>

      <Grid container spacing={3}>
        {/* 저축 추이 그래프 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                저축 추이
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={savingsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#8884d8"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 목표 달성률 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                목표 달성률
              </Typography>
              <Grid container spacing={2}>
                {goals.map((goal, index) => (
                  <Grid item xs={12} key={index}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        {goal.title}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(100, Math.round((goal.current / goal.target) * 100))}
                            sx={{
                              height: 8,
                              borderRadius: 5,
                              mt: 1,
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: '#FFD600',
                              },
                              backgroundColor: '#FFEFB0',
                            }}
                          />

                        </Box>
                        <Box sx={{ minWidth: 35 }}>
                          <Typography variant="body2" color="text.secondary">
                            {`${Math.round((goal.current / goal.target) * 100)}%`}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 습관 형성 트래커 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                습관 형성 트래커
              </Typography>
              <Grid container spacing={2}>
                {['저축', '미션 수행', '퀴즈 풀기'].map((habit, index) => (
                  <Grid item xs={12} sm={4} key={index}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        {habit}
                      </Typography>
                      <Typography variant="h4" color="primary">
                        {Math.floor(Math.random() * 30)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        연속 일수
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PerformanceAnalytics; 

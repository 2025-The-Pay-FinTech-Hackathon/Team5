// pages/ParentReportPage.jsx
import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Box,
  Paper,
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { getChildrenByParent } from '../utils/localData';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#af19ff', '#f94b4b'];

function ParentReportPage() {
  const parentId = JSON.parse(sessionStorage.getItem('user'))?.id;
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);

  useEffect(() => {
    const kids = getChildrenByParent(parentId);
    setChildren(kids);
    if (kids.length > 0) setSelectedChildId(kids[0].id);
  }, [parentId]);

  useEffect(() => {
    const child = children.find((c) => c.id === selectedChildId);
    setSelectedChild(child);
  }, [selectedChildId, children]);

  const getMonthlyPointData = () => {
    const result = {};
    (selectedChild?.missions || []).forEach((m) => {
      if (m.status !== '완료') return;
      const month = m.completedAt?.slice(0, 7); // yyyy-MM
      if (!month) return;
      result[month] = (result[month] || 0) + Number(m.reward || 0);
    });
    return Object.entries(result).map(([month, point]) => ({ month, point }));
  };

  const getCategoryPieData = () => {
    const result = {};
    (selectedChild?.purchases || []).forEach((p) => {
      const category = p.category || '기타';
      result[category] = (result[category] || 0) + (p.points || 0);
    });
    return Object.entries(result).map(([name, value]) => ({ name, value }));
  };

  const handleDownload = () => {
    const data = {
      name: selectedChild.name,
      email: selectedChild.email,
      pointHistory: getMonthlyPointData(),
      categorySummary: getCategoryPieData(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedChild.name}_report.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>📊 성과 보고서</Typography>

      <FormControl sx={{ mb: 4, minWidth: 200 }}>
        <InputLabel>자녀 선택</InputLabel>
        <Select
          value={selectedChildId || ''}
          label="자녀 선택"
          onChange={(e) => setSelectedChildId(e.target.value)}
        >
          {children.map((c) => (
            <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedChild && (
        <>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>📈 월별 포인트 획득</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getMonthlyPointData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="point" name="포인트" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>

          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>🥧 카테고리별 소비 분석</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getCategoryPieData()}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  fill="#8884d8"
                  label
                >
                  {getCategoryPieData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>

          <Box sx={{ textAlign: 'center' }}>
            <Button variant="contained" color="primary" onClick={handleDownload}>
              📥 리포트 다운로드 (JSON)
            </Button>
          </Box>
        </>
      )}
    </Container>
  );
}

export default ParentReportPage;
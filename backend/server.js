const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config(); // .env 파일 불러오기

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

const authRoutes = require('./routes/auth');
const childrenRoutes = require('./routes/children');


// 미들웨어
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/children', childrenRoutes);
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/savings', require('./routes/savings'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/store', require('./routes/store'));

// MongoDB 연결
mongoose.connect(MONGO_URI)

.then(() => console.log('MongoDB Connected'))
.catch((err) => {
  console.error('MongoDB Connection Failed:', err.message);
  process.exit(1);
});

// 라우트 예시
app.get('/', (req, res) => {
  res.send('서버 작동 중');
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버 실행됨: http://localhost:${PORT}`);
});

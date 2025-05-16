const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 5000;
const SECRET = 'super-secret-key';

app.use(cors());
app.use(bodyParser.json());

const users = {};
const transactions = [];

app.post('/register', (req, res) => {
  const { username, password, role } = req.body;
  const userId = uuidv4();
  users[userId] = { username, password, role, balance: 0, missions: [], score: 50, savingsGoal: { target: 0, current: 0 } };
  res.status(201).json({ userId });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const userId = Object.keys(users).find(id => users[id].username === username && users[id].password === password);
  if (!userId) return res.status(401).json({ msg: 'Invalid credentials' });
  const token = jwt.sign({ userId }, SECRET, { expiresIn: '1d' });
  res.json({ access_token: token, role: users[userId].role });
});

const auth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ msg: 'Missing token' });
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, SECRET);
    req.userId = payload.userId;
    next();
  } catch (e) {
    res.status(401).json({ msg: 'Invalid token' });
  }
};

app.post('/send_allowance', auth, (req, res) => {
  const senderId = req.userId;
  const { recipientId, amount } = req.body;
  if (users[senderId].role !== 'parent') return res.status(403).json({ msg: 'Not allowed' });
  if (!users[recipientId]) return res.status(400).json({ msg: 'Invalid recipient' });
  if (users[senderId].balance < amount) return res.status(400).json({ msg: 'Insufficient funds' });

  users[senderId].balance -= amount;
  users[recipientId].balance += amount;
  transactions.push({ from: senderId, to: recipientId, amount });
  res.json({ msg: 'Allowance sent' });
});

app.post('/add_mission', auth, (req, res) => {
  users[req.userId].missions.push({ title: req.body.title, completed: false });
  res.json({ msg: 'Mission added' });
});

app.post('/complete_mission', auth, (req, res) => {
  const { index } = req.body;
  const mission = users[req.userId].missions[index];
  if (mission) {
    mission.completed = true;
    users[req.userId].score += 5;
    res.json({ msg: 'Mission completed' });
  } else {
    res.status(400).json({ msg: 'Invalid mission index' });
  }
});

app.get('/get_score', auth, (req, res) => {
  res.json({ score: users[req.userId].score });
});

app.post('/set_savings_goal', auth, (req, res) => {
  users[req.userId].savingsGoal = { target: req.body.target, current: 0 };
  res.json({ msg: 'Goal set' });
});

app.post('/add_savings', auth, (req, res) => {
  const amount = req.body.amount;
  if (users[req.userId].balance < amount) return res.status(400).json({ msg: 'Insufficient funds' });
  users[req.userId].balance -= amount;
  users[req.userId].savingsGoal.current += amount;
  res.json({ msg: 'Savings updated' });
});

app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});

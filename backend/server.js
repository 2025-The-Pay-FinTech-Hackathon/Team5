const express = require('express');
const cors = require('cors');
const { readData } = require('./storage');
const { spawn } = require('child_process');
const path = require('path');

try {
  require('dotenv').config();
} catch {
  // dotenv is optional; environment variables still work without a .env file.
}

const app = express();
const PORT = process.env.PORT || 8000;

const PYTHON_EXEC =
  process.env.PYTHON_PATH ||
  path.resolve(__dirname, '..', 'ChatbotAI', 'venv', 'Scripts', 'python.exe');

const CHATBOT_SCRIPT = path.resolve(__dirname, '..', 'ChatbotAI', 'test.py');
const CHATBOT_TIMEOUT_MS = Number(process.env.CHATBOT_TIMEOUT_MS || 15000);

let chatbotWorker = null;
let chatbotBuffer = '';
let nextChatRequestId = 1;
const pendingChatRequests = new Map();

app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));

function isWorkerRunning() {
  return chatbotWorker && chatbotWorker.exitCode === null && !chatbotWorker.killed;
}

function rejectPendingChatRequests(error) {
  for (const [id, pending] of pendingChatRequests.entries()) {
    clearTimeout(pending.timeout);
    pending.reject(error);
    pendingChatRequests.delete(id);
  }
}

function handleChatbotLine(line) {
  let payload;

  try {
    payload = JSON.parse(line);
  } catch (error) {
    console.error('[ChatbotAI Parse Error]', line, error);
    return;
  }

  const id = String(payload.id ?? '');
  const pending = pendingChatRequests.get(id);

  if (!pending) {
    return;
  }

  clearTimeout(pending.timeout);
  pendingChatRequests.delete(id);
  pending.resolve(payload);
}

function handleChatbotStdout(data) {
  chatbotBuffer += data.toString('utf8');

  let newlineIndex = chatbotBuffer.indexOf('\n');
  while (newlineIndex !== -1) {
    const line = chatbotBuffer.slice(0, newlineIndex).trim();
    chatbotBuffer = chatbotBuffer.slice(newlineIndex + 1);

    if (line) {
      handleChatbotLine(line);
    }

    newlineIndex = chatbotBuffer.indexOf('\n');
  }
}

function startChatbotWorker() {
  if (isWorkerRunning()) {
    return chatbotWorker;
  }

  chatbotBuffer = '';
  chatbotWorker = spawn(PYTHON_EXEC, [CHATBOT_SCRIPT, '--worker'], {
    cwd: path.dirname(CHATBOT_SCRIPT),
    env: {
      ...process.env,
      PYTHONIOENCODING: 'utf-8',
    },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  chatbotWorker.stdout.on('data', handleChatbotStdout);

  chatbotWorker.stderr.on('data', (data) => {
    const message = data.toString('utf8').trim();
    if (message) {
      console.error('[ChatbotAI]', message);
    }
  });

  chatbotWorker.on('error', (error) => {
    console.error('[ChatbotAI Start Error]', error);
    rejectPendingChatRequests(error);
    chatbotWorker = null;
  });

  chatbotWorker.on('close', (code) => {
    if (pendingChatRequests.size > 0) {
      rejectPendingChatRequests(new Error(`Chatbot worker exited with code ${code}`));
    }
    chatbotWorker = null;
  });

  return chatbotWorker;
}

function askChatbot(message) {
  const worker = startChatbotWorker();
  const id = String(nextChatRequestId++);

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingChatRequests.delete(id);
      reject(new Error(`Chatbot timed out after ${CHATBOT_TIMEOUT_MS}ms`));

      if (isWorkerRunning()) {
        chatbotWorker.kill();
      }
    }, CHATBOT_TIMEOUT_MS);

    pendingChatRequests.set(id, { resolve, reject, timeout });

    worker.stdin.write(`${JSON.stringify({ id, message })}\n`, 'utf8', (error) => {
      if (!error) return;

      const pending = pendingChatRequests.get(id);
      if (pending) {
        clearTimeout(pending.timeout);
        pendingChatRequests.delete(id);
        pending.reject(error);
      }
    });
  });
}

function formatChatbotAnswer(result) {
  if (result.term && result.definition) {
    return `용어: ${result.term}\n정의: ${result.definition}`;
  }

  return result.answer || result.definition || result.error || '챗봇이 답변을 반환하지 않았습니다.';
}

app.get('/', (req, res) => {
  res.json({ message: 'Dondoli backend is running' });
});

app.get('/health', (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

app.get('/api/data', (req, res) => {
  res.json(readData());
});

app.post('/api/chat', async (req, res) => {
  const message = String(req.body.message || '').trim();
  const context = req.body.context || {};

  if (!message) {
    return res.status(400).json({ answer: '질문을 입력해주세요.' });
  }

  if (message.includes('잔액') || message.toLowerCase().includes('balance')) {
    return res.json({
      answer: `현재 잔액은 ${(context.balance || 0).toLocaleString()}원입니다.`,
    });
  }

  if (message.includes('포인트') || message.toLowerCase().includes('point')) {
    return res.json({
      answer: `현재 포인트는 ${(context.points || 0).toLocaleString()}점입니다.`,
    });
  }

  try {
    const result = await askChatbot(message);
    return res.json({ answer: formatChatbotAnswer(result) });
  } catch (error) {
    console.error('[ChatbotAI Error]', error);
    return res.json({
      answer: '챗봇 모델을 불러오는 중 오류가 발생했습니다.',
    });
  }
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/children', require('./routes/children'));
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/savings', require('./routes/savings'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/store', require('./routes/store'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/events', require('./routes/events'));

app.use((req, res) => {
  res.status(404).json({ error: '요청한 API를 찾을 수 없습니다.' });
});

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: '서버 오류가 발생했습니다.' });
});

app.listen(PORT, () => {
  console.log(`Dondoli backend running at http://localhost:${PORT}`);
  console.log(`[ChatbotAI] Python path: ${PYTHON_EXEC}`);
  console.log(`[ChatbotAI] Script path: ${CHATBOT_SCRIPT}`);
});

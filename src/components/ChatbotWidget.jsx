import React, { useState, useRef, useEffect } from 'react';
import './ChatbotWidget.css';

export default function ChatbotWidget({ userContext }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: '안녕하세요! 금융 챗봇입니다. 무엇이든 물어보세요.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // 스크롤 항상 아래로
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  // 특정 키워드에 대한 프론트 답변
  const getLocalAnswer = (question) => {
    if (/잔액/.test(question)) {
      return `현재 잔액은 ${userContext.balance?.toLocaleString() ?? 0}원입니다.`;
    }
    if (/포인트/.test(question)) {
      return `현재 보유 포인트는 ${userContext.points?.toLocaleString() ?? 0}점입니다.`;
    }
    if (/미션/.test(question)) {
      const count = Array.isArray(userContext.missions) ? userContext.missions.length : 0;
      return `진행한 미션 개수는 ${count}개입니다.`;
    }
    if (/퀴즈/.test(question)) {
      const count = Array.isArray(userContext.quizResults) ? userContext.quizResults.length : 0;
      return `풀었던 퀴즈 개수는 ${count}개입니다.`;
    }
    if (/저축/.test(question)) {
      const amount = Array.isArray(userContext.savings) ? userContext.savings.reduce((sum, s) => sum + (s.currentAmount || 0), 0) : 0;
      return `현재 저축액은 ${amount.toLocaleString()}원입니다.`;
    }
    if (/뱃지/.test(question)) {
      const count = userContext.badges ? Object.keys(userContext.badges).length : 0;
      return `획득한 뱃지는 총 ${count}개입니다.`;
    }
    if (/대출[\s]*상환/.test(question)) {
      if (userContext.loans && userContext.loans.length > 0) {
        const loan = userContext.loans[0];
        return `대출 상환 기한은 ${loan.dueDate ?? '미정'}이고, 남은 금액은 ${loan.remainingAmount?.toLocaleString() ?? 0}원입니다.`;
      } else {
        return '현재 상환 중인 대출이 없습니다.';
      }
    }
    if (/대출[\s]*금액/.test(question)) {
      if (userContext.loans && userContext.loans.length > 0) {
        const loan = userContext.loans[0];
        return `현재 대출 금액은 ${loan.amount?.toLocaleString() ?? 0}원입니다.`;
      } else {
        return '현재 대출 내역이 없습니다.';
      }
    }
    return null;
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    setMessages([...messages, { from: 'user', text: input }]);
    setLoading(true);
    console.log('[챗봇 질문]', input);
    // 프론트에서 즉시 답변할 수 있는 경우
    const localAnswer = getLocalAnswer(input);
    if (localAnswer) {
      setTimeout(() => {
        setMessages(msgs => [...msgs, { from: 'bot', text: localAnswer }]);
        setLoading(false);
      }, 400);
      setInput('');
      return;
    }
    try {
      const res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, context: userContext })
      });
      const data = await res.json();
      console.log('[챗봇 응답]', data);
      setMessages(msgs => [...msgs, { from: 'bot', text: data.answer }]);
    } catch (e) {
      console.error('[챗봇 에러]', e);
      setMessages(msgs => [...msgs, { from: 'bot', text: '답변을 불러오지 못했습니다.' }]);
    }
    setInput('');
    setLoading(false);
  };

  return (
    <>
      <div className="chatbot-float-btn" onClick={() => setOpen(true)}>
        <img src="/chatbot.png" alt="챗봇" className="float-robot" />
      </div>
      {open && (
        <div className="chatbot-modal">
          <div className="chatbot-header">
            <span>금융 챗봇</span>
            <button onClick={() => setOpen(false)}>X</button>
          </div>
          <div className="chatbot-body">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.from}`}>{msg.text}</div>
            ))}
            {loading && <div className="chat-msg bot">답변 생성 중...</div>}
            <div ref={chatEndRef} />
          </div>
          <div className="chatbot-footer">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="질문을 입력하세요"
              disabled={loading}
            />
            <button onClick={sendMessage} disabled={loading}>전송</button>
          </div>
        </div>
      )}
    </>
  );
} 
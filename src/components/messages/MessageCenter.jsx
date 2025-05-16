import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const MessageCenter = () => {
  const users = ['김민서', '김동규', '유아름', '임정현'];

  const [messages, setMessages] = useState({
    김민서: [],
    김동규: [],
    유아름: [],
    임정현: [],
  });

  const [favorites, setFavorites] = useState([]); // 즐겨찾기 상태
  const [newMessage, setNewMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState('김민서');
  const [search, setSearch] = useState('');

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const newMsg = {
        id: Date.now(),
        text: newMessage,
        sender: 'child',
        timestamp: new Date(),
      };

      setMessages((prev) => ({
        ...prev,
        [selectedUser]: [...prev[selectedUser], newMsg],
      }));
      setNewMessage('');
    }
  };

  const toggleFavorite = (user) => {
    setFavorites((prev) =>
      prev.includes(user) ? prev.filter((u) => u !== user) : [...prev, user]
    );
  };

 const filteredUsers = [...users]
  .filter((u) => u.includes(search))
  .sort((a, b) => {
    const aFav = favorites.includes(a);
    const bFav = favorites.includes(b);
    if (aFav === bFav) return 0;
    return aFav ? -1 : 1; // 즐겨찾기된 사용자 먼저
  });

  return (
    <div className="w-100 h-100" style={{ width: '100vw', height: '100vh', margin: 0, overflow: 'hidden', backgroundColor: '#f8f8f8' }}>
      <div className="row g-0 h-100">
        {/* Sidebar */}
        <div className="col-3 border-end bg-white d-flex flex-column shadow-sm">
          <div className="p-3 border-bottom fw-bold fs-5 text-dark">가족 채팅</div>

          {/* 개선된 검색 UI */}
          <div className="px-3 mt-2 mb-3">
            <div className="position-relative">
              <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
              <input
                type="text"
                className="form-control ps-5 rounded-pill"
                placeholder="검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <ul className="list-group list-group-flush overflow-auto">
            {filteredUsers.map((user) => (
              <li
                key={user}
                className={`list-group-item d-flex justify-content-between align-items-start list-group-item-action ${
                  selectedUser === user ? 'bg-warning-subtle fw-bold' : ''
                }`}
                onClick={() => setSelectedUser(user)}
                style={{ cursor: 'pointer' }}
              >
                <div className="me-2">
                  <div>{user}</div>
                  <small className="text-muted">
                    {messages[user]?.[messages[user].length - 1]?.text || '최근 메시지 없음'}
                  </small>
                </div>
                <i
                  className={`bi ${favorites.includes(user) ? 'bi-star-fill text-warning' : 'bi-star text-muted'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(user);
                  }}
                  style={{ fontSize: '1.2rem', cursor: 'pointer' }}
                ></i>
              </li>
            ))}
          </ul>
        </div>

        {/* Chat Window */}
        <div className="col-9 d-flex flex-column bg-light">
          <div className="border-bottom p-3 d-flex justify-content-between align-items-center bg-white shadow-sm">
            <div className="fw-bold fs-5">{selectedUser}</div>
            <div>
              <i className={`bi ${favorites.includes(selectedUser) ? 'bi-star-fill text-warning' : 'bi-star text-muted'} me-3`} onClick={() => toggleFavorite(selectedUser)} style={{ cursor: 'pointer' }}></i>
              <i className="bi bi-search text-secondary"></i>
            </div>
          </div>

          <div className="flex-grow-1 overflow-auto p-4" style={{ backgroundColor: '#fffbe9' }}>
            {messages[selectedUser]?.map((message) => (
              <div
                key={message.id}
                className={`d-flex mb-3 ${message.sender === 'parent' ? 'justify-content-start' : 'justify-content-end'}`}
              >
                <div
                  className={`px-3 py-2 rounded-4 shadow-sm ${message.sender === 'parent' ? 'bg-white' : 'bg-warning text-dark'}`}
                  style={{
                    maxWidth: '70%',
                    borderRadius: '20px',
                    wordBreak: 'break-word',
                    fontSize: '0.95rem',
                  }}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>

          <div className="border-top p-3 bg-white d-flex align-items-center shadow-sm">
            <i className="bi bi-emoji-smile fs-4 me-3 text-secondary" style={{ cursor: 'pointer' }}></i>
            <input
              type="text"
              className="form-control me-2 rounded-pill px-4"
              placeholder="메시지를 입력해 주세요."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              style={{ backgroundColor: '#f8f8f8' }}
            />
            <i className="bi bi-mic fs-4 me-3 text-secondary" style={{ cursor: 'pointer' }}></i>
            <button className="btn btn-warning rounded-circle" onClick={handleSendMessage}>
              <i className="bi bi-send-fill text-white"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageCenter;

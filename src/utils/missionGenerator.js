// src/utils/missionGenerator.js
export function generateRandomMission() {
    const types = ['출석 미션', '저축 미션', '퀴즈 미션'];
    const randomType = types[Math.floor(Math.random() * types.length)];
  
    const base = {
      id: Date.now() + Math.random(),
      progress: 0,
      status: '진행중',
      createdAt: new Date().toISOString().slice(0, 10),
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    };
  
    switch (randomType) {
      case '출석 미션':
        return { ...base, title: '오늘도 출석!', description: '앱에 접속하면 완료!', reward: 100 };
      case '저축 미션':
        return { ...base, title: '이번 주 저축!', description: '5000원 이상 저축하기', reward: 300 };
      case '퀴즈 미션':
        return { ...base, title: '퀴즈 도전!', description: '퀴즈 3문제 맞히기', reward: 200 };
      default:
        return null;
    }
  }
  
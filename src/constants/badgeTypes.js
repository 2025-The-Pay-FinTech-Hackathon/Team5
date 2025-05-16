export const BADGE_TYPES = [
  {
    key: 'saver',
    name: '저축왕',
    description: '저축 목표를 달성했을 때',
    levels: [
      { tier: 1, label: '브론즈', condition: '1회' },
      { tier: 2, label: '실버', condition: '5회' },
      { tier: 3, label: '골드', condition: '10회' },
    ],
  },
  {
    key: 'mission',
    name: '미션마스터',
    description: '미션을 완료했을 때',
    levels: [
      { tier: 1, label: '브론즈', condition: '3회' },
      { tier: 2, label: '실버', condition: '10회' },
      { tier: 3, label: '골드', condition: '20회' },
    ],
  },
  {
    key: 'quiz',
    name: '퀴즈왕',
    description: '퀴즈를 풀었을 때',
    levels: [
      { tier: 1, label: '브론즈', condition: '5회' },
      { tier: 2, label: '실버', condition: '15회' },
      { tier: 3, label: '골드', condition: '30회' },
    ],
  },
  // 필요에 따라 추가 뱃지 타입 작성
]; 
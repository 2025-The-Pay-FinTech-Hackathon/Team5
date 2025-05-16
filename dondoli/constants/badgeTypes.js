// src/constants/badgeTypes.js
export const BADGE_TYPES = [
    {
      key: 'saver',
      name: '절약왕',
      description: '전월 대비 지출 절감',
      levels: [
        { tier: 'bronze', label: '🥉 브론즈', condition: '10% 절감' },
        { tier: 'silver', label: '🥈 실버', condition: '20% 절감' },
        { tier: 'gold', label: '🥇 골드', condition: '30% 절감' },
      ],
    },
    {
      key: 'logger',
      name: '기록왕',
      description: '기입장 작성',
      levels: [
        { tier: 'bronze', label: '🥉 브론즈', condition: '7일 연속' },
        { tier: 'silver', label: '🥈 실버', condition: '15일 연속' },
        { tier: 'gold', label: '🥇 골드', condition: '30일 연속' },
      ],
    },
    {
      key: 'missioner',
      name: '미션왕',
      description: '주간 미션',
      levels: [
        { tier: 'bronze', label: '🥉 브론즈', condition: '3개 완료' },
        { tier: 'silver', label: '🥈 실버', condition: '5개 완료' },
        { tier: 'gold', label: '🥇 골드', condition: '한 달간 모두 완료' },
      ],
    },
    {
      key: 'savergoal',
      name: '저축왕',
      description: '목표 저축 달성',
      levels: [
        { tier: 'bronze', label: '🥉 브론즈', condition: '50% 달성' },
        { tier: 'silver', label: '🥈 실버', condition: '100% 달성' },
        { tier: 'gold', label: '🥇 골드', condition: '3개 이상 완료' },
      ],
    },
    {
      key: 'quizmaster',
      name: '퀴즈박사',
      description: '금융 퀴즈',
      levels: [
        { tier: 'bronze', label: '🥉 브론즈', condition: '5문제 정답' },
        { tier: 'silver', label: '🥈 실버', condition: '10문제 정답' },
        { tier: 'gold', label: '🥇 골드', condition: '20문제 + 5연속 정답' },
      ],
    },
    {
      key: 'inviter',
      name: '친구초대왕',
      description: '친구 초대 활동',
      levels: [
        { tier: 'bronze', label: '🥉 브론즈', condition: '1명 초대' },
        { tier: 'silver', label: '🥈 실버', condition: '3명 초대' },
        { tier: 'gold', label: '🥇 골드', condition: '5명 + 활동 유지' },
      ],
    },
  ];
  
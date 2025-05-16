// 최근 거래 내역 더미 함수
export const getRecentTransactions = (userId) => {
  // 실제로는 localStorage 등에서 불러오거나, 아래는 예시 데이터
  return [
    {
      id: 1,
      childName: '홍길동',
      description: '용돈 입금',
      amount: 10000,
      date: new Date().toISOString(),
      status: '완료',
    },
    {
      id: 2,
      childName: '홍길동',
      description: '저축',
      amount: -5000,
      date: new Date().toISOString(),
      status: '완료',
    },
  ];
}; 
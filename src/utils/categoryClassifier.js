const categoryKeywords = {
  식비: [
    '카페', '스타벅스', '커피', '음식', '식당', '레스토랑', '패스트푸드',
    '마트', '편의점', '슈퍼', '식료품', '과일', '채소', '육류',
  ],
  교통비: [
    '지하철', '버스', '택시', '기차', 'KTX', '고속버스', '주차',
    '주유', '기름', 'LPG', '전기차', '충전',
  ],
  주거비: [
    '월세', '전세', '관리비', '공과금', '전기', '수도', '가스',
    '인터넷', 'TV', '청소', '수리',
  ],
  통신비: [
    '휴대폰', '통신', '요금제', '데이터', '인터넷', '전화',
  ],
  의료비: [
    '병원', '약국', '의원', '치과', '한의원', '검진', '약',
  ],
  교육비: [
    '학원', '교재', '도서', '강의', '교육', '학습', '책',
  ],
  문화생활: [
    '영화', '공연', '전시', '박물관', '미술관', '운동', '헬스',
    '수영', '골프', '테니스', '여행', '호텔', '펜션',
  ],
};

export const classifyCategory = (storeName, items) => {
  // 가게 이름으로 카테고리 분류
  const storeNameLower = storeName.toLowerCase();
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => storeNameLower.includes(keyword.toLowerCase()))) {
      return category;
    }
  }

  // 품목으로 카테고리 분류
  const itemNames = items.map(item => item.name.toLowerCase());
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => 
      itemNames.some(itemName => itemName.includes(keyword.toLowerCase()))
    )) {
      return category;
    }
  }

  // 기본값
  return '기타';
}; 
# MwoniMoney - 부모-자녀 금융 교육 앱

MwoniMoney는 부모와 자녀가 함께 사용할 수 있는 금융 교육 앱입니다. 부모는 자녀의 금융 활동을 관리하고 교육할 수 있으며, 자녀는 재미있는 방식으로 금융 지식을 습득할 수 있습니다.

## 주요 기능

### 부모 기능
- 자녀 금융 관리: 자녀 계좌 연동 및 송금
- 소비 통계 확인: 자녀의 소비 내역 및 통계 조회
- 미션 및 챌린지 설정: 자녀를 위한 금융 미션 및 챌린지 생성
- 리워드 설정: 미션 성공 시 지급할 리워드 설정

### 자녀 기능
- 미션 수행: 부모가 설정한 미션 수행 및 리워드 획득
- 챌린지 참여: 금융 관련 챌린지 참여
- 퀴즈 풀기: 금융 지식 퀴즈를 통해 학습
- 보상금 관리: 획득한 리워드를 현금처럼 출금 가능

### AI 기능
- 퀴즈 해설: AI를 통해 퀴즈 해설 제공
- 미션 추천: AI를 활용한 미션 추천 기능

## 기술 스택

- 프론트엔드: React, Material-UI
- 상태 관리: React Hooks
- 라우팅: React Router
- 스타일링: Material-UI, Emotion

## 시작하기

### 필수 조건
- Node.js (v14 이상)
- npm 또는 yarn

### 설치
1. 저장소 클론
```bash
git clone https://github.com/yourusername/mwoni-prototype.git
cd mwoni-prototype
```

2. 의존성 설치
```bash
npm install
```

3. 개발 서버 실행
```bash
npm run dev
```

## 프로젝트 구조
```
src/
  ├── components/     # 재사용 가능한 컴포넌트
  ├── pages/         # 페이지 컴포넌트
  ├── store/         # 상태 관리
  ├── utils/         # 유틸리티 함수
  ├── hooks/         # 커스텀 훅
  ├── assets/        # 이미지, 폰트 등
  ├── styles/        # 전역 스타일
  └── services/      # API 서비스
```

## 기여하기
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 라이선스
이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

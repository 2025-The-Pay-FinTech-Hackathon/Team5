import React from 'react';
import { Outlet } from 'react-router-dom';
import ChildNavigation from '../components/ChildNavigation';
import NotificationCenter from '../components/notifications/NotificationCenter';
import ChatbotWidget from '../components/ChatbotWidget';
import { findChildById } from '../utils/localData';

const ChildLayout = ({ user, onLogout }) => {
  // 항상 최신 자녀 정보 불러오기
  const child = findChildById(user?.id);
  return (
    <>
      <ChildNavigation user={user} onLogout={onLogout} />
      <NotificationCenter />
      <Outlet />
      {/* 오른쪽 하단 챗봇 위젯 */}
      <ChatbotWidget userContext={{
        name: child?.name,
        points: child?.points,
        balance: child?.balance,
        loans: child?.loans,
        loanRequests: child?.loanRequests,
        missions: child?.missions,
        quizResults: child?.quizResults,
        savings: child?.savings,
        badges: child?.badges
      }} />
    </>
  );
};

export default ChildLayout; 
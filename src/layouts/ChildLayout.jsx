import React from 'react';
import { Outlet } from 'react-router-dom';
import ChildNavigation from '../components/ChildNavigation';
import ChatbotWidget from '../components/ChatbotWidget';
import { findChildById, findUserById } from '../utils/localData';

const ChildLayout = ({ user, onLogout }) => {
  // 항상 최신 자녀 정보 불러오기
  const child = findChildById(user?.id);
  const parent = findUserById(child?.parentId || user?.parentId);
  return (
    <>
      <ChildNavigation user={user} onLogout={onLogout} />
      <Outlet />
      {/* 오른쪽 하단 챗봇 위젯 */}
      <ChatbotWidget userContext={{
        name: child?.name,
        parentName: parent?.name,
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

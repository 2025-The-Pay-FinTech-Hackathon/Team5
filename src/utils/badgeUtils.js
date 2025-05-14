// src/utils/badgeUtils.js

import { updateChild } from './localData';

export function checkAndUpdateBadges(child) {
  if (!child) return;

  const updated = { ...child };
  const newBadges = { ...updated.badges };

  // 절약왕 계산 예시 (이전 달 지출과 비교 필요)
  const ledgers = child.ledgers || [];

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  let lastMonthSpend = 0;
  let thisMonthSpend = 0;

  ledgers.forEach(entry => {
    const entryDate = new Date(entry.date);
    if (entryDate.getFullYear() === lastMonthYear && entryDate.getMonth() === lastMonth) {
      lastMonthSpend += entry.amount;
    }
    if (entryDate.getFullYear() === currentYear && entryDate.getMonth() === currentMonth) {
      thisMonthSpend += entry.amount;
    }
  });

  if (lastMonthSpend > 0) {
    const reduction = ((lastMonthSpend - thisMonthSpend) / lastMonthSpend) * 100;
    if (reduction >= 30) newBadges.saver = 'gold';
    else if (reduction >= 20) newBadges.saver = 'silver';
    else if (reduction >= 10) newBadges.saver = 'bronze';
  }

  // (여기에 나중에 퀴즈, 미션, 저축 등도 추가 가능)

  updated.badges = newBadges;
  updateChild(updated);
}

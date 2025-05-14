import { updateChild } from './localData';

/** ✅ 미션왕 뱃지 계산 함수 */
export function getMissionKingBadge(missions = []) {
  const now = new Date();

  const isThisWeek = (dateString) => {
    const date = new Date(dateString);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return date >= startOfWeek && date <= endOfWeek;
  };

  const hasCompletedEveryWeekOfMonth = () => {
    const weeks = [0, 1, 2, 3];
    return weeks.every(weekOffset => {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() - weekOffset * 7);
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      return missions.some(m => {
        if (m.status !== '완료') return false;
        const d = new Date(m.completedAt);
        return d >= startOfWeek && d <= endOfWeek;
      });
    });
  };

  const thisWeekCompleted = missions.filter(m =>
    m.status === '완료' && isThisWeek(m.completedAt)
  );

  if (hasCompletedEveryWeekOfMonth()) return 'gold';
  if (thisWeekCompleted.length >= 5) return 'silver';
  if (thisWeekCompleted.length >= 3) return 'bronze';
  return null;
}

/** ✅ 모든 뱃지 점검 및 반영 함수 */
export function checkAndUpdateBadges(child) {
  if (!child) return;

  const updated = { ...child };
  const newBadges = { ...updated.badges };

  const now = new Date();

  // ✅ 1. 절약왕
  const ledgers = updated.ledgers || [];
  let lastMonthSpend = 0;
  let thisMonthSpend = 0;

  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  ledgers.forEach(entry => {
    const date = new Date(entry.date);
    if (date.getFullYear() === lastMonthYear && date.getMonth() === lastMonth) {
      lastMonthSpend += entry.amount;
    } else if (date.getFullYear() === currentYear && date.getMonth() === currentMonth) {
      thisMonthSpend += entry.amount;
    }
  });

  if (lastMonthSpend > 0) {
    const reduction = ((lastMonthSpend - thisMonthSpend) / lastMonthSpend) * 100;
    if (reduction >= 30) newBadges.saver = 'gold';
    else if (reduction >= 20) newBadges.saver = 'silver';
    else if (reduction >= 10) newBadges.saver = 'bronze';
  }

  // ✅ 2. 기록왕
  const ledgerDates = new Set(ledgers.map(l => l.date));
  let streak = 0;
  const current = new Date();
  current.setHours(0, 0, 0, 0);

  while (ledgerDates.has(current.toISOString().slice(0, 10))) {
    streak++;
    current.setDate(current.getDate() - 1);
  }

  if (streak >= 30) newBadges.logger = 'gold';
  else if (streak >= 15) newBadges.logger = 'silver';
  else if (streak >= 7) newBadges.logger = 'bronze';

  // ✅ 3. 미션왕
  const missionBadge = getMissionKingBadge(updated.missions || []);
  if (missionBadge) newBadges.missioner = missionBadge;

  // ✅ 4. 저축왕
  const savings = updated.savings || [];
  const bronze = savings.some(s => s.currentAmount >= s.targetAmount * 0.5);
  const silver = savings.some(s => s.currentAmount >= s.targetAmount);
  const gold = savings.filter(s => s.currentAmount >= s.targetAmount).length >= 3;

  if (gold) newBadges.saverPlus = 'gold';
  else if (silver) newBadges.saverPlus = 'silver';
  else if (bronze) newBadges.saverPlus = 'bronze';

  // ✅ 5. 퀴즈박사
  const quizzes = updated.quizzes || [];
  const totalCorrect = quizzes.filter(q => q.isCorrect).length;

  let quizStreak = 0;
  for (let i = quizzes.length - 1; i >= 0; i--) {
    if (quizzes[i].isCorrect) {
      quizStreak++;
    } else {
      break;
    }
  }

  if (totalCorrect >= 20 && quizStreak >= 5) newBadges.quizMaster = 'gold';
  else if (totalCorrect >= 10) newBadges.quizMaster = 'silver';
  else if (totalCorrect >= 5) newBadges.quizMaster = 'bronze';

  // 🔄 저장
  updated.badges = newBadges;
  updateChild(updated);
}

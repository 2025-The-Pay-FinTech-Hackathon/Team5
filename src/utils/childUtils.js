import { findChildById } from './localData';

export const getChildStats = (userId) => {
  const child = findChildById(userId);

  if (!child) {
    return {
      savingsGoal: 0,
      currentSavings: 0,
      completedMissions: 0,
      totalMissions: 0,
    };
  }

  const savings = child.savings || [];
  const missions = child.missions || [];

  return {
    savingsGoal: savings.reduce((sum, goal) => sum + Number(goal.targetAmount || 0), 0),
    currentSavings: savings.reduce((sum, goal) => sum + Number(goal.currentAmount || 0), 0),
    completedMissions: missions.filter((mission) => mission.status === '완료' || mission.status === '?꾨즺').length,
    totalMissions: missions.length,
  };
};

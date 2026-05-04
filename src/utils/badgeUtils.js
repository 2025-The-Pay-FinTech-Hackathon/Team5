import { updateChild } from './localData';

const BADGE_THRESHOLDS = {
  saver: [1, 5, 10],
  mission: [3, 10, 20],
  quiz: [5, 15, 30],
};

const legacyTierMap = {
  bronze: 1,
  silver: 2,
  gold: 3,
};

function normalizeTier(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    return legacyTierMap[value] || Number(value) || 0;
  }
  return 0;
}

function tierFromCount(count, thresholds) {
  if (count >= thresholds[2]) return 3;
  if (count >= thresholds[1]) return 2;
  if (count >= thresholds[0]) return 1;
  return 0;
}

function keepHighestTier(nextBadges, key, earnedTier, aliases = []) {
  const previousTier = Math.max(
    normalizeTier(nextBadges[key]),
    ...aliases.map(alias => normalizeTier(nextBadges[alias]))
  );
  const nextTier = Math.max(previousTier, earnedTier);

  if (nextTier > 0) {
    nextBadges[key] = nextTier;
  }
}

export function calculateBadges(child) {
  if (!child) return {};

  const nextBadges = { ...(child.badges || {}) };
  const savings = child.savings || [];
  const missions = child.missions || [];
  const quizResults = child.quizResults || [];

  const achievedSavingsCount = savings.filter(goal => {
    const targetAmount = Number(goal.targetAmount || 0);
    return targetAmount > 0 && (
      goal.achievedAt || Number(goal.currentAmount || 0) >= targetAmount
    );
  }).length;
  const completedMissionCount = missions.filter(mission => mission.status === '완료').length;
  const completedQuizCount = quizResults.length;

  keepHighestTier(
    nextBadges,
    'saver',
    tierFromCount(achievedSavingsCount, BADGE_THRESHOLDS.saver),
    ['saverPlus']
  );
  keepHighestTier(
    nextBadges,
    'mission',
    tierFromCount(completedMissionCount, BADGE_THRESHOLDS.mission),
    ['missioner']
  );
  keepHighestTier(
    nextBadges,
    'quiz',
    tierFromCount(completedQuizCount, BADGE_THRESHOLDS.quiz),
    ['quizMaster']
  );

  return nextBadges;
}

export function getMissionKingBadge(missions = []) {
  return tierFromCount(
    missions.filter(mission => mission.status === '완료').length,
    BADGE_THRESHOLDS.mission
  );
}

export function checkAndUpdateBadges(child) {
  if (!child) return child;

  const updated = {
    ...child,
    badges: calculateBadges(child),
  };

  updateChild(updated);
  return updated;
}

const { addNotificationToData, toId } = require('./storage');

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function byId(items, getId = (item) => item.id) {
  return new Map(asArray(items).map((item) => [toId(getId(item)), item]));
}

function add(result, data, userId, notification) {
  const saved = addNotificationToData(data, userId, notification);
  if (saved) {
    result.push({ userId: toId(userId), notification: saved });
  }
}

function isCompletedGoal(goal) {
  return goal?.status === '완료' || Number(goal?.currentAmount || 0) >= Number(goal?.targetAmount || 0);
}

function collectChildUpdateNotifications(data, previousChild, nextChild) {
  const notifications = [];
  const childId = toId(nextChild.id);
  const parentId = toId(nextChild.parentId);
  const childName = nextChild.name || '자녀';

  if (!previousChild) {
    return notifications;
  }

  const previousMissions = byId(previousChild.missions);
  asArray(nextChild.missions).forEach((mission) => {
    const missionId = toId(mission.id);
    const previousMission = previousMissions.get(missionId);

    if (!previousMission) {
      add(notifications, data, childId, {
        type: 'mission',
        title: '새 미션이 도착했어요',
        message: `${mission.title || '미션'} 미션이 추가되었습니다.`,
        dedupeKey: `mission-created:${childId}:${missionId}`,
        data: { childId, missionId },
      });
      return;
    }

    if (previousMission.status === mission.status) return;

    if (mission.status === '승인대기' && parentId) {
      add(notifications, data, parentId, {
        type: 'mission',
        title: '미션 완료 요청',
        message: `${childName}님이 ${mission.title || '미션'} 완료 승인을 요청했습니다.`,
        dedupeKey: `mission-approval-request:${childId}:${missionId}`,
        data: { childId, childName, missionId },
      });
    }

    if (mission.status === '완료') {
      add(notifications, data, childId, {
        type: 'mission',
        title: '미션이 승인되었어요',
        message: `${mission.title || '미션'} 완료가 승인되어 ${Number(mission.reward || 0).toLocaleString()}포인트를 받았습니다.`,
        dedupeKey: `mission-approved:${childId}:${missionId}`,
        data: { childId, missionId },
      });
    }

    if (mission.status === '거부') {
      add(notifications, data, childId, {
        type: 'mission',
        title: '미션이 거부되었어요',
        message: `${mission.title || '미션'} 완료 요청이 거부되었습니다. 다시 도전해 보세요.`,
        dedupeKey: `mission-rejected:${childId}:${missionId}`,
        data: { childId, missionId },
      });
    }
  });

  const previousLoanRequests = byId(previousChild.loanRequests);
  const nextLoanRequests = byId(nextChild.loanRequests);
  asArray(nextChild.loanRequests).forEach((request) => {
    const requestId = toId(request.id);

    if (!previousLoanRequests.has(requestId) && parentId) {
      add(notifications, data, parentId, {
        type: 'loan',
        title: '대출 요청이 도착했어요',
        message: `${childName}님이 ${Number(request.amount || 0).toLocaleString()}원 대출을 요청했습니다.`,
        dedupeKey: `loan-request:${childId}:${requestId}`,
        data: { childId, childName, requestId },
      });
    }
  });

  const nextLoans = byId(nextChild.loans);
  const approvedLoanIds = new Set();
  const previousLoans = byId(previousChild.loans);
  asArray(nextChild.loans).forEach((loan) => {
    const loanId = toId(loan.id);
    const previousLoan = previousLoans.get(loanId);

    if (!previousLoan && loan.status === 'active') {
      approvedLoanIds.add(loanId);
      add(notifications, data, childId, {
        type: 'loan',
        title: '대출이 승인되었어요',
        message: `${Number(loan.amount || 0).toLocaleString()}원이 입금되었습니다.`,
        dedupeKey: `loan-approved:${childId}:${loanId}`,
        data: { childId, loanId },
      });
    }

    if (previousLoan && previousLoan.status !== 'repaid' && loan.status === 'repaid') {
      add(notifications, data, parentId, {
        type: 'loan',
        title: '대출 상환 완료',
        message: `${childName}님이 대출을 상환했습니다.`,
        dedupeKey: `loan-repaid-parent:${childId}:${loanId}`,
        data: { childId, childName, loanId },
      });
      add(notifications, data, childId, {
        type: 'loan',
        title: '대출 상환 완료',
        message: '대출 상환 처리가 완료되었습니다.',
        dedupeKey: `loan-repaid-child:${childId}:${loanId}`,
        data: { childId, loanId },
      });
    }

    if (previousLoan && previousLoan.status === 'active' && loan.status === 'active' && parentId) {
      const previousRemaining = Number(previousLoan.repayAmount ?? previousLoan.amount ?? 0);
      const nextRemaining = Number(loan.repayAmount ?? loan.amount ?? 0);
      const paidAmount = previousRemaining - nextRemaining;

      if (paidAmount > 0) {
        add(notifications, data, parentId, {
          type: 'loan',
          title: '대출 일부 상환',
          message: `${childName}님이 ${paidAmount.toLocaleString()}원을 상환했습니다.`,
          dedupeKey: `loan-partial-parent:${childId}:${loanId}:${previousRemaining}:${nextRemaining}`,
          data: { childId, childName, loanId },
        });
      }
    }
  });

  previousLoanRequests.forEach((request, requestId) => {
    if (nextLoanRequests.has(requestId) || nextLoans.has(requestId) || approvedLoanIds.has(requestId)) return;

    add(notifications, data, childId, {
      type: 'loan',
      title: '대출 요청이 거절되었어요',
      message: `${Number(request.amount || 0).toLocaleString()}원 대출 요청이 거절되었습니다.`,
      dedupeKey: `loan-rejected:${childId}:${requestId}`,
      data: { childId, requestId },
    });
  });

  const previousPurchases = byId(previousChild.purchases, (purchase) => purchase.purchaseId || purchase.id);
  asArray(nextChild.purchases).forEach((purchase) => {
    const purchaseId = toId(purchase.purchaseId || purchase.id);
    const previousPurchase = previousPurchases.get(purchaseId);

    if (!previousPurchase && purchase.status === '승인대기' && parentId) {
      add(notifications, data, parentId, {
        type: 'store_approval',
        title: '보상 구매 승인 요청',
        message: `${childName}님이 ${purchase.name || '보상'} 구매를 요청했습니다.`,
        action: { type: 'approveStorePurchase' },
        actionStatus: 'pending',
        dedupeKey: `store-approval:${childId}:${purchaseId}`,
        data: {
          childId,
          childName,
          purchaseId,
          itemName: purchase.name,
          points: purchase.points,
          cashAmount: purchase.cashAmount || 0,
        },
      });
      return;
    }

    if (previousPurchase && previousPurchase.status !== purchase.status && purchase.status === '승인완료') {
      add(notifications, data, childId, {
        type: 'store',
        title: '보상 구매가 승인되었어요',
        message: `${purchase.name || '보상'} 구매가 승인되었습니다.`,
        dedupeKey: `store-approved:${childId}:${purchaseId}`,
        data: { childId, purchaseId },
      });
    }
  });

  const previousGoals = byId(previousChild.savings);
  asArray(nextChild.savings).forEach((goal) => {
    const goalId = toId(goal.id);
    const previousGoal = previousGoals.get(goalId);

    if (!previousGoal && parentId) {
      add(notifications, data, parentId, {
        type: 'savings',
        title: '새 저축 목표',
        message: `${childName}님이 ${goal.title || '저축 목표'} 목표를 만들었습니다.`,
        dedupeKey: `savings-created:${childId}:${goalId}`,
        data: { childId, childName, goalId },
      });
      return;
    }

    if (previousGoal && !isCompletedGoal(previousGoal) && isCompletedGoal(goal)) {
      add(notifications, data, childId, {
        type: 'savings',
        title: '저축 목표 달성',
        message: `${goal.title || '저축 목표'} 목표를 달성했습니다.`,
        dedupeKey: `savings-completed-child:${childId}:${goalId}`,
        data: { childId, goalId },
      });
      add(notifications, data, parentId, {
        type: 'savings',
        title: '저축 목표 달성',
        message: `${childName}님이 ${goal.title || '저축 목표'} 목표를 달성했습니다.`,
        dedupeKey: `savings-completed-parent:${childId}:${goalId}`,
        data: { childId, childName, goalId },
      });
    }
  });

  const previousWishlist = byId(previousChild.wishlist);
  asArray(nextChild.wishlist).forEach((item) => {
    const itemId = toId(item.id);

    if (!previousWishlist.has(itemId) && parentId) {
      add(notifications, data, parentId, {
        type: 'wishlist',
        title: '위시리스트 추가',
        message: `${childName}님이 ${item.name || '새 항목'}을 위시리스트에 추가했습니다.`,
        dedupeKey: `wishlist-created:${childId}:${itemId}`,
        data: { childId, childName, itemId },
      });
    }
  });

  const previousLedgers = byId(previousChild.ledgers);
  asArray(nextChild.ledgers).forEach((ledger) => {
    const ledgerId = toId(ledger.id);
    const isExpense = ledger.type !== '입금' && ledger.category;

    if (!previousLedgers.has(ledgerId) && isExpense && parentId) {
      add(notifications, data, parentId, {
        type: 'ledger',
        title: '새 지출 기록',
        message: `${childName}님이 ${Number(ledger.amount || 0).toLocaleString()}원 지출을 기록했습니다.`,
        dedupeKey: `ledger-created:${childId}:${ledgerId}`,
        data: { childId, childName, ledgerId },
      });
    }
  });

  const previousQuizResults = byId(previousChild.quizResults);
  asArray(nextChild.quizResults).forEach((quizResult) => {
    const quizId = toId(quizResult.id);

    if (!previousQuizResults.has(quizId) && parentId) {
      add(notifications, data, parentId, {
        type: 'quiz',
        title: '퀴즈 완료',
        message: `${childName}님이 퀴즈를 완료해 ${Number(quizResult.score || 0).toLocaleString()}포인트를 받았습니다.`,
        dedupeKey: `quiz-completed:${childId}:${quizId}`,
        data: { childId, childName, quizId },
      });
    }
  });

  return notifications;
}

module.exports = {
  collectChildUpdateNotifications,
};

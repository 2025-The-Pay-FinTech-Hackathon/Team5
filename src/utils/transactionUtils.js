import { findChildById, getChildrenByParent } from './localData';

export const getRecentTransactions = (userId) => {
  const child = findChildById(userId);
  const children = child ? [child] : getChildrenByParent(userId);

  return children
    .flatMap((item) => (item.ledgers || []).map((ledger) => ({
      id: ledger.id || `${item.id}-${ledger.date}-${ledger.amount}`,
      childName: item.name,
      description: ledger.memo || ledger.type || '거래',
      amount: ledger.type === '입금' || ledger.type === '?낃툑'
        ? Number(ledger.amount || 0)
        : -Math.abs(Number(ledger.amount || 0)),
      date: ledger.date || new Date().toISOString(),
      status: ledger.status || '완료',
    })))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);
};

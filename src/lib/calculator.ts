import { Expense, SimpleDebt, UserProfile } from '../types';

export function calculateBalances(expenses: Expense[], members: UserProfile[]): SimpleDebt[] {
  // Store debts as a map: creditorId -> debtorId -> amount
  const debtMap: Record<string, Record<string, number>> = {};

  // Initialize
  members.forEach(m => { debtMap[m.id] = {}; });

  expenses.forEach(expense => {
    const splitUserIds = Object.keys(expense.splits);
    const splitCount = splitUserIds.length;
    if (splitCount === 0) return;

    splitUserIds.forEach(userId => {
      if (userId === expense.payerId) return; // Don't owe yourself

      let amountOwed = 0;
      if (expense.splitType === 'equal') {
        amountOwed = expense.amount / splitCount;
      } else if (expense.splitType === 'percentage') {
        amountOwed = (expense.amount * (expense.splits[userId] as number)) / 100;
      } else if (expense.splitType === 'shares') {
        const totalShares = Object.values(expense.splits).reduce((a, b) => (a as number) + (b as number), 0) as number;
        amountOwed = (expense.amount * (expense.splits[userId] as number)) / (totalShares || 1);
      }

      if (amountOwed > 0.01) {
        debtMap[expense.payerId][userId] = (debtMap[expense.payerId][userId] || 0) + amountOwed;
      }
    });
  });

  // Now, for every pair (A, B), if A owes B 100 and B owes A 50, simplify to A owes B 50
  const finalDebts: SimpleDebt[] = [];
  const processedPairs = new Set<string>();

  members.forEach(m1 => {
    members.forEach(m2 => {
      if (m1.id === m2.id) return;
      const pairKey = [m1.id, m2.id].sort().join('-');
      if (processedPairs.has(pairKey)) return;
      processedPairs.add(pairKey);

      const m1OwesM2 = debtMap[m2.id][m1.id] || 0;
      const m2OwesM1 = debtMap[m1.id][m2.id] || 0;

      if (m1OwesM2 > m2OwesM1) {
        finalDebts.push({ from: m1.id, to: m2.id, amount: m1OwesM2 - m2OwesM1 });
      } else if (m2OwesM1 > m1OwesM2) {
        finalDebts.push({ from: m2.id, to: m1.id, amount: m2OwesM1 - m1OwesM2 });
      }
    });
  });

  return finalDebts;
}

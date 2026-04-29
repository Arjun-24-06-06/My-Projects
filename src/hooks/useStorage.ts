import { useState, useEffect } from 'react';
import { Group, Expense, UserProfile } from '../types';
import { generateInviteCode } from '../lib/utils';

// Mock initial data
const MOCK_USER: UserProfile = {
  id: 'user-1',
  displayName: '',
};

export function useStorage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [expenses, setExpenses] = useState<Record<string, Expense[]>>({});
  const [currentUser] = useState<UserProfile>(MOCK_USER);

  useEffect(() => {
    const savedGroups = localStorage.getItem('splitpro_groups');
    const savedExpenses = localStorage.getItem('splitpro_expenses');
    if (savedGroups) setGroups(JSON.parse(savedGroups));
    if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
  }, []);

  const createGroup = (name: string, currency: string = '₹') => {
    const newGroup: Group = {
      id: crypto.randomUUID(),
      name,
      currency,
      ownerId: currentUser.id,
      memberIds: [currentUser.id],
      members: [currentUser],
      createdAt: Date.now(),
      inviteCode: generateInviteCode(),
    };
    setGroups(prev => {
      const updated = [...prev, newGroup];
      localStorage.setItem('splitpro_groups', JSON.stringify(updated));
      return updated;
    });
    return newGroup;
  };

  const addMemberToGroup = (groupId: string, member: UserProfile) => {
    setGroups(prev => {
      const updated = prev.map(g => {
        if (g.id === groupId && !g.memberIds.includes(member.id)) {
          return {
            ...g,
            memberIds: [...g.memberIds, member.id],
            members: [...g.members, member],
          };
        }
        return g;
      });
      localStorage.setItem('splitpro_groups', JSON.stringify(updated));
      return updated;
    });
  };

  const addExpense = (groupId: string, expenseData: Omit<Expense, 'id' | 'createdAt' | 'groupId'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: crypto.randomUUID(),
      groupId,
      createdAt: Date.now(),
    };
    setExpenses(prev => {
      const groupExpenses = prev[groupId] || [];
      const updated = {
        ...prev,
        [groupId]: [...groupExpenses, newExpense],
      };
      localStorage.setItem('splitpro_expenses', JSON.stringify(updated));
      return updated;
    });
    return newExpense;
  };

  const deleteExpense = (groupId: string, expenseId: string) => {
    setExpenses(prev => {
      const groupExpenses = prev[groupId] || [];
      const updated = {
        ...prev,
        [groupId]: groupExpenses.filter(e => e.id !== expenseId),
      };
      localStorage.setItem('splitpro_expenses', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteGroup = (groupId: string) => {
    setGroups(prev => {
      const updated = prev.filter(g => g.id !== groupId);
      localStorage.setItem('splitpro_groups', JSON.stringify(updated));
      return updated;
    });
    setExpenses(prev => {
      const updated = { ...prev };
      delete updated[groupId];
      localStorage.setItem('splitpro_expenses', JSON.stringify(updated));
      return updated;
    });
  };

  const updateExpense = (groupId: string, expenseId: string, data: Partial<Expense>) => {
    setExpenses(prev => {
      const groupExpenses = prev[groupId] || [];
      const updatedExpenses = groupExpenses.map(e => 
        e.id === expenseId ? { ...e, ...data } : e
      );
      const updated = {
        ...prev,
        [groupId]: updatedExpenses,
      };
      localStorage.setItem('splitpro_expenses', JSON.stringify(updated));
      return updated;
    });
  };

  const updateMemberName = (groupId: string, memberId: string, newName: string) => {
    setGroups(prev => {
      const updated = prev.map(g => {
        if (g.id === groupId) {
          return {
            ...g,
            members: g.members.map(m => m.id === memberId ? { ...m, displayName: newName } : m)
          };
        }
        return g;
      });
      localStorage.setItem('splitpro_groups', JSON.stringify(updated));
      return updated;
    });
  };

  const joinGroupByCode = (code: string) => {
    const group = groups.find(g => g.inviteCode.toUpperCase() === code.toUpperCase());
    if (!group) throw new Error('Invalid invite code');
    
    if (!group.memberIds.includes(currentUser.id)) {
      addMemberToGroup(group.id, currentUser);
    }
    return group;
  };

  return {
    currentUser,
    groups,
    expenses,
    createGroup,
    addMemberToGroup,
    joinGroupByCode,
    addExpense,
    updateExpense,
    updateMemberName,
    deleteExpense,
    deleteGroup,
  };
}

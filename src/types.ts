export interface UserProfile {
  id: string;
  displayName: string;
  email?: string;
  photoURL?: string;
}

export interface Group {
  id: string;
  name: string;
  currency: string;
  ownerId: string;
  memberIds: string[];
  members: UserProfile[];
  createdAt: number;
  inviteCode: string;
}

export type SplitType = 'equal' | 'percentage' | 'shares';

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  payerId: string;
  date: number;
  splitType: SplitType;
  splits: Record<string, number>; // userId -> value based on splitType
  createdAt: number;
}

export interface SimpleDebt {
  from: string;
  to: string;
  amount: number;
}

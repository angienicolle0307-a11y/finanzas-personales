export interface Movement {
  id: string;
  userId?: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  isoDate?: string;
  dayOfMonth?: number;
  icon: string;
  type: 'EXPENSE' | 'INCOME';
  paymentMethod?: string;
  observations?: string;
  createdAtMs?: number;
}

export type Expense = Movement;

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  monthlyBudget: number;
  hasCompletedOnboarding: boolean;
}

export interface BudgetSummary {
  monthlyBudget: number;
  totalSpent: number;
  availableBalance: number;
  spentPercentage: number;
}

export interface DailyExpense {
  day: number;
  amount: number;
}

export type View = 'DASHBOARD' | 'MOVEMENTS' | 'DETAIL' | 'ADD_EXPENSE' | 'ADD_INCOME';

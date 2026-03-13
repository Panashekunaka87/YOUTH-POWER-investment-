export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  balance: number;
  role: 'user' | 'admin';
  referralCode: string;
  referredBy?: string;
  withdrawalCode?: string;
  createdAt: string;
}

export interface Deposit {
  id: string;
  uid: string;
  amount: number;
  method: 'ecocash' | 'visa';
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
  proofUrl?: string;
}

export interface Withdrawal {
  id: string;
  uid: string;
  amount: number;
  method: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
}

export interface Investment {
  id: string;
  uid: string;
  amount: number;
  dailyReturn: number;
  startDate: string;
  lastClaimDate: string;
}

export interface Task {
  id: string;
  title: string;
  reward: number;
  adUrl: string;
  duration: number;
}

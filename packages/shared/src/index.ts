// Enums
export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  CLIENT = 'CLIENT',
}

export enum LoanStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DISBURSED = 'DISBURSED',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  DEFAULTED = 'DEFAULTED',
  REJECTED = 'REJECTED',
}

export enum ChitStatus {
  UPCOMING = 'UPCOMING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  UPI = 'UPI',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHEQUE = 'CHEQUE',
}

export enum InstallmentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  PARTIAL = 'PARTIAL',
  WAIVED = 'WAIVED',
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  userId: string;
  role: UserRole;
  email: string;
}

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

// Customer types
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  aadhaarNo?: string;
  panNo?: string;
  occupation?: string;
  monthlyIncome?: number;
  isActive: boolean;
  honestyScore?: number;
  honestyCategory?: string;
  createdAt: string;
}

// Loan types
export interface Loan {
  id: string;
  customerId: string;
  customer?: Customer;
  principalAmount: number;
  interestRate: number;
  tenure: number;
  emi: number;
  disbursedAmount?: number;
  status: LoanStatus;
  startDate?: string;
  endDate?: string;
  totalPaid: number;
  totalDue: number;
  createdAt: string;
}

export interface LoanInstallment {
  id: string;
  loanId: string;
  installmentNo: number;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: InstallmentStatus;
  paidDate?: string;
}

// Chit types
export interface Chit {
  id: string;
  name: string;
  totalValue: number;
  monthlyContribution: number;
  duration: number;
  status: ChitStatus;
  startDate?: string;
  memberCount: number;
  createdAt: string;
}

// Payment types
export interface Payment {
  id: string;
  customerId: string;
  amount: number;
  method: PaymentMethod;
  referenceNo?: string;
  notes?: string;
  paymentDate: string;
  createdAt: string;
}

// Dashboard types
export interface DashboardSummary {
  totalCustomers: number;
  activeLoans: number;
  activeChits: number;
  totalDisbursed: number;
  totalCollected: number;
  overdueAmount: number;
  overdueCount: number;
  collectionRate: number;
}

// Honesty Score
export interface HonestyScore {
  score: number;
  category: string;
  onTimePayments: number;
  latePayments: number;
  missedPayments: number;
  bonus: number;
}

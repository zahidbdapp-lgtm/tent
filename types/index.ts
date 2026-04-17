

export type UserRole = "landlord" | "admin";
export type SubscriptionStatus = "demo" | "active" | "payment_pending" | "payment_due" | "banned";
export type SubscriptionPlan = "monthly" | "yearly" | "2year";

export interface User {
  id: string;
  email: string;
  displayName: string;
  phone: string;
  role: UserRole;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPlan: SubscriptionPlan | null;
  subscriptionStartDate: string | null;
  subscriptionExpiry: string | null;
  // Payment info for registration
  paymentMethod: PaymentMethod | null;
  paymentNumber: string | null;
  paymentTransactionId: string | null;
  paymentAmount: number | null;
  paymentDate: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PropertyType = "apartment" | "house" | "commercial";

export interface Property {
  id: string;
  ownerId: string;
  name: string;
  address: string;
  totalUnits: number;
  propertyType: PropertyType;
  createdAt: string;
  updatedAt: string;
}

export type TenantStatus = "active" | "inactive" | "pending";

export interface Tenant {
  id: string;
  propertyId: string;
  ownerId: string;
  unitNumber: string;
  name: string;
  email: string;
  phone: string;
  nid: string;
  nidFrontUrl: string;
  nidBackUrl: string;
  photoUrl: string;
  agreementDocUrl: string;
  monthlyRent: number;
  gasCharge: number;
  waterCharge: number;
  serviceCharge: number;
  electricityBill: number;
  currentBill: number;
  advanceAmount: number;
  advanceMonths: number;
  moveInDate: string;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = "paid" | "partial" | "unpaid" | "overdue";

export interface Invoice {
  id: string;
  tenantId: string;
  propertyId: string;
  ownerId: string;
  tenantName: string;
  tenantEmail: string;
  unitNumber: string;
  month: string;
  rent: number;
  gasCharge: number;
  waterCharge: number;
  serviceCharge: number;
  electricityBill: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  dueDate: string;
  status: InvoiceStatus;
  paymentDate: string | null;
  paymentMethod: string | null;
  receiptUrl: string | null;
  emailSent: boolean;
  emailSentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type NoticePriority = "low" | "medium" | "high";

export interface Notice {
  id: string;
  propertyId: string;
  ownerId: string;
  title: string;
  content: string;
  priority: NoticePriority;
  createdAt: string;
  expiresAt: string;
}

export type TicketCategory = "maintenance" | "complaint" | "inquiry" | "other";
export type TicketStatus = "open" | "in-progress" | "resolved" | "closed";

export interface Ticket {
  id: string;
  tenantId: string;
  tenantName: string;
  propertyId: string;
  ownerId: string;
  subject: string;
  description: string;
  category: TicketCategory;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
}

// Payment Request Types
export type PaymentMethod = "bkash" | "nagad" | "rocket";
export type PaymentRequestStatus = "pending" | "approved" | "rejected";

export interface PaymentRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  plan: SubscriptionPlan;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionId: string;
  paymentNumber: string;
  paymentDate: string;
  screenshotUrl: string;
  status: PaymentRequestStatus;
  createdAt: string;
  processedAt: string | null;
  processedBy: string | null;
  rejectionReason: string | null;
}

// Expense Types
export type ExpenseCategory = "service" | "maintenance" | "utility" | "tax" | "other";

export interface Expense {
  id: string;
  ownerId: string;
  propertyId: string;
  propertyName: string;
  unitNumber: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  createdAt: string;
  updatedAt: string;
}

// Form types for creating/updating
export interface PropertyFormData {
  name: string;
  address: string;
  totalUnits: number;
  propertyType: PropertyType;
}

export interface TenantFormData {
  propertyId: string;
  unitNumber: string;
  name: string;
  email: string;
  phone: string;
  nid: string;
  nidFrontUrl: string;
  nidBackUrl: string;
  photoUrl: string;
  monthlyRent: number;
  gasCharge: number;
  waterCharge: number;
  serviceCharge: number;
  currentBill: number;
  advanceAmount: number;
  advanceMonths: number;
  moveInDate: Date;
  status: TenantStatus;
}

export interface InvoiceFormData {
  tenantId: string;
  month: string;
  rent: number;
  gasCharge: number;
  waterCharge: number;
  serviceCharge: number;
  dueDate: Date;
}

export interface NoticeFormData {
  propertyId: string;
  title: string;
  content: string;
  priority: NoticePriority;
  expiresAt: Date;
}

export interface TicketFormData {
  tenantId: string;
  subject: string;
  description: string;
  category: TicketCategory;
}

export interface ExpenseFormData {
  propertyId: string;
  unitNumber: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: Date;
}

export interface PaymentRequestFormData {
  plan: SubscriptionPlan;
  paymentMethod: PaymentMethod;
  transactionId: string;
  screenshotUrl: string;
}

// Dashboard stats
export interface DashboardStats {
  totalProperties: number;
  totalTenants: number;
  totalRevenue: number;
  pendingPayments: number;
  openTickets: number;
  overdueInvoices: number;
}

// Admin Dashboard stats
export interface AdminDashboardStats {
  totalUsers: number;
  paidUsers: number;
  demoUsers: number;
  pendingPayments: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

// Pricing plans
export const PRICING_PLANS = {
  monthly: {
    name: "Monthly",
    nameBn: "মাসিক",
    price: 75,
    duration: 1,
    durationUnit: "month" as const,
  },
  yearly: {
    name: "Yearly",
    nameBn: "বার্ষিক",
    price: 500,
    duration: 12,
    durationUnit: "month" as const,
    discount: "58%",
  },
  "2year": {
    name: "2 Years",
    nameBn: "২ বছর",
    price: 900,
    duration: 24,
    durationUnit: "month" as const,
    discount: "50%",
  },
} as const;

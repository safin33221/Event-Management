export type UserRole = 'OWNER' | 'COORDINATOR' | 'ACCOUNTANT' | 'STAFF';

export type AdvancePolicyType = 'NONE' | 'PERCENTAGE' | 'FIXED';

export type InquiryStatus = 'NEW' | 'QUALIFIED' | 'QUOTED' | 'CONVERTED' | 'CLOSED';
export type QuoteStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'SUPERSEDED' | 'EXPIRED' | 'CANCELLED';
export type QuoteVersionStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'SUPERSEDED';
export type AcceptanceChannel = 'PORTAL' | 'PHONE' | 'IN_PERSON' | 'EMAIL' | 'WHATSAPP';
export type BookingStatus = 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type SessionStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
export type ResourceType = 'CREW' | 'EQUIPMENT' | 'ROOM' | 'OTHER';
export type PaymentType = 'RECEIPT' | 'REFUND';
export type PaymentMethod = 'BKASH' | 'NAGAD' | 'BANK' | 'CASH' | 'OTHER';
export type VerificationState = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type AdjustmentType = 'CREDIT_NOTE' | 'REVERSAL' | 'CHARGE_ADJUSTMENT';
export type AssignmentStatus = 'ASSIGNED' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED';
export type DeliverableStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'IN_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'APPROVED'
  | 'DELIVERED';

export interface ThemeTokens {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
}

export interface ContactDetails {
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
}

export interface PublicBranding {
  displayName: string;
  logoUrl: string | null;
  themeTokens: ThemeTokens;
  contactDetails: ContactDetails;
  timezone: string;
  currency: string;
}

export interface StudioSettings extends PublicBranding {
  advancePolicyType: AdvancePolicyType;
  advancePolicyValue: number;
  updatedAt: string;
}

export interface AuthUserSession {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  studioName: string;
  timezone: string;
  currency: string;
}

export interface EventType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
}

export interface ServiceItem {
  id: string;
  name: string;
  description: string | null;
  unitLabel: string;
  defaultUnitPricePoisha: number;
  isActive: boolean;
}

export interface PackageItem {
  id: string;
  serviceItemId: string | null;
  description: string;
  quantity: number;
  unitPricePoisha: number;
}

export interface StudioPackage {
  id: string;
  eventTypeId: string | null;
  name: string;
  slug: string;
  description: string | null;
  basePricePoisha: number;
  isActive: boolean;
  isPublished: boolean;
  items?: PackageItem[];
}

export interface PortfolioItem {
  id: string;
  eventTypeId: string | null;
  title: string;
  description: string | null;
  mediaUrl: string;
  sortOrder: number;
  isApproved?: boolean;
  isPublished?: boolean;
}

export interface Inquiry {
  id: string;
  reference: string;
  eventTypeId: string | null;
  packageId: string | null;
  eventTitle: string;
  requestedDate: string | null;
  clientName: string;
  clientPhone: string;
  clientEmail: string | null;
  notes: string | null;
  metadata?: Record<string, unknown> | null;
  source: string;
  status: InquiryStatus;
  createdAt: string;
}

export interface QuoteLineItem {
  id: string;
  packageId: string | null;
  serviceItemId: string | null;
  description: string;
  quantity: number;
  unitPricePoisha: number;
  lineTotalPoisha: number;
  sortOrder: number;
}

export interface QuoteVersion {
  id: string;
  quoteId: string;
  versionNumber: number;
  subtotalPoisha: number;
  discountPoisha: number;
  totalPoisha: number;
  terms: string | null;
  validUntil: string | null;
  status: QuoteVersionStatus;
  acceptedAt: string | null;
  acceptedBy: string | null;
  acceptedChannel: AcceptanceChannel | null;
  createdAt: string;
  items?: QuoteLineItem[];
}

export interface Quote {
  id: string;
  inquiryId: string | null;
  reference: string;
  eventTypeId: string | null;
  eventTitle: string;
  requestedDate: string | null;
  clientName: string;
  clientPhone: string;
  clientEmail: string | null;
  currency: string;
  status: QuoteStatus;
  currentVersionId: string | null;
  createdAt: string;
  versions?: QuoteVersion[];
  currentVersion?: QuoteVersion;
}

export interface BookingLedgerSummary {
  bookingId: string;
  currency: string;
  agreedTotalPoisha: number;
  approvedCreditNotesPoisha: number;
  effectiveAgreedChargePoisha: number;
  verifiedReceiptsPoisha: number;
  pendingReceiptsPoisha: number;
  completedRefundsPoisha: number;
  outstandingDuePoisha: number;
  customerCreditPoisha: number;
}

export interface PaymentEntry {
  id: string;
  bookingId: string;
  type: PaymentType;
  method: PaymentMethod;
  amountPoisha: number;
  currency: string;
  transactionRef: string | null;
  verificationState: VerificationState;
  idempotencyKey: string | null;
  recordedById: string;
  verifiedById: string | null;
  verifiedAt: string | null;
  reason: string | null;
  createdAt: string;
}

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  userId: string | null;
  isActive: boolean;
}

export interface EventSession {
  id: string;
  bookingId: string;
  title: string;
  startAt: string;
  endAt: string;
  location: string | null;
  status: SessionStatus;
  notes: string | null;
  agencyLocalDate?: string;
  booking?: {
    id: string;
    reference: string;
    eventTitle: string;
    clientName: string;
    status: BookingStatus;
  };
  reservations?: Array<{
    id: string;
    resourceId: string;
    startAt: string;
    endAt: string;
    resource?: { id: string; name: string; type: ResourceType };
  }>;
}

export interface Assignment {
  id: string;
  bookingId: string;
  sessionId: string | null;
  assigneeUserId: string;
  roleLabel: string;
  notes: string | null;
  status: AssignmentStatus;
  createdAt: string;
  booking?: {
    id: string;
    reference: string;
    eventTitle: string;
    eventDate: string | null;
    clientName: string;
    clientPhone: string;
    status: BookingStatus;
  };
  session?: {
    id: string;
    title: string;
    startAt: string;
    endAt: string;
    location: string | null;
    status: SessionStatus;
  } | null;
}

export interface Deliverable {
  id: string;
  bookingId: string;
  label: string;
  assigneeUserId: string | null;
  dueAt: string | null;
  reviewStatus: DeliverableStatus;
  deliveredAt: string | null;
  deliveryUrl: string | null;
  notes: string | null;
}

export interface Booking {
  id: string;
  reference: string;
  quoteId: string;
  acceptedQuoteVersionId: string;
  eventTypeId: string | null;
  eventTitle: string;
  eventDate: string | null;
  clientName: string;
  clientPhone: string;
  clientEmail: string | null;
  currency: string;
  agreedTotalPoisha: number;
  status: BookingStatus;
  confirmedAt: string | null;
  version: number;
  createdAt: string;
  ledger?: BookingLedgerSummary;
  sessions?: EventSession[];
  deliverables?: Deliverable[];
  assignments?: Assignment[];
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

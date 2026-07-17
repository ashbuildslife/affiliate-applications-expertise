export type ApplicationStatus = "new" | "reviewing" | "approved" | "needs_info" | "rejected" | "paused";

export type PartnerChannel = "content" | "paid_search" | "influencer" | "newsletter" | "coupon" | "b2b";

export type FraudSeverity = "low" | "medium" | "high";

export type ComplianceCheckStatus = "verified" | "needs_evidence" | "missing";
export type DisclosurePlacement = "with_endorsement" | "below_fold" | "behind_more_link" | "missing";
export type DisclosureLanguageMatch = "matched" | "needs_translation" | "unknown";
export type LiveDisclosureCadence = "repeated_periodically" | "opening_only" | "not_applicable" | "missing";
export type TestimonialAuthenticityStatus = "verified" | "needs_evidence" | "synthetic_persona_blocked";
export type EndorserMonitoringReadiness = "documented" | "needs_plan" | "missing";
export type ReviewIncentivePolicy = "neutral" | "sentiment_conditioned" | "not_used" | "unknown";

export interface ComplianceReview {
  affiliateDisclosure: ComplianceCheckStatus;
  aiContentLabeling: ComplianceCheckStatus;
  claimSubstantiation: ComplianceCheckStatus;
  testimonialAuthenticity?: TestimonialAuthenticityStatus;
  testimonialExperienceEvidence?: string[];
  endorserMonitoringReadiness?: EndorserMonitoringReadiness;
  endorserMonitoringEvidence?: string[];
  reviewIncentivePolicy?: ReviewIncentivePolicy;
  reviewIncentiveEvidence?: string[];
  disclosurePlacement: DisclosurePlacement;
  disclosureLanguage: string;
  endorsementLanguage: string;
  disclosureLanguageMatch: DisclosureLanguageMatch;
  liveDisclosureCadence?: LiveDisclosureCadence;
  liveDisclosureEvidence?: string;
  evidenceRequested: string[];
  lastCheckedAt: string;
  reviewerNote: string;
}

export interface AffiliateApplication {
  id: string;
  companyName: string;
  contactName: string;
  channel: PartnerChannel;
  status: ApplicationStatus;
  country: string;
  audienceSize: number;
  monthlyTraffic: number;
  verticalFitScore: number;
  qualityScore: number;
  fraudRiskScore: number;
  expectedMonthlyRevenue: number;
  requestedCommissionRate: number;
  approvedCommissionRate?: number;
  submittedAt: string;
  reviewer: string;
  notes: string;
  evidence: string[];
  riskFlags: string[];
  complianceReview?: ComplianceReview;
}

export interface ProgramTier {
  id: string;
  name: string;
  commissionRate: number;
  minQualityScore: number;
  minMonthlyRevenue: number;
  cookieWindowDays: number;
  payoutHoldDays: number;
  partnerCount: number;
  complianceRule: string;
}

export interface FraudSignal {
  id: string;
  applicationId: string;
  label: string;
  severity: FraudSeverity;
  confidence: number;
  description: string;
  recommendedAction: string;
  /** How the signal was resolved, or undefined if still under investigation */
  resolution?: string;
  /** ISO timestamp when the resolution was recorded */
  resolvedAt?: string;
}

export interface PayoutRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  protectsAgainst: string;
  active: boolean;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  actor: string;
  type: "ai_review" | "manual_review" | "compliance" | "payout" | "approval";
  message: string;
}

export interface ProgramAnalytics {
  applicationVolume: number;
  approvalRate: number;
  medianReviewHours: number;
  projectedMonthlyRevenue: number;
  flaggedApplications: number;
  payoutExposure: number;
  activePartners: number;
  autoReviewCoverage: number;
}

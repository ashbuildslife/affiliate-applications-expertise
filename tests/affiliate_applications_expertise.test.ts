import { describe, expect, it } from "vitest";
import { demoActivity, demoAnalytics, demoApplications, demoFraudSignals, demoPayoutRules, demoTiers } from "../src/lib/demo-data";

const statuses = new Set(["new", "reviewing", "approved", "needs_info", "rejected", "paused"]);
const channels = new Set(["content", "paid_search", "influencer", "newsletter", "coupon", "b2b"]);

describe("affiliate applications expertise demo data", () => {
  it("contains a realistic review queue", () => {
    expect(demoApplications.length).toBeGreaterThanOrEqual(8);
    expect(demoApplications.length).toBeLessThanOrEqual(15);
  });

  it("uses supported application statuses", () => {
    expect(demoApplications.every((application) => statuses.has(application.status))).toBe(true);
  });

  it("uses supported affiliate channels", () => {
    expect(demoApplications.every((application) => channels.has(application.channel))).toBe(true);
  });

  it("keeps score fields in a valid range", () => {
    for (const application of demoApplications) {
      expect(application.verticalFitScore).toBeGreaterThanOrEqual(0);
      expect(application.verticalFitScore).toBeLessThanOrEqual(100);
      expect(application.qualityScore).toBeGreaterThanOrEqual(0);
      expect(application.qualityScore).toBeLessThanOrEqual(100);
      expect(application.fraudRiskScore).toBeGreaterThanOrEqual(0);
      expect(application.fraudRiskScore).toBeLessThanOrEqual(100);
    }
  });

  it("includes both approved and blocked applications", () => {
    expect(demoApplications.some((application) => application.status === "approved")).toBe(true);
    expect(demoApplications.some((application) => ["rejected", "paused"].includes(application.status))).toBe(true);
  });

  it("does not approve applications with high fraud risk", () => {
    const approvedHighRisk = demoApplications.filter((application) => application.status === "approved" && application.fraudRiskScore > 40);
    expect(approvedHighRisk).toHaveLength(0);
  });

  it("gives approved applications an approved commission rate", () => {
    const approved = demoApplications.filter((application) => application.status === "approved");
    expect(approved.every((application) => typeof application.approvedCommissionRate === "number")).toBe(true);
  });

  it("links every fraud signal to an existing application", () => {
    const ids = new Set(demoApplications.map((application) => application.id));
    expect(demoFraudSignals.every((signal) => ids.has(signal.applicationId))).toBe(true);
  });

  it("flags AI-assisted affiliate content for disclosure review before approval", () => {
    const aiContentApplication = demoApplications.find((application) => application.companyName === "AutoCompare Guides");
    expect(aiContentApplication?.status).toBe("needs_info");
    expect(aiContentApplication?.riskFlags).toEqual(expect.arrayContaining(["Missing affiliate disclosure", "AI content labeling review"]));
    expect(demoFraudSignals.some((signal) => signal.applicationId === aiContentApplication?.id && signal.label.includes("AI content"))).toBe(true);
  });

  it("resolves every high-severity fraud signal", () => {
    const highSignals = demoFraudSignals.filter((signal) => signal.severity === "high");
    expect(highSignals.length).toBeGreaterThan(0);
    expect(highSignals.every((signal) => typeof signal.resolution === "string" && signal.resolution.length > 20)).toBe(true);
    expect(highSignals.every((signal) => typeof signal.resolvedAt === "string")).toBe(true);
  });

  it("leaves signals under active investigation unresolved", () => {
    const unresolved = demoFraudSignals.filter((signal) => !signal.resolution);
    expect(unresolved.length).toBeGreaterThan(0);
    expect(unresolved.every((signal) => signal.resolvedAt === undefined)).toBe(true);
  });

  it("links every resolved fraud signal to its parent application", () => {
    const resolvedSignals = demoFraudSignals.filter((signal) => signal.resolution);
    const ids = new Set(demoApplications.map((application) => application.id));
    expect(resolvedSignals.every((signal) => ids.has(signal.applicationId))).toBe(true);
  });

  it("contains high confidence fraud recommendations", () => {
    expect(demoFraudSignals.some((signal) => signal.severity === "high" && signal.confidence >= 85)).toBe(true);
  });

  it("defines commission tiers with compliance rules", () => {
    expect(demoTiers.length).toBeGreaterThanOrEqual(3);
    expect(demoTiers.every((tier) => tier.commissionRate > 0 && tier.complianceRule.length > 20)).toBe(true);
  });

  it("keeps payout rules actionable", () => {
    expect(demoPayoutRules.length).toBeGreaterThanOrEqual(5);
    expect(demoPayoutRules.every((rule) => rule.condition.length > 10 && rule.action.length > 10)).toBe(true);
  });

  it("models a program with meaningful revenue and active partners", () => {
    expect(demoAnalytics.projectedMonthlyRevenue).toBeGreaterThan(100000);
    expect(demoAnalytics.activePartners).toBeGreaterThan(100);
  });

  it("includes an activity trail across automated and manual actions", () => {
    const types = new Set(demoActivity.map((event) => event.type));
    expect(types.has("ai_review")).toBe(true);
    expect(types.has("manual_review")).toBe(true);
    expect(types.has("payout")).toBe(true);
  });
});

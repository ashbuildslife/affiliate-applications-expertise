import { describe, expect, it } from "vitest";
import { demoActivity, demoAnalytics, demoApplications, demoFraudSignals, demoPayoutRules, demoTiers } from "../src/lib/demo-data";

const statuses = new Set(["new", "reviewing", "approved", "needs_info", "rejected", "paused"]);
const channels = new Set(["content", "paid_search", "influencer", "newsletter", "coupon", "b2b"]);
const liveDisclosureCadences = new Set(["repeated_periodically", "opening_only", "not_applicable", "missing"]);
const disclosureLanguageMatches = new Set(["matched", "needs_translation", "unknown"]);
const testimonialAuthenticityStatuses = new Set(["verified", "needs_evidence", "synthetic_persona_blocked"]);
const endorserMonitoringReadinesses = new Set(["documented", "needs_plan", "missing"]);
const reviewIncentivePolicies = new Set(["neutral", "sentiment_conditioned", "not_used", "unknown"]);

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

  it("requires structured evidence before approving AI-assisted comparison content", () => {
    const flaggedApplications = demoApplications.filter((application) =>
      application.riskFlags.some((flag) => flag.includes("AI content") || flag.includes("affiliate disclosure")),
    );

    expect(flaggedApplications.length).toBeGreaterThan(0);

    for (const application of flaggedApplications) {
      expect(application.status).not.toBe("approved");
      expect(application.complianceReview).toBeDefined();
      expect(application.complianceReview?.affiliateDisclosure).not.toBe("verified");
      expect(application.complianceReview?.evidenceRequested.length).toBeGreaterThanOrEqual(2);
      expect(Number.isNaN(Date.parse(application.complianceReview?.lastCheckedAt ?? ""))).toBe(false);
    }
  });

  it("captures claim substantiation as part of disclosure compliance review", () => {
    const aiContentApplication = demoApplications.find((application) => application.companyName === "AutoCompare Guides");

    expect(aiContentApplication?.complianceReview?.claimSubstantiation).toBe("needs_evidence");
    expect(aiContentApplication?.complianceReview?.evidenceRequested).toEqual(
      expect.arrayContaining(["Source documentation for product ranking claims"]),
    );
    expect(aiContentApplication?.complianceReview?.reviewerNote).toMatch(/substantiation/i);
  });

  it("holds testimonial claims until endorser identity and first-hand experience are verified", () => {
    const testimonialReviews = demoApplications.filter(
      (application) => application.complianceReview?.testimonialAuthenticity,
    );

    expect(testimonialReviews.length).toBeGreaterThan(0);

    for (const application of testimonialReviews) {
      const review = application.complianceReview;
      const requestedEvidence = [
        ...(review?.evidenceRequested ?? []),
        ...(review?.testimonialExperienceEvidence ?? []),
      ].join(" ");

      expect(testimonialAuthenticityStatuses.has(review?.testimonialAuthenticity ?? "")).toBe(true);
      expect(application.riskFlags).toEqual(expect.arrayContaining([expect.stringMatching(/testimonial/i)]));
      expect(requestedEvidence).toMatch(/identity|product-access|purchase|first-hand|product experience/i);
      expect(review?.testimonialExperienceEvidence?.length ?? 0).toBeGreaterThanOrEqual(2);

      if (review?.testimonialAuthenticity !== "verified") {
        expect(application.status).not.toBe("approved");
        expect(review?.reviewerNote).toMatch(/reviewer|first-hand|experience/i);
      }
    }
  });

  it("keeps sentiment-conditioned review incentives out of approval", () => {
    const reviewedApplications = demoApplications.filter(
      (application) => application.complianceReview?.reviewIncentivePolicy,
    );
    const sentimentConditionedApplications = reviewedApplications.filter(
      (application) => application.complianceReview?.reviewIncentivePolicy === "sentiment_conditioned",
    );

    expect(reviewedApplications.length).toBeGreaterThan(0);
    expect(
      reviewedApplications.every((application) =>
        reviewIncentivePolicies.has(application.complianceReview?.reviewIncentivePolicy ?? ""),
      ),
    ).toBe(true);
    expect(sentimentConditionedApplications.length).toBeGreaterThan(0);

    for (const application of sentimentConditionedApplications) {
      expect(application.status).not.toBe("approved");
      expect(application.riskFlags).toEqual(expect.arrayContaining([expect.stringMatching(/incentive|sentiment/i)]));
      expect(application.complianceReview?.reviewIncentiveEvidence?.join(" ")).toMatch(/bonus|rating|sentiment/i);
      expect(application.complianceReview?.evidenceRequested).toEqual(
        expect.arrayContaining([expect.stringMatching(/independent|neutral|sentiment/i)]),
      );
    }
  });

  it("keeps applications without an endorser monitoring plan out of approval", () => {
    const monitoringReviews = demoApplications.filter(
      (application) => application.complianceReview?.endorserMonitoringReadiness,
    );
    const unresolvedMonitoringReviews = monitoringReviews.filter(
      (application) => application.complianceReview?.endorserMonitoringReadiness !== "documented",
    );

    expect(monitoringReviews.length).toBeGreaterThanOrEqual(2);
    expect(
      monitoringReviews.every((application) =>
        endorserMonitoringReadinesses.has(application.complianceReview?.endorserMonitoringReadiness ?? ""),
      ),
    ).toBe(true);
    expect(unresolvedMonitoringReviews.length).toBeGreaterThan(0);

    for (const application of unresolvedMonitoringReviews) {
      expect(application.status).not.toBe("approved");
      expect(application.riskFlags).toEqual(expect.arrayContaining([expect.stringMatching(/monitor/i)]));
      expect(application.complianceReview?.evidenceRequested).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/training|approved-claims/i),
          expect.stringMatching(/monitoring|caption|transcript/i),
          expect.stringMatching(/correction|escalation/i),
        ]),
      );
    }
  });

  it("documents training, periodic monitoring, and corrective-action controls", () => {
    const documentedMonitoringReviews = demoApplications.filter(
      (application) => application.complianceReview?.endorserMonitoringReadiness === "documented",
    );

    expect(documentedMonitoringReviews.length).toBeGreaterThan(0);

    for (const application of documentedMonitoringReviews) {
      const evidence = application.complianceReview?.endorserMonitoringEvidence?.join(" ") ?? "";
      expect(evidence).toMatch(/training|approved-claims|guidance/i);
      expect(evidence).toMatch(/monitor|review|search/i);
      expect(evidence).toMatch(/correction|escalation|action/i);
    }
  });

  it("captures hard-to-miss disclosure placement evidence", () => {
    const reviewedApplications = demoApplications.filter((application) => application.complianceReview);

    expect(reviewedApplications.length).toBeGreaterThan(0);

    for (const application of reviewedApplications) {
      expect(application.complianceReview?.disclosureLanguage.length).toBeGreaterThan(30);
      expect(application.complianceReview?.evidenceRequested.some((item) => /disclosure|caption|transcript|placement|partnership/i.test(item))).toBe(true);
    }
  });

  it("requires repeated live disclosure cadence before approving livestream endorsements", () => {
    const liveReviewedApplications = demoApplications.filter((application) =>
      application.complianceReview?.liveDisclosureCadence && application.complianceReview.liveDisclosureCadence !== "not_applicable",
    );

    expect(liveReviewedApplications.length).toBeGreaterThan(0);

    for (const application of liveReviewedApplications) {
      expect(liveDisclosureCadences.has(application.complianceReview?.liveDisclosureCadence ?? "")).toBe(true);
      expect(application.complianceReview?.liveDisclosureEvidence?.length ?? 0).toBeGreaterThan(40);

      if (application.complianceReview?.liveDisclosureCadence !== "repeated_periodically") {
        expect(application.status).not.toBe("approved");
        expect(application.complianceReview?.evidenceRequested.some((item) => /livestream|live stream|transcript|timestamp|overlay/i.test(item))).toBe(true);
      }
    }
  });

  it("keeps hidden or below-fold disclosure placements out of approval", () => {
    const weakDisclosureApplications = demoApplications.filter((application) =>
      ["below_fold", "behind_more_link", "missing"].includes(application.complianceReview?.disclosurePlacement ?? ""),
    );

    expect(weakDisclosureApplications.length).toBeGreaterThan(0);
    expect(weakDisclosureApplications.every((application) => application.status !== "approved")).toBe(true);
  });

  it("blocks disclosures hidden behind caption expansion until pre-expansion evidence is captured", () => {
    const hiddenCaptionApplications = demoApplications.filter(
      (application) => application.complianceReview?.disclosurePlacement === "behind_more_link",
    );

    expect(hiddenCaptionApplications.length).toBeGreaterThan(0);

    for (const application of hiddenCaptionApplications) {
      expect(application.status).not.toBe("approved");
      expect(application.complianceReview?.evidenceRequested).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/pre-expansion|caption|visibility/i),
          expect.stringMatching(/expanded caption|more/i),
        ]),
      );
      expect(application.complianceReview?.reviewerNote).toMatch(/caption|spoken|endorsement/i);
    }
  });

  it("treats platform paid partnership labels as supporting rather than standalone disclosure evidence", () => {
    const platformLabelReviews = demoApplications.filter((application) =>
      application.complianceReview?.evidenceRequested.some((item) => /paid partnership label/i.test(item)),
    );
    const labelOnlyApplication = demoApplications.find((application) => application.companyName === "TagOnly Creators");

    expect(platformLabelReviews.length).toBeGreaterThan(0);
    expect(labelOnlyApplication?.status).toBe("needs_info");
    expect(labelOnlyApplication?.complianceReview?.affiliateDisclosure).toBe("needs_evidence");
    expect(labelOnlyApplication?.riskFlags).toEqual(
      expect.arrayContaining(["Platform label only disclosure", "Missing affiliate disclosure"]),
    );
    expect(labelOnlyApplication?.complianceReview?.reviewerNote).toMatch(/platform label evidence alone/i);

    for (const application of platformLabelReviews) {
      const requestedEvidence = application.complianceReview?.evidenceRequested.join(" ") ?? "";
      expect(requestedEvidence).toMatch(/caption|transcript|spoken|overlay|disclosure/i);
    }
  });

  it("requires disclosure language to match the endorsement before approval", () => {
    const reviewedApplications = demoApplications.filter((application) => application.complianceReview);
    const unresolvedLanguageReviews = reviewedApplications.filter(
      (application) => application.complianceReview?.disclosureLanguageMatch !== "matched",
    );
    const translationNeededApplications = reviewedApplications.filter(
      (application) => application.complianceReview?.disclosureLanguageMatch === "needs_translation",
    );

    expect(reviewedApplications.every((application) => disclosureLanguageMatches.has(application.complianceReview?.disclosureLanguageMatch ?? ""))).toBe(true);
    expect(unresolvedLanguageReviews.length).toBeGreaterThan(0);
    expect(unresolvedLanguageReviews.every((application) => application.status !== "approved")).toBe(true);
    expect(translationNeededApplications.length).toBeGreaterThan(0);

    for (const application of translationNeededApplications) {
      expect(application.riskFlags).toEqual(expect.arrayContaining([expect.stringMatching(/language|translation/i)]));
      expect(application.complianceReview?.endorsementLanguage.length).toBeGreaterThan(5);
      expect(application.complianceReview?.evidenceRequested).toEqual(
        expect.arrayContaining([expect.stringMatching(/translation|language/i)]),
      );
      expect(application.complianceReview?.reviewerNote).toMatch(/same language|endorsement/i);
    }
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

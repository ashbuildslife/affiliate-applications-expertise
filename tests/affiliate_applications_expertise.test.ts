import { describe, expect, it } from "vitest";
import { demoActivity, demoAnalytics, demoApplications, demoFraudSignals, demoPayoutRules, demoTiers } from "../src/lib/demo-data";

const statuses = new Set(["new", "reviewing", "approved", "needs_info", "rejected", "paused"]);
const channels = new Set(["content", "paid_search", "influencer", "newsletter", "coupon", "b2b"]);
const liveDisclosureCadences = new Set(["repeated_periodically", "opening_only", "not_applicable", "missing"]);
const disclosureLanguageMatches = new Set(["matched", "needs_translation", "unknown"]);
const testimonialAuthenticityStatuses = new Set(["verified", "needs_evidence", "synthetic_persona_blocked"]);
const endorserMonitoringReadinesses = new Set(["documented", "needs_plan", "missing"]);
const reviewIncentivePolicies = new Set(["neutral", "sentiment_conditioned", "not_used", "unknown"]);
const reviewSuppressionPolicies = new Set(["content_neutral", "rating_filtered", "threats_or_intimidation", "unknown"]);
const insiderReviewDisclosureStatuses = new Set(["disclosed", "undisclosed", "not_applicable", "unknown"]);
const reviewSiteIndependenceStatuses = new Set(["independent", "controlled_disclosed", "controlled_misrepresented", "unknown"]);
const socialInfluenceIndicatorStatuses = new Set(["verified_authentic", "needs_evidence", "fake_or_hijacked"]);
const subpublisherTransparencyStatuses = new Set(["full_roster", "shared_ids_only", "undisclosed", "not_applicable"]);
const reviewRepurposingStatuses = new Set(["matched_to_product", "repurposed_across_products", "needs_evidence", "not_applicable"]);
const disclosureSpecificityStatuses = new Set(["specific", "vague_or_ambiguous", "unknown"]);
const disclosureExposureAssessments = new Set(["low", "elevated", "needs_assessment"]);
const earningsClaimReviewStatuses = new Set(["substantiated", "unsubstantiated", "typical_results_omitted", "not_applicable"]);
const syntheticEndorserReviewStatuses = new Set(["authorized_and_disclosed", "permission_missing", "misrepresented_as_human", "not_applicable"]);
const publishedContentStatuses = new Set(["matches_approved", "drift_detected", "not_reviewed"]);

describe("affiliate applications expertise demo data", () => {
  it("contains a realistic review queue", () => {
    expect(demoApplications.length).toBeGreaterThanOrEqual(8);
    expect(demoApplications.length).toBeLessThanOrEqual(16);
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

  it("keeps rating-filtered review programs out of approval", () => {
    const suppressionReviews = demoApplications.filter(
      (application) => application.complianceReview?.reviewSuppressionPolicy,
    );
    const unresolvedSuppressionReviews = suppressionReviews.filter(
      (application) => application.complianceReview?.reviewSuppressionPolicy !== "content_neutral",
    );

    expect(suppressionReviews.length).toBeGreaterThan(0);
    expect(
      suppressionReviews.every((application) =>
        reviewSuppressionPolicies.has(application.complianceReview?.reviewSuppressionPolicy ?? ""),
      ),
    ).toBe(true);
    expect(unresolvedSuppressionReviews.length).toBeGreaterThan(0);

    for (const application of unresolvedSuppressionReviews) {
      expect(application.status).not.toBe("approved");
      expect(application.riskFlags).toEqual(
        expect.arrayContaining([expect.stringMatching(/suppression|review moderation/i)]),
      );
      expect(application.complianceReview?.reviewSuppressionEvidence?.join(" ")).toMatch(
        /rating|negative|publish|moderation/i,
      );
      expect(application.complianceReview?.evidenceRequested).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/content-neutral|equally|moderation/i),
          expect.stringMatching(/unfiltered|published|removed/i),
        ]),
      );
    }
  });

  it("keeps undisclosed insider reviews out of approval", () => {
    const insiderReviews = demoApplications.filter(
      (application) => application.complianceReview?.insiderReviewDisclosure,
    );
    const unresolvedInsiderReviews = insiderReviews.filter((application) =>
      ["undisclosed", "unknown"].includes(application.complianceReview?.insiderReviewDisclosure ?? ""),
    );

    expect(insiderReviews.length).toBeGreaterThan(0);
    expect(
      insiderReviews.every((application) =>
        insiderReviewDisclosureStatuses.has(application.complianceReview?.insiderReviewDisclosure ?? ""),
      ),
    ).toBe(true);
    expect(unresolvedInsiderReviews.length).toBeGreaterThan(0);

    for (const application of unresolvedInsiderReviews) {
      expect(application.status).not.toBe("approved");
      expect(application.riskFlags).toEqual(
        expect.arrayContaining([expect.stringMatching(/insider|employee|relationship/i)]),
      );
      expect(application.complianceReview?.insiderReviewEvidence?.join(" ")).toMatch(
        /employee|manager|staff|relationship/i,
      );
      expect(application.complianceReview?.evidenceRequested).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/insider relationship|connection disclosure/i),
          expect.stringMatching(/officer|manager|employee|agent|relative/i),
        ]),
      );
    }
  });

  it("keeps company-controlled review sites that claim independence out of approval", () => {
    const independenceReviews = demoApplications.filter(
      (application) => application.complianceReview?.reviewSiteIndependence,
    );
    const unresolvedIndependenceReviews = independenceReviews.filter((application) =>
      ["controlled_misrepresented", "unknown"].includes(
        application.complianceReview?.reviewSiteIndependence ?? "",
      ),
    );

    expect(independenceReviews.length).toBeGreaterThan(0);
    expect(
      independenceReviews.every((application) =>
        reviewSiteIndependenceStatuses.has(application.complianceReview?.reviewSiteIndependence ?? ""),
      ),
    ).toBe(true);
    expect(unresolvedIndependenceReviews.length).toBeGreaterThan(0);

    for (const application of unresolvedIndependenceReviews) {
      expect(application.status).not.toBe("approved");
      expect(application.riskFlags).toEqual(
        expect.arrayContaining([expect.stringMatching(/review site|independence|company-controlled/i)]),
      );
      expect(application.complianceReview?.reviewSiteOwnershipEvidence?.join(" ")).toMatch(
        /owner|ownership|control|corporate|brand/i,
      );
      expect(application.complianceReview?.evidenceRequested).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/ownership|control map/i),
          expect.stringMatching(/ownership disclosure|separation evidence|independence/i),
        ]),
      );
      expect(application.complianceReview?.reviewerNote).toMatch(/ownership|independence/i);
    }
  });

  it("keeps undisclosed subpublisher traffic out of approval", () => {
    const transparencyReviews = demoApplications.filter(
      (application) => application.complianceReview?.subpublisherTransparency,
    );
    const unresolvedTransparencyReviews = transparencyReviews.filter((application) =>
      ["shared_ids_only", "undisclosed"].includes(
        application.complianceReview?.subpublisherTransparency ?? "",
      ),
    );

    expect(transparencyReviews.length).toBeGreaterThan(0);
    expect(
      transparencyReviews.every((application) =>
        subpublisherTransparencyStatuses.has(application.complianceReview?.subpublisherTransparency ?? ""),
      ),
    ).toBe(true);
    expect(unresolvedTransparencyReviews.length).toBeGreaterThan(0);

    for (const application of unresolvedTransparencyReviews) {
      expect(application.status).not.toBe("approved");
      expect(application.riskFlags).toEqual(
        expect.arrayContaining([expect.stringMatching(/subpublisher|sub-affiliate|publisher transparency/i)]),
      );
      expect(application.complianceReview?.subpublisherEvidence?.join(" ")).toMatch(
        /subpublisher|publisher ID|referring publisher/i,
      );
      expect(application.complianceReview?.evidenceRequested).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/roster|stable ID|publisher URL/i),
          expect.stringMatching(/click|conversion|attribution/i),
          expect.stringMatching(/owner|removal|prohibited/i),
        ]),
      );
      expect(application.complianceReview?.reviewerNote).toMatch(/publisher-level|subpublisher|transparency/i);
    }
  });

  it("keeps reviews repurposed across substantially different products out of approval", () => {
    const repurposingReviews = demoApplications.filter(
      (application) => application.complianceReview?.reviewRepurposing,
    );
    const unresolvedRepurposing = repurposingReviews.filter((application) =>
      ["repurposed_across_products", "needs_evidence"].includes(
        application.complianceReview?.reviewRepurposing ?? "",
      ),
    );

    expect(repurposingReviews.length).toBeGreaterThan(0);
    expect(
      repurposingReviews.every((application) =>
        reviewRepurposingStatuses.has(application.complianceReview?.reviewRepurposing ?? ""),
      ),
    ).toBe(true);
    expect(unresolvedRepurposing.length).toBeGreaterThan(0);

    for (const application of unresolvedRepurposing) {
      expect(application.status).not.toBe("approved");
      expect(application.riskFlags).toEqual(
        expect.arrayContaining([expect.stringMatching(/repurpos|hijack|cross-product/i)]),
      );
      expect(application.complianceReview?.reviewRepurposingEvidence?.join(" ")).toMatch(
        /product|model|reviewer/i,
      );
      expect(application.complianceReview?.evidenceRequested).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/provenance|matching each review|written for/i),
          expect.stringMatching(/remove|re-collect|substantially different/i),
        ]),
      );
      expect(application.complianceReview?.reviewerNote).toMatch(/repurpos/i);
    }
  });

  it("keeps applicants using fake social influence indicators out of approval", () => {
    const influenceReviews = demoApplications.filter(
      (application) => application.complianceReview?.socialInfluenceIndicators,
    );
    const fakeInfluenceReviews = influenceReviews.filter(
      (application) => application.complianceReview?.socialInfluenceIndicators === "fake_or_hijacked",
    );

    expect(influenceReviews.length).toBeGreaterThan(0);
    expect(
      influenceReviews.every((application) =>
        socialInfluenceIndicatorStatuses.has(application.complianceReview?.socialInfluenceIndicators ?? ""),
      ),
    ).toBe(true);
    expect(fakeInfluenceReviews.length).toBeGreaterThan(0);

    for (const application of fakeInfluenceReviews) {
      expect(application.status).not.toBe("approved");
      expect(application.riskFlags).toEqual(
        expect.arrayContaining([expect.stringMatching(/fake.*social|followers|influence/i)]),
      );
      expect(application.complianceReview?.socialInfluenceEvidence?.join(" ")).toMatch(
        /bot|hijacked|follower|vendor|invoice/i,
      );
      expect(application.complianceReview?.evidenceRequested).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/vendor|contract|invoice|growth/i),
          expect.stringMatching(/audit|bot|hijacked|real user/i),
          expect.stringMatching(/media kit|metrics|fake indicators/i),
        ]),
      );
      expect(application.complianceReview?.reviewerNote).toMatch(/fake|follower|influence/i);
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

  it("requires a completed monitoring run for documented endorser controls", () => {
    const documentedMonitoringReviews = demoApplications.filter(
      (application) => application.complianceReview?.endorserMonitoringReadiness === "documented",
    );

    expect(documentedMonitoringReviews.length).toBeGreaterThan(0);

    for (const application of documentedMonitoringReviews) {
      const review = application.complianceReview;
      expect(review?.endorserMonitoringLastRunAt).toBeDefined();
      expect(Number.isNaN(Date.parse(review?.endorserMonitoringLastRunAt ?? ""))).toBe(false);
      expect(new Date(review?.endorserMonitoringLastRunAt ?? "").getTime()).toBeLessThanOrEqual(
        new Date(review?.lastCheckedAt ?? "").getTime(),
      );
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

  it("keeps applicants with vague disclosure language out of approval", () => {
    const specificityReviews = demoApplications.filter(
      (application) => application.complianceReview?.disclosureSpecificity,
    );
    const vagueDisclosureApplications = specificityReviews.filter(
      (application) => application.complianceReview?.disclosureSpecificity === "vague_or_ambiguous",
    );

    expect(specificityReviews.length).toBeGreaterThan(0);
    expect(
      specificityReviews.every((application) =>
        disclosureSpecificityStatuses.has(application.complianceReview?.disclosureSpecificity ?? ""),
      ),
    ).toBe(true);
    expect(vagueDisclosureApplications.length).toBeGreaterThan(0);

    for (const application of vagueDisclosureApplications) {
      expect(application.status).not.toBe("approved");
      expect(application.riskFlags).toEqual(
        expect.arrayContaining([expect.stringMatching(/vague|disclosure language/i)]),
      );
      expect(application.complianceReview?.disclosureSpecificityEvidence?.join(" ")).toMatch(
        /#partner|#collab|#ambassador|thanks to|ambiguous/i,
      );
      expect(application.complianceReview?.evidenceRequested).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/#ad|Sponsored by|Paid partnership/i),
        ]),
      );
      expect(application.complianceReview?.reviewerNote).toMatch(/specific|unambiguous|clearly identifies/i);
    }
  });

  it("requires disclosure language to be specific and clearly identify the material connection before approval", () => {
    const reviewedApplications = demoApplications.filter((application) => application.complianceReview);
    const unresolvedSpecificityReviews = reviewedApplications.filter(
      (application) => application.complianceReview?.disclosureSpecificity === "vague_or_ambiguous",
    );

    expect(unresolvedSpecificityReviews.length).toBeGreaterThan(0);
    expect(unresolvedSpecificityReviews.every((application) => application.status !== "approved")).toBe(true);

    for (const application of unresolvedSpecificityReviews) {
      expect(application.complianceReview?.affiliateDisclosure).toBe("needs_evidence");
      expect(application.complianceReview?.disclosureSpecificityEvidence?.length ?? 0).toBeGreaterThanOrEqual(2);
      expect(application.complianceReview?.disclosureSpecificityEvidence?.some((item) =>
        /#partner|#collab|#ambassador|thanks/i.test(item),
      )).toBe(true);
      expect(application.complianceReview?.disclosureSpecificityEvidence?.some((item) =>
        /FTC|guidance|clear.*conspicuous|standard/i.test(item),
      )).toBe(true);
    }
  });

  it("keeps applications with elevated or unassessed disclosure exposure out of approval", () => {
    const exposureReviews = demoApplications.filter(
      (application) => application.complianceReview?.disclosureExposure,
    );
    const unresolvedExposureReviews = exposureReviews.filter((application) =>
      ["elevated", "needs_assessment"].includes(application.complianceReview?.disclosureExposure ?? ""),
    );

    expect(exposureReviews.length).toBeGreaterThanOrEqual(2);
    expect(
      exposureReviews.every((application) =>
        disclosureExposureAssessments.has(application.complianceReview?.disclosureExposure ?? ""),
      ),
    ).toBe(true);
    expect(unresolvedExposureReviews.length).toBeGreaterThan(0);

    for (const application of unresolvedExposureReviews) {
      expect(application.status).not.toBe("approved");
      expect(application.riskFlags).toEqual(
        expect.arrayContaining([expect.stringMatching(/exposure|penalty|undisclosed/i)]),
      );
      expect(application.complianceReview?.disclosureExposureEvidence?.join(" ")).toMatch(
        /inventory|crawl|pages|posts|placement|visitor/i,
      );
      expect(application.complianceReview?.evidenceRequested).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/inventory|reconcil|disclosure status/i),
          expect.stringMatching(/retroactive|remediation|re-crawl|verification/i),
        ]),
      );
    }
  });

  it("requires a reconciled live-content inventory before treating disclosure exposure as low", () => {
    const lowExposureApplications = demoApplications.filter(
      (application) => application.complianceReview?.disclosureExposure === "low",
    );

    expect(lowExposureApplications.length).toBeGreaterThan(0);

    for (const application of lowExposureApplications) {
      const exposureEvidence = application.complianceReview?.disclosureExposureEvidence?.join(" ") ?? "";
      expect(application.complianceReview?.affiliateDisclosure).toBe("verified");
      expect(exposureEvidence).toMatch(/inventory|reconcil|crawl/i);
      expect(exposureEvidence).toMatch(/zero|no live|disclosure screenshot|100 percent/i);
    }
  });

  it("keeps unsubstantiated income claims out of approval", () => {
    const earningsReviews = demoApplications.filter(
      (application) => application.complianceReview?.earningsClaimReview,
    );
    const unresolvedEarningsReviews = earningsReviews.filter((application) =>
      ["unsubstantiated", "typical_results_omitted"].includes(
        application.complianceReview?.earningsClaimReview ?? "",
      ),
    );

    expect(earningsReviews.length).toBeGreaterThanOrEqual(2);
    expect(
      earningsReviews.every((application) =>
        earningsClaimReviewStatuses.has(application.complianceReview?.earningsClaimReview ?? ""),
      ),
    ).toBe(true);
    expect(unresolvedEarningsReviews.length).toBeGreaterThan(0);

    for (const application of unresolvedEarningsReviews) {
      expect(application.status).not.toBe("approved");
      expect(application.riskFlags).toEqual(
        expect.arrayContaining([expect.stringMatching(/income|earnings|claims/i)]),
      );
      expect(application.complianceReview?.earningsClaimEvidence?.join(" ")).toMatch(
        /screenshot|payout|income|earn/i,
      );
      expect(application.complianceReview?.evidenceRequested).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/payout|statement|verification|substantiat/i),
          expect.stringMatching(/typical|results|disclosure/i),
        ]),
      );
      expect(application.complianceReview?.reviewerNote).toMatch(/earnings|income|claim/i);
    }
  });

  it("requires payout evidence and a typical-results disclosure before treating earnings claims as substantiated", () => {
    const substantiatedEarningsReviews = demoApplications.filter(
      (application) => application.complianceReview?.earningsClaimReview === "substantiated",
    );

    expect(substantiatedEarningsReviews.length).toBeGreaterThan(0);

    for (const application of substantiatedEarningsReviews) {
      const earningsEvidence = application.complianceReview?.earningsClaimEvidence?.join(" ") ?? "";
      expect(application.status).toBe("approved");
      expect(earningsEvidence).toMatch(/payout|statement|12 months/i);
      expect(earningsEvidence).toMatch(/typical|most partners|disclosure/i);
    }
  });

  it("holds synthetic endorsers until permission and audience representation are verified", () => {
    const syntheticPersonaApplications = demoApplications.filter(
      (application) => application.complianceReview?.syntheticEndorserReview,
    );
    const unresolvedSyntheticPersonas = syntheticPersonaApplications.filter((application) =>
      ["permission_missing", "misrepresented_as_human"].includes(
        application.complianceReview?.syntheticEndorserReview ?? "",
      ),
    );

    expect(syntheticPersonaApplications.length).toBeGreaterThan(0);
    expect(
      syntheticPersonaApplications.every((application) =>
        syntheticEndorserReviewStatuses.has(application.complianceReview?.syntheticEndorserReview ?? ""),
      ),
    ).toBe(true);
    expect(unresolvedSyntheticPersonas.length).toBeGreaterThan(0);

    for (const application of unresolvedSyntheticPersonas) {
      expect(application.status).not.toBe("approved");
      expect(application.riskFlags).toEqual(
        expect.arrayContaining([expect.stringMatching(/synthetic|AI-generated|likeness/i)]),
      );
      expect(application.complianceReview?.syntheticEndorserEvidence?.join(" ")).toMatch(
        /permission|consent|likeness|generated|avatar|real/i,
      );
      expect(application.complianceReview?.evidenceRequested).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/permission|consent|likeness/i),
          expect.stringMatching(/disclos|virtual|generated|actual user/i),
        ]),
      );
    }
  });

  it("keeps approved synthetic endorsers tied to authorization and disclosure evidence", () => {
    const approvedSyntheticPersonas = demoApplications.filter(
      (application) => application.complianceReview?.syntheticEndorserReview === "authorized_and_disclosed",
    );

    expect(approvedSyntheticPersonas.length).toBeGreaterThan(0);

    for (const application of approvedSyntheticPersonas) {
      const review = application.complianceReview;
      expect(application.status).toBe("approved");
      expect(review?.syntheticEndorserEvidence?.join(" ")).toMatch(/permission|consent|authorized/i);
      expect(review?.syntheticEndorserEvidence?.join(" ")).toMatch(/disclos|virtual|generated/i);
    }
  });

  it("keeps published content drift out of approval", () => {
    const reviewedApplications = demoApplications.filter(
      (application) => application.complianceReview?.publishedContentStatus,
    );
    const driftedApplications = reviewedApplications.filter(
      (application) => application.complianceReview?.publishedContentStatus === "drift_detected",
    );

    expect(reviewedApplications.length).toBeGreaterThanOrEqual(2);
    expect(
      reviewedApplications.every((application) =>
        publishedContentStatuses.has(application.complianceReview?.publishedContentStatus ?? ""),
      ),
    ).toBe(true);
    expect(driftedApplications.length).toBeGreaterThan(0);

    for (const application of driftedApplications) {
      const review = application.complianceReview;
      expect(application.status).not.toBe("approved");
      expect(application.riskFlags).toEqual(expect.arrayContaining([expect.stringMatching(/drift|live/i)]));
      expect(review?.publishedContentEvidence?.join(" ")).toMatch(/approved|live|snapshot|replay|baseline/i);
      expect(review?.evidenceRequested).toEqual(
        expect.arrayContaining([expect.stringMatching(/snapshot|baseline|re-review|published/i)]),
      );
      expect(review?.reviewerNote).toMatch(/drift|approved|live|re-review/i);
    }
  });

  it("requires archived evidence before treating published content as matched", () => {
    const matchedApplications = demoApplications.filter(
      (application) => application.complianceReview?.publishedContentStatus === "matches_approved",
    );

    expect(matchedApplications.length).toBeGreaterThan(0);

    for (const application of matchedApplications) {
      const evidence = application.complianceReview?.publishedContentEvidence?.join(" ") ?? "";
      expect(application.status).toBe("approved");
      expect(evidence).toMatch(/archived|snapshot|crawl/i);
      expect(evidence).toMatch(/approved|baseline|match/i);
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

# Affiliate Applications Expertise

AI-assisted affiliate application and partner management dashboard. This portfolio demo shows how Tensor Garden would build application review, partner scoring, fraud controls, payout rules, and program analytics for an affiliate management software team.

## Who this is for

**Non-technical stakeholders.** This shows the operating view a growth, partnerships, or affiliate program lead would need before approving new partners and releasing commissions.

**Engineering evaluators.** This demonstrates typed domain models, deterministic fixture data, a single-page Next.js dashboard, and Vitest coverage for decision rules.

**AI agents and screeners.** This repo maps directly to jobs asking for AI application development expertise, affiliate management software, partner onboarding workflows, fraud review, and payout automation.

## Project story

Affiliate programs often grow faster than their review operations. Teams need to evaluate whether an applicant is a real partner, a coupon arbitrage risk, a paid search policy risk, or a high quality content partner that should be approved quickly. Manual review creates delays for good partners and inconsistent enforcement for risky partners.

This demo turns the intake process into an operational cockpit. The dashboard prioritizes affiliate applications, scores vertical fit and quality, surfaces fraud signals, recommends program tiers, and applies payout control rules before commissions are released.

All records are fictional. The goal is to show product judgment and engineering execution for affiliate management software without using real customer data.

## What you are looking at

| Section | What it shows |
| --- | --- |
| Hero stats | Monthly intake, projected revenue, review speed, payout exposure, and checked audience volume |
| Application table | Fictional affiliate applicants with statuses, channel types, quality scores, commission asks, and risk badges |
| Tier recommendations | Commission tiers, cookie windows, payout holds, and compliance policy requirements |
| Fraud signals | Trademark bidding, domain mismatch, traffic anomalies, extension attribution risk, and recommended actions |
| Payout rules | Operational safeguards that protect revenue before commissions are released |
| Analytics and activity | Approval mix, automated review coverage, flagged share, and recent review decisions |

## Features

- **AI review queue:** Sortable fictional application data with fit, quality, fraud risk, status, and expected revenue.
- **Partner tiering:** Commission recommendations tied to quality thresholds, payout holds, cookie windows, and compliance rules.
- **Fraud and policy review:** High confidence risk signals for trademark bidding, attribution abuse, domain mismatch, and traffic anomalies.
- **Payout safeguards:** Rule-based holds and release criteria for coupon partners, paid search partners, and high value approvals.
- **Executive analytics:** Review speed, approval rate, projected revenue, payout exposure, and automated review coverage.
- **Activity timeline:** Mixed AI, manual, compliance, payout, and approval events for realistic program operations.

## Tech stack

| Concern | Choice |
| --- | --- |
| App framework | Next.js App Router |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Testing | Vitest |
| Data layer | Static fictional fixtures in `src/lib/demo-data.ts` |
| Safety | No external API calls, no real keys, no customer data |

## Architecture

```text
src/lib/types.ts
  defines affiliate applications, tiers, fraud signals, payout rules, analytics, and activity events

src/lib/demo-data.ts
  provides fictional partner applications and operating metrics

src/app/page.tsx
  renders inline UI components, dashboard sections, tables, badges, progress bars, and timeline

tests/affiliate_applications_expertise.test.ts
  validates data shape, supported statuses, score ranges, fraud links, payout rules, and analytics
```

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:3000` to review the demo dashboard.

## Quality gates

Run the same checks used before publishing:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Demo data

The dataset includes 10 fictional affiliate applications across content, paid search, influencer, newsletter, coupon, and B2B channels. It also includes program tiers, fraud signals, payout control rules, analytics, and activity events.

The data is designed to reflect common affiliate program operating problems:

- High quality partners that need fast approval
- Coupon and extension partners that require payout holds
- Paid search partners that need keyword policy enforcement
- Domain mismatch and traffic spike fraud indicators
- Commission requests that need tier based governance

## Production roadmap

A production version would add authenticated reviewers, applicant upload flows, domain verification, analytics integrations, webhook ingestion from affiliate networks, audit logs, role based access control, payout exports, and configurable policy rules per program.

## Safety

- No real API keys
- No network calls
- No customer records
- No real affiliate data
- Fictional company names, people, metrics, and activities

Built as a Tensor Garden portfolio demonstration. Ready for review.

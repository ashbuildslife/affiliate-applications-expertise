import type { ReactNode } from "react";
import { demoActivity, demoAnalytics, demoApplications, demoFraudSignals, demoPayoutRules, demoTiers } from "@/lib/demo-data";
import type { AffiliateApplication, ApplicationStatus, FraudSeverity } from "@/lib/types";

function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "green" | "red" | "amber" | "blue" | "purple" }) {
  const tones = {
    slate: "border-slate-200 bg-white text-slate-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    red: "border-red-200 bg-red-50 text-red-700",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    purple: "border-indigo-200 bg-indigo-50 text-indigo-700",
  };
  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur ${className}`}>{children}</section>;
}

function ProgressBar({ value, color = "indigo" }: { value: number; color?: "indigo" | "emerald" | "amber" | "red" }) {
  const colors = { indigo: "bg-indigo-600", emerald: "bg-emerald-600", amber: "bg-amber-500", red: "bg-red-500" };
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-200" aria-label={`${value} percent`}>
      <div className={`h-full rounded-full ${colors[color]}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

function StatusDot({ status }: { status: ApplicationStatus | FraudSeverity | "healthy" }) {
  const map = {
    new: "bg-slate-400",
    reviewing: "bg-blue-400",
    approved: "bg-emerald-400",
    needs_info: "bg-amber-400",
    rejected: "bg-red-500",
    paused: "bg-orange-500",
    low: "bg-emerald-400",
    medium: "bg-amber-400",
    high: "bg-red-500",
    healthy: "bg-emerald-400",
  };
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${map[status]}`} />;
}

function StatCard({ label, value, detail, tone = "slate" }: { label: string; value: string; detail: string; tone?: "slate" | "green" | "amber" | "blue" | "purple" }) {
  const borders = { slate: "border-l-slate-300", green: "border-l-emerald-300", amber: "border-l-amber-300", blue: "border-l-blue-300", purple: "border-l-indigo-300" };
  return (
    <div className={`rounded-2xl bg-white/95 p-5 shadow-sm border-l-4 ${borders[tone]}`}>
      <div className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-bold text-slate-950">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{detail}</div>
    </div>
  );
}

const formatCurrency = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
const formatNumber = (value: number) => new Intl.NumberFormat("en-US").format(value);

function statusTone(status: ApplicationStatus): "slate" | "green" | "red" | "amber" | "blue" | "purple" {
  if (status === "approved") return "green";
  if (status === "rejected") return "red";
  if (status === "needs_info" || status === "paused") return "amber";
  if (status === "reviewing") return "blue";
  return "slate";
}

function ApplicationRow({ application }: { application: AffiliateApplication }) {
  const qualityColor = application.qualityScore >= 85 ? "emerald" : application.qualityScore >= 70 ? "amber" : "red";
  return (
    <tr className="border-b border-slate-100 transition-colors hover:bg-slate-50/70">
      <td className="px-4 py-4">
        <div className="flex items-center gap-2 font-semibold text-slate-950"><StatusDot status={application.status} />{application.companyName}</div>
        <div className="ml-5 text-xs text-slate-500">{application.contactName} · {application.country} · {application.channel.replace("_", " ")}</div>
      </td>
      <td className="px-4 py-4"><Badge tone={statusTone(application.status)}>{application.status.replace("_", " ")}</Badge></td>
      <td className="px-4 py-4 min-w-36"><ProgressBar value={application.qualityScore} color={qualityColor} /><span className="mt-1 block text-xs text-slate-500">{application.qualityScore}/100 quality</span></td>
      <td className="px-4 py-4 text-sm font-semibold text-slate-800">{formatCurrency(application.expectedMonthlyRevenue)}</td>
      <td className="px-4 py-4 text-sm text-slate-600">{application.requestedCommissionRate}% requested{application.approvedCommissionRate ? `, ${application.approvedCommissionRate}% approved` : ""}</td>
      <td className="px-4 py-4">
        <div className="flex flex-wrap gap-1">{application.riskFlags.length ? application.riskFlags.map((flag) => <Badge key={flag} tone="red">{flag}</Badge>) : <Badge tone="green">clear</Badge>}</div>
        {application.complianceReview && (
          <div className="mt-2 text-xs text-slate-500">
            Disclosure placement: {application.complianceReview.disclosurePlacement.replaceAll("_", " ")}
            <span className="block">
              Language review: {application.complianceReview.disclosureLanguageMatch.replaceAll("_", " ")} · {application.complianceReview.endorsementLanguage}
            </span>
            {application.complianceReview.liveDisclosureCadence && (
              <span className="block">Live cadence: {application.complianceReview.liveDisclosureCadence.replaceAll("_", " ")}</span>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}

function ApplicationTable() {
  return (
    <Card className="lg:col-span-3">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950">AI application review queue</h2>
          <p className="text-sm text-slate-500">Fictional affiliate applications scored by fit, quality, fraud risk, and expected revenue.</p>
        </div>
        <Badge tone="blue">{demoApplications.length} applicants</Badge>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">Applicant</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Quality</th>
              <th className="px-4 py-3">Projected revenue</th>
              <th className="px-4 py-3">Commission</th>
              <th className="px-4 py-3">Risk flags</th>
            </tr>
          </thead>
          <tbody>{[...demoApplications].sort((a, b) => b.qualityScore - a.qualityScore).map((application) => <ApplicationRow key={application.id} application={application} />)}</tbody>
        </table>
      </div>
    </Card>
  );
}

function TierSection() {
  return (
    <Card>
      <h2 className="text-xl font-bold text-slate-950">Program tier recommendations</h2>
      <p className="mt-1 text-sm text-slate-500">Tier policy combines commission, cookie windows, payout holds, and compliance requirements.</p>
      <div className="mt-5 space-y-4">
        {demoTiers.map((tier) => (
          <div key={tier.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-slate-950">{tier.name}</div>
                <div className="text-xs text-slate-500">{tier.partnerCount} partners · {tier.cookieWindowDays} day cookie · {tier.payoutHoldDays} day hold</div>
              </div>
              <Badge tone="purple">{tier.commissionRate}%</Badge>
            </div>
            <div className="mt-3 text-sm text-slate-600">{tier.complianceRule}</div>
            <div className="mt-3"><ProgressBar value={tier.minQualityScore} color={tier.minQualityScore >= 80 ? "emerald" : "amber"} /></div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function FraudSection() {
  return (
    <Card>
      <h2 className="text-xl font-bold text-slate-950">Fraud and policy signals</h2>
      <p className="mt-1 text-sm text-slate-500">Risk review highlights the cases that need human judgment before approval or payout.</p>
      <div className="mt-5 space-y-4">
        {demoFraudSignals.map((signal) => (
          <div key={signal.id} className="rounded-2xl border border-slate-100 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-semibold text-slate-900"><StatusDot status={signal.severity} />{signal.label}</div>
              <Badge tone={signal.severity === "high" ? "red" : signal.severity === "medium" ? "amber" : "green"}>{signal.confidence}% confidence</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-600">{signal.description}</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-indigo-700">Action: {signal.recommendedAction}</p>
            {signal.resolution && (
              <div className="mt-2 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Resolved</div>
                <p className="mt-0.5 text-xs text-emerald-800">{signal.resolution}</p>
                {signal.resolvedAt && <div className="mt-1 text-xs text-emerald-600">{signal.resolvedAt}</div>}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

function RulesSection() {
  return (
    <Card>
      <h2 className="text-xl font-bold text-slate-950">Payout control rules</h2>
      <p className="mt-1 text-sm text-slate-500">Commission automation needs safeguards, review holds, and clear activation rules.</p>
      <div className="mt-5 space-y-3">
        {demoPayoutRules.map((rule) => (
          <div key={rule.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="font-semibold text-slate-950">{rule.name}</div>
              <Badge tone={rule.active ? "green" : "slate"}>{rule.active ? "active" : "draft"}</Badge>
            </div>
            <div className="mt-2 text-sm text-slate-600"><strong>When:</strong> {rule.condition}</div>
            <div className="mt-1 text-sm text-slate-600"><strong>Then:</strong> {rule.action}</div>
            <div className="mt-1 text-xs text-slate-500">Protects against {rule.protectsAgainst.toLowerCase()}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AnalyticsSection() {
  const approved = demoApplications.filter((application) => application.status === "approved").length;
  const blocked = demoApplications.filter((application) => ["rejected", "paused"].includes(application.status)).length;
  const pending = demoApplications.length - approved - blocked;
  return (
    <Card className="lg:col-span-2">
      <h2 className="text-xl font-bold text-slate-950">Program analytics</h2>
      <div className="mt-5 grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl bg-emerald-50 p-4"><div className="text-3xl font-bold text-emerald-700">{approved}</div><div className="text-sm text-emerald-800">approved in sample queue</div></div>
        <div className="rounded-2xl bg-amber-50 p-4"><div className="text-3xl font-bold text-amber-700">{pending}</div><div className="text-sm text-amber-800">pending review decisions</div></div>
        <div className="rounded-2xl bg-red-50 p-4"><div className="text-3xl font-bold text-red-700">{blocked}</div><div className="text-sm text-red-800">blocked or paused</div></div>
      </div>
      <div className="mt-6 space-y-4">
        <div><div className="mb-1 flex justify-between text-sm"><span>Approval rate</span><strong>{demoAnalytics.approvalRate}%</strong></div><ProgressBar value={demoAnalytics.approvalRate} color="emerald" /></div>
        <div><div className="mb-1 flex justify-between text-sm"><span>Auto review coverage</span><strong>{demoAnalytics.autoReviewCoverage}%</strong></div><ProgressBar value={demoAnalytics.autoReviewCoverage} color="indigo" /></div>
        <div><div className="mb-1 flex justify-between text-sm"><span>Flagged application share</span><strong>{Math.round((demoAnalytics.flaggedApplications / demoAnalytics.applicationVolume) * 100)}%</strong></div><ProgressBar value={(demoAnalytics.flaggedApplications / demoAnalytics.applicationVolume) * 100} color="amber" /></div>
      </div>
    </Card>
  );
}

function ActivitySection() {
  return (
    <Card>
      <h2 className="text-xl font-bold text-slate-950">Review activity</h2>
      <div className="mt-5 space-y-4">
        {demoActivity.map((event) => (
          <div key={event.id} className="flex gap-3">
            <div className="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-500" />
            <div>
              <div className="text-sm font-semibold text-slate-900">{event.timestamp} · {event.actor}</div>
              <div className="text-sm text-slate-600">{event.message}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function Home() {
  const totalTraffic = demoApplications.reduce((sum, application) => sum + application.monthlyTraffic, 0);
  const averageQuality = Math.round(demoApplications.reduce((sum, application) => sum + application.qualityScore, 0) / demoApplications.length);
  return (
    <main className="min-h-screen px-5 py-8 text-slate-900 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Badge tone="purple">Tensor Garden portfolio demo</Badge>
              <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">Affiliate Applications Expertise Console</h1>
              <p className="mt-4 text-lg leading-8 text-slate-300">A fictional AI-assisted affiliate management dashboard for reviewing partner applications, detecting policy risk, assigning commission tiers, and protecting payout operations.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-slate-200">
              <div className="font-semibold text-white">Operational posture</div>
              <div className="mt-2 flex items-center gap-2"><StatusDot status="healthy" />No real API keys, no network calls, fictional records only.</div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Applications" value={String(demoAnalytics.applicationVolume)} detail="monthly intake" tone="blue" />
          <StatCard label="Projected revenue" value={formatCurrency(demoAnalytics.projectedMonthlyRevenue)} detail="qualified monthly upside" tone="green" />
          <StatCard label="Review speed" value={`${demoAnalytics.medianReviewHours}h`} detail="median cycle time" tone="purple" />
          <StatCard label="Payout exposure" value={formatCurrency(demoAnalytics.payoutExposure)} detail="under controls" tone="amber" />
          <StatCard label="Audience checked" value={formatNumber(totalTraffic)} detail={`${averageQuality}/100 avg quality`} tone="slate" />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <ApplicationTable />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <TierSection />
          <FraudSection />
          <RulesSection />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <AnalyticsSection />
          <ActivitySection />
        </section>
      </div>
    </main>
  );
}

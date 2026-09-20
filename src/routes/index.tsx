import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ShieldCheck, LineChart, Users, ArrowRight } from "lucide-react";
import { useState } from "react";
import heroTeam from "@/assets/hero-team.jpg";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "See account risk before the QBR — not after." },
      { name: "description", content: "Pulsecheck gives Customer Success one health score per account, pulled from the systems you already track." },
      { property: "og:title", content: "See account risk before the QBR — not after." },
      { property: "og:description", content: "One health score per account for Customer Success teams." },
      { property: "og:url", content: "https://pulse-forward-health.lovable.app/" },
      { property: "og:image", content: "https://pulse-forward-health.lovable.app/og-image.jpg" },
      { name: "twitter:image", content: "https://pulse-forward-health.lovable.app/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://pulse-forward-health.lovable.app/" }],
  }),
  component: Landing,
});


const FAQS = [
  {
    q: "What data sources does Pulsecheck support?",
    a: "This template ships with CSV import and sample data. Live connectors for Salesforce, HubSpot, Zendesk and Gainsight are on the roadmap — see /docs for what carries over when you remix.",
  },
  {
    q: "How is my data kept safe?",
    a: "Every row is stored in a per-user database with row-level security scoped to your account. No other user — including other Pulsecheck users — can read or modify your accounts.",
  },
  {
    q: "Can I connect my existing systems?",
    a: "The Settings page has a 'Connect your tools' section reserved for CRM and support integrations. It's marked Coming soon in this template — you can wire in the API of your choice when you remix.",
  },
  {
    q: "How is the health score calculated?",
    a: "You can set it manually per account, or derive it from your own logic (usage, tickets, NPS, last contact). Status auto-derives: Healthy 70+, At Risk 40–69, Critical <40.",
  },
];

function Landing() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <div className="min-h-screen">
      <section className="relative isolate min-h-[85vh] w-full overflow-hidden">
        <img
          src={heroTeam}
          alt="Customer success team collaborating at their desks"
          className="absolute inset-0 h-full w-full object-cover"
          width={1024}
          height={1024}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80" aria-hidden />

        <header className="relative z-10 mx-4 mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-3 py-3 backdrop-blur-md sm:mx-6 sm:px-4">
          <Link to="/" className="flex min-w-0 items-center gap-2 font-display text-base font-semibold text-white sm:text-lg">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"><Activity className="h-4 w-4" /></span>
            <span className="truncate">Pulsecheck</span>
          </Link>
          <div className="flex shrink-0 items-center gap-1 text-sm sm:gap-2">
            <Link to="/docs" className="inline-flex min-h-11 items-center rounded-lg px-2.5 py-2 text-white/80 hover:bg-white/10 sm:px-3">Docs</Link>
            <Link to="/auth" className="inline-flex min-h-11 items-center whitespace-nowrap rounded-lg bg-primary px-3 py-2 font-medium text-primary-foreground hover:bg-primary/90 sm:px-4">Sign in</Link>
          </div>
        </header>

        <div className="relative z-10 mx-auto flex min-h-[calc(85vh-5rem)] max-w-5xl flex-col items-center justify-center px-4 py-14 sm:py-16 lg:px-8 text-center sm:px-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur">
            <ShieldCheck className="h-3.5 w-3.5" /> Account Health Dashboard for CS teams
          </span>
          <h1 className="mt-5 font-display text-3xl font-bold leading-tight uppercase text-white sm:text-4xl md:text-5xl lg:text-6xl">
            SEE ACCOUNT RISK BEFORE<br />THE QBR — NOT AFTER.
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-balance text-sm text-white sm:text-base lg:text-lg">
            One health score per account so you spot churn signals early and walk into every renewal knowing exactly where you stand.
          </p>
          <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Link to="/auth" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground shadow hover:bg-primary/90 sm:w-auto">
              Start now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>



      {/* How it works */}
      <section className="mx-4 mt-12 sm:mx-6 sm:mt-16 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center font-display text-xl font-semibold sm:text-2xl lg:text-3xl">How it works</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Users, title: "1. Add accounts", body: "Import a CSV or explore with sample data." },
              { icon: Activity, title: "2. Score health", body: "Set scores manually or derive from usage & tickets." },
              { icon: LineChart, title: "3. Spot risk", body: "See risk grouped by status, segment and renewal date." },
              { icon: ShieldCheck, title: "4. Act early", body: "Prioritise saves before renewals hit." },
            ].map((s) => (
              <div key={s.title} className="glass p-4 sm:p-5">
                <s.icon className="h-6 w-6 text-primary" />
                <div className="mt-3 font-semibold">{s.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-4 mt-12 sm:mx-6 sm:mt-16 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-display text-xl font-semibold sm:text-2xl lg:text-3xl">Frequently asked</h2>
          <div className="mt-6 space-y-3">
            {FAQS.map((f, i) => (
              <div key={f.q} className="glass overflow-hidden">
                <button
                  onClick={() => setOpenIdx(openIdx === i ? null : i)}
                  className="flex min-h-11 w-full items-center justify-between px-4 py-4 text-left text-sm font-medium sm:px-5"
                >
                  {f.q}
                  <span className="ml-2 text-primary">{openIdx === i ? "–" : "+"}</span>
                </button>
                {openIdx === i && (
                  <div className="max-w-[70ch] px-4 pb-4 text-sm text-muted-foreground sm:px-5">{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-4 my-10 flex flex-col items-center justify-between gap-4 text-xs text-muted-foreground sm:mx-6 sm:flex-row lg:px-8">
        <div>© {new Date().getFullYear()} Pulsecheck — a Lovable template.</div>
        <div className="flex gap-6">
          <Link to="/docs">Docs</Link>
          <Link to="/auth">Sign in</Link>
        </div>
      </footer>
    </div>
  );
}

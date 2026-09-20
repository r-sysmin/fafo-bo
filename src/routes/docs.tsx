import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity } from "lucide-react";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Pulsecheck Docs — Getting started & remix guide" },
      { name: "description", content: "How Pulsecheck works, how to remix it, and what to expect from this template." },
      { property: "og:title", content: "Pulsecheck Docs — Getting started & remix guide" },
      { property: "og:description", content: "How Pulsecheck works, how to remix it, and what to expect from this template." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://pulse-forward-health.lovable.app/docs" },
      { property: "og:image", content: "https://pulse-forward-health.lovable.app/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://pulse-forward-health.lovable.app/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://pulse-forward-health.lovable.app/docs" }],

  }),
  component: Docs,
});

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="glass p-5 sm:p-8">
      <h2 className="font-display text-lg font-semibold sm:text-xl">{title}</h2>
      <div className="prose prose-sm mt-3 max-w-[70ch] break-words hyphens-auto text-foreground/80 [&_p]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-1">
        {children}
      </div>
    </section>
  );
}

function Docs() {
  return (
    <div className="min-h-screen">
      <header className="glass mx-4 mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 py-3 sm:mx-6 sm:px-4">
        <Link to="/" className="flex min-w-0 items-center gap-2 font-display text-base font-semibold sm:text-lg">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"><Activity className="h-4 w-4" /></span>
          <span className="truncate">Pulsecheck</span>
        </Link>
        <div className="flex shrink-0 items-center gap-1 text-sm sm:gap-2">
          <Link to="/" className="inline-flex min-h-11 items-center rounded-lg px-2.5 py-2 text-foreground/70 hover:bg-white/50 sm:px-3">Home</Link>
          <Link to="/auth" className="inline-flex min-h-11 items-center whitespace-nowrap rounded-lg bg-primary px-3 py-2 font-medium text-primary-foreground sm:px-4">Sign in</Link>
        </div>
      </header>

      <main className="mx-4 my-8 grid w-auto grid-cols-1 gap-4 sm:mx-6 lg:mx-auto lg:w-full lg:max-w-4xl lg:px-8">
        <div className="glass p-5 sm:p-8">
          <h1 className="font-display text-2xl font-bold sm:text-3xl lg:text-4xl">Pulsecheck Docs</h1>
          <p className="mt-2 text-muted-foreground">A short, honest guide to this template — what works today, what's a stub, and how to make it yours.</p>
        </div>

        <Section id="how" title="How it works">
          <p>Pulsecheck is a single-user account health dashboard for Customer Success. Each signed-in user has their own private workspace of customer accounts — no shared orgs, teams or roles.</p>
          <ul>
            <li>Accounts you add are visible only to you (row-level security scoped to your user).</li>
            <li>Each account has a health score (0–100). Status is auto-derived: Healthy 70+, At Risk 40–69, Critical &lt;40.</li>
            <li>Every status change is logged in a history table so you can see when an account slipped.</li>
          </ul>
        </Section>

        <Section id="start" title="Getting started">
          <ul>
            <li><strong>Sign up</strong> with email + password or Google.</li>
            <li>Complete the 3-step <strong>onboarding</strong> (you can skip and resume at any time).</li>
            <li>Import a CSV, or pick <em>Explore with sample data</em> to see the dashboard populated instantly.</li>
            <li>Head to <strong>Dashboard</strong> for the at-a-glance view, or <strong>Accounts</strong> to add/edit rows manually.</li>
          </ul>
        </Section>

        <Section id="remix" title="Remix instructions — what carries over">
          <p>When you remix this template into a new Lovable project:</p>
          <ul>
            <li><strong>Carries over:</strong> UI, routes, design system, server functions, database schema (as migrations), RLS policies.</li>
            <li><strong>Does NOT carry over:</strong> any accounts, profiles, or sample data — every new project starts with an empty database and a fresh Lovable Cloud instance.</li>
            <li><strong>Configure after remix:</strong> if you want to brand Google sign-in with your own OAuth client, add it in Cloud Auth settings. The managed Google provider works out of the box.</li>
          </ul>
        </Section>

        <Section id="gaps" title="Known gaps">
          <ul>
            <li>No live connectors to Salesforce/HubSpot/Zendesk/Gainsight — the Settings "Connect your tools" section is intentionally a placeholder.</li>
            <li>Health score is manual or naive-derived; there's no ML model.</li>
            <li>CSV import is parsed in the browser and expects ~5MB or less.</li>
            <li>No team sharing — this template is single-user by design.</li>
            <li>Analytics show a snapshot, not long-range trends beyond what history captures.</li>
          </ul>
        </Section>
      </main>
    </div>
  );
}

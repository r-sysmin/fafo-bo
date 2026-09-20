// Shared constants for onboarding / settings dropdowns.
export const INDUSTRIES = [
  "Software/SaaS",
  "Financial Services",
  "Retail/E-commerce",
  "Healthcare",
  "Manufacturing",
  "Marketing/Advertising",
  "Professional Services",
  "Media/Entertainment",
  "Education",
  "Non-profit",
  "Other",
] as const;

export const COMPANY_SIZES = ["1–10", "11–50", "51–200", "201–1,000", "1,000+"] as const;

export const JOB_TITLES = [
  "CSM",
  "CS Ops",
  "CS Leader",
  "Account Manager",
  "Other",
] as const;

export const SEGMENTS = ["Enterprise", "Mid-Market", "SMB"] as const;
export const USAGE_LEVELS = ["High", "Medium", "Low"] as const;
export const STATUSES = ["Healthy", "At Risk", "Critical"] as const;

export type Status = (typeof STATUSES)[number];

export function statusFromScore(score: number): Status {
  if (score >= 70) return "Healthy";
  if (score >= 40) return "At Risk";
  return "Critical";
}

export function formatCurrency(cents: number): string {
  const dollars = (cents ?? 0) / 100;
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(1)}M`;
  if (dollars >= 1_000) return `$${(dollars / 1_000).toFixed(1)}K`;
  return `$${dollars.toFixed(0)}`;
}

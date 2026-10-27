export function formatNaira(amount: number | string) {
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n.toLocaleString()}`;
}

export function relativeTime(dateStr: string) {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export const tierColor = {
  green: "status-success",
  amber: "status-warning",
  red: "status-error",
} as const;

export const tierLabelClass: Record<string, string> = {
  green: "bg-status-success text-white",
  amber: "bg-status-warning text-white",
  red: "bg-status-error text-white",
};

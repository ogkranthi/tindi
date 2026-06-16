// Money formatting for the household — the family is in India, so amounts are INR.

export function formatINR(n: number, opts: { decimals?: boolean } = {}): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: opts.decimals ? 2 : 0,
  }).format(n);
}

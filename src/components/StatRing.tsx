// Small circular progress ring for a single nutrient. Presentational only.
export default function StatRing({
  label,
  value,
  target,
  unit,
  pct,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
  pct: number;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  const color = pct >= 85 ? "#3d7349" : pct >= 50 ? "#d9743f" : "#b91c1c";
  const r = 18;
  const circ = 2 * Math.PI * r;
  const dash = (clamped / 100) * circ;

  return (
    <div className="flex flex-col items-center text-center">
      <svg width="52" height="52" viewBox="0 0 44 44" className="-rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" stroke="#eee" strokeWidth="5" />
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
        />
      </svg>
      <span className="mt-1 text-[11px] font-medium text-stone-700">{label}</span>
      <span className="text-[10px] text-stone-400">
        {value}/{target} {unit}
      </span>
    </div>
  );
}

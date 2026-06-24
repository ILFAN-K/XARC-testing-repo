/* ------------------------------------------------------------------ */
/*  HealthBar — horizontal progress bar for system health (0-100)     */
/* ------------------------------------------------------------------ */
interface HealthBarProps {
  /** Health percentage, clamped to 0–100. */
  value: number;
}

export default function HealthBar({ value }: HealthBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className="w-[100px] h-[7px] bg-gray-200 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full bg-gray-800 transition-all duration-300"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

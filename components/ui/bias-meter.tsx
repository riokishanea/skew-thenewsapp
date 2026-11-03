type BiasMeterProps = {
  left: number;
  center: number;
  right: number;
  compact?: boolean;
};

export function BiasMeter({ left, center, right, compact = false }: BiasMeterProps) {
  const total = left + center + right;

  if (total !== 100) {
    throw new Error("Bias meter values must add up to 100.");
  }

  return (
    <div
      className={`bias-meter${compact ? " bias-meter--compact" : ""}`}
      role="img"
      aria-label={`AI-estimated framing: Left ${left}%, Center ${center}%, Right ${right}%`}
    >
      <span className="bias-meter__left" style={{ width: `${left}%` }}>
        Left {left}%
      </span>
      <span className="bias-meter__center" style={{ width: `${center}%` }}>
        Center {center}%
      </span>
      <span className="bias-meter__right" style={{ width: `${right}%` }}>
        Right {right}%
      </span>
    </div>
  );
}

import styles from "./dash.module.css";

/**
 * A usage bar. Turns amber at 80% rather than at 100%, because a meter is only
 * useful while there is still time to do something about it.
 */
export function Meter({
  label,
  used,
  limit,
  unit,
}: {
  label: string;
  used: number;
  limit: number;
  unit?: string;
}) {
  const share = limit > 0 ? Math.min(used / limit, 1) : 0;
  const near = share >= 0.8;

  return (
    <div>
      <div className={styles.meterHead}>
        <span className={styles.meterLabel}>{label}</span>
        <span className={styles.meterValue}>
          {used.toLocaleString()} / {limit.toLocaleString()}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>
      <div
        className={styles.track}
        role="progressbar"
        aria-label={label}
        aria-valuenow={used}
        aria-valuemin={0}
        aria-valuemax={limit}
      >
        <div
          className={`${styles.fill} ${near ? styles.fillWarn : ""}`}
          style={{ width: `${Math.max(share * 100, used > 0 ? 2 : 0)}%` }}
        />
      </div>
    </div>
  );
}

export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className={styles.stat}>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}

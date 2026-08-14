"use client";

type DailyPoint = {
  date: string;
  views: number;
  sessions: number;
  metaSessions: number;
  ctaClicks: number;
};

const series = [
  { key: "views", label: "Alle Seitenaufrufe", color: "#0b1d2a" },
  { key: "sessions", label: "Messbare Sitzungen", color: "#4b8fe8" },
  { key: "metaSessions", label: "Meta-Sitzungen", color: "#8eb9ff" },
  { key: "ctaClicks", label: "CTA-Klicks", color: "#f09b25" },
] as const;

const shortDate = (value: string) => new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
}).format(new Date(`${value}T12:00:00`));

export function ReachPerformanceChart({ points }: { points: DailyPoint[] }) {
  const width = 1100;
  const height = 330;
  const padding = { top: 24, right: 20, bottom: 48, left: 56 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const maximum = Math.max(1, ...points.flatMap(point => series.map(item => point[item.key])));
  const roundedMaximum = Math.max(5, Math.ceil(maximum / 5) * 5);
  const x = (index: number) => padding.left + (points.length <= 1 ? 0 : (index / (points.length - 1)) * plotWidth);
  const y = (value: number) => padding.top + plotHeight - (value / roundedMaximum) * plotHeight;
  const pathFor = (key: typeof series[number]["key"]) => points
    .map((point, index) => `${index ? "L" : "M"}${x(index).toFixed(1)},${y(point[key]).toFixed(1)}`)
    .join(" ");
  const labelStep = Math.max(1, Math.ceil(points.length / 7));
  const gridValues = [0, .25, .5, .75, 1].map(part => Math.round(roundedMaximum * part));

  return <div className="reach-chart-card">
    <div className="reach-chart-legend" aria-label="Datenreihen">
      {series.map(item => <span key={item.key}><i style={{ background: item.color }} />{item.label}</span>)}
    </div>
    <div className="reach-chart-scroll">
      <svg className="reach-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Zeitlicher Verlauf der Reichweite und Interaktionen">
        {gridValues.map(value => <g key={value}>
          <line x1={padding.left} x2={width - padding.right} y1={y(value)} y2={y(value)} className="reach-chart-grid" />
          <text x={padding.left - 12} y={y(value) + 4} textAnchor="end" className="reach-chart-axis">{value}</text>
        </g>)}
        {points.map((point, index) => (index % labelStep === 0 || index === points.length - 1) && <text key={point.date} x={x(index)} y={height - 16} textAnchor="middle" className="reach-chart-axis">{shortDate(point.date)}</text>)}
        {series.map(item => <g key={item.key}>
          <path d={pathFor(item.key)} fill="none" stroke={item.color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((point, index) => <circle key={point.date} cx={x(index)} cy={y(point[item.key])} r="5" fill={item.color} className="reach-chart-point">
            <title>{`${item.label} · ${shortDate(point.date)}: ${point[item.key]}`}</title>
          </circle>)}
        </g>)}
      </svg>
    </div>
  </div>;
}

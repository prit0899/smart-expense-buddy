import { Holding, categoryColor } from "@/lib/portfolio";

interface Props {
  holdings: Holding[];
}

export default function DonutChart({ holdings }: Props) {
  const total = holdings.reduce((s, f) => s + f.current_value, 0);
  if (total === 0) return null;

  let cumAngle = 0;
  const slices = holdings.map((f) => {
    const pct = f.current_value / total;
    const angle = pct * 360;
    const slice = { ...f, pct, angle, startAngle: cumAngle };
    cumAngle += angle;
    return slice;
  });

  const polarToXY = (angle: number, r: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: 100 + r * Math.cos(rad), y: 100 + r * Math.sin(rad) };
  };

  const describeArc = (start: number, end: number, r: number) => {
    const s = polarToXY(start, r);
    const e = polarToXY(end, r);
    const large = end - start > 180 ? 1 : 0;
    return `M 100 100 L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} Z`;
  };

  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[180px] mx-auto">
      {slices.map((s, i) => (
        <path
          key={i}
          d={describeArc(s.startAngle, s.startAngle + s.angle, 80)}
          fill={categoryColor(s.category)}
          stroke="hsl(var(--background))"
          strokeWidth="2"
          opacity="0.9"
        />
      ))}
      <circle cx="100" cy="100" r="50" fill="hsl(var(--background))" />
      <text x="100" y="95" textAnchor="middle" fill="hsl(var(--foreground))" fontSize="11" fontWeight="bold">
        PORTFOLIO
      </text>
      <text x="100" y="112" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="8">
        {holdings.length} HOLDINGS
      </text>
    </svg>
  );
}

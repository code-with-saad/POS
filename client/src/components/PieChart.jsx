import { useState } from 'react';

const DEFAULT_COLORS = [
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#f97316', // Orange
  '#06b6d4', // Cyan
  '#84cc16', // Lime
];

export default function PieChart({ data = [], title, size = 240, donut = true }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const validData = data.filter((item) => Number(item.value || 0) > 0);
  const total = validData.reduce((acc, item) => acc + Number(item.value || 0), 0);

  if (total === 0 || validData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-slate-400 min-h-[200px]">
        <span className="material-symbols-outlined text-3xl mb-1 opacity-50">pie_chart</span>
        <p className="text-sm">No data to display chart</p>
      </div>
    );
  }

  const cx = size / 2;
  const cy = size / 2;
  const outerRadius = size * 0.42;
  const innerRadius = donut ? outerRadius * 0.58 : 0;

  let cumulativeAngle = -Math.PI / 2;

  const slices = validData.map((item, idx) => {
    const value = Number(item.value);
    const fraction = value / total;
    const angle = fraction * 2 * Math.PI;

    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle = endAngle;

    const isLargeArc = angle > Math.PI ? 1 : 0;

    const x1 = cx + outerRadius * Math.cos(startAngle);
    const y1 = cy + outerRadius * Math.sin(startAngle);
    const x2 = cx + outerRadius * Math.cos(endAngle);
    const y2 = cy + outerRadius * Math.sin(endAngle);

    let pathData = '';

    if (donut) {
      const ix1 = cx + innerRadius * Math.cos(startAngle);
      const iy1 = cy + innerRadius * Math.sin(startAngle);
      const ix2 = cx + innerRadius * Math.cos(endAngle);
      const iy2 = cy + innerRadius * Math.sin(endAngle);

      pathData = [
        `M ${x1} ${y1}`,
        `A ${outerRadius} ${outerRadius} 0 ${isLargeArc} 1 ${x2} ${y2}`,
        `L ${ix2} ${iy2}`,
        `A ${innerRadius} ${innerRadius} 0 ${isLargeArc} 0 ${ix1} ${iy1}`,
        'Z',
      ].join(' ');
    } else {
      pathData = [
        `M ${cx} ${cy}`,
        `L ${x1} ${y1}`,
        `A ${outerRadius} ${outerRadius} 0 ${isLargeArc} 1 ${x2} ${y2}`,
        'Z',
      ].join(' ');
    }

    const color = item.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
    const pct = Math.round(fraction * 100);

    return {
      label: item.label,
      value,
      pct,
      color,
      pathData,
      idx,
    };
  });

  const activeSlice = hoveredIdx !== null ? slices[hoveredIdx] : null;

  return (
    <div className="flex flex-col items-center w-full p-3">
      {title && <h4 className="text-sm font-semibold mb-3 text-slate-200">{title}</h4>}
      
      <div className="relative flex flex-col md:flex-row items-center justify-center gap-6 w-full">
        {/* SVG Container */}
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
            {slices.map((slice) => {
              const isHovered = hoveredIdx === slice.idx;
              return (
                <path
                  key={slice.idx}
                  d={slice.pathData}
                  fill={slice.color}
                  opacity={hoveredIdx === null || isHovered ? 1 : 0.65}
                  stroke="#1e293b"
                  strokeWidth={isHovered ? 3 : 1.5}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                    transformOrigin: `${cx}px ${cy}px`,
                  }}
                  onMouseEnter={() => setHoveredIdx(slice.idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              );
            })}
          </svg>

          {/* Center text for Donut */}
          {donut && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center"
              style={{ padding: '20%' }}
            >
              {activeSlice ? (
                <>
                  <span className="text-xs text-slate-400 font-medium truncate max-w-full">{activeSlice.label}</span>
                  <span className="text-lg font-bold" style={{ color: activeSlice.color }}>
                    {activeSlice.pct}%
                  </span>
                  <span className="text-[11px] text-slate-400 font-semibold">{activeSlice.value.toLocaleString()}</span>
                </>
              ) : (
                <>
                  <span className="text-xs text-slate-400 font-medium">Total</span>
                  <span className="text-base font-bold text-amber-400">{total.toLocaleString()}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2 w-full max-w-[240px]">
          {slices.map((slice) => (
            <div
              key={slice.idx}
              className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-all ${
                hoveredIdx === slice.idx ? 'bg-slate-800/80 ring-1 ring-amber-500/40' : 'hover:bg-slate-800/40'
              }`}
              onMouseEnter={() => setHoveredIdx(slice.idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div className="flex items-center gap-2 truncate">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="truncate font-medium text-slate-200">{slice.label}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2 font-mono">
                <span className="text-slate-400">{slice.pct}%</span>
                <span className="font-semibold text-slate-100">{slice.value.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

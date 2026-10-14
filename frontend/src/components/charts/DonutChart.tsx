import { useState } from "react";

export interface DonutSegment {
  id: string;
  label: string;
  value: number;
  color: string;
  hoverColor: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  totalLabel?: string;
}

export default function DonutChart({
  segments,
  size = 200,
  strokeWidth = 24,
  totalLabel = "Total",
}: DonutChartProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;

  // Active or selected segment details for center
  const hoveredSegment = segments.find((s) => s.id === hoveredId);

  let accumulatedOffset = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
      {/* SVG Donut */}
      <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90 donut-svg-enter"
          style={{ overflow: "visible" }}
        >
          {/* Empty background circle if total is 0 */}
          {total === 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
            />
          )}

          {/* Slices */}
          {total > 0 &&
            segments.map((segment) => {
              const fraction = segment.value / total;
              const dashLength = fraction * circumference;
              const dashOffset = -accumulatedOffset;
              accumulatedOffset += dashLength;

              const isHovered = hoveredId === segment.id;
              const currentStrokeWidth = isHovered ? strokeWidth + 6 : strokeWidth;

              return (
                <circle
                  key={segment.id}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={isHovered ? segment.hoverColor : segment.color}
                  strokeWidth={currentStrokeWidth}
                  strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                  strokeDashoffset={dashOffset}
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setHoveredId(segment.id)}
                  onMouseLeave={() => setHoveredId(null)}
                />
              );
            })}
        </svg>

        {/* Center Text Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
          {hoveredSegment ? (
            <>
              <span className="text-[11px] font-bold uppercase tracking-wider text-surface-500">
                {hoveredSegment.label}
              </span>
              <span className="text-2xl font-black text-surface-900 mt-0.5">
                {hoveredSegment.value}
              </span>
              <span className="text-xs font-semibold text-brand-600">
                {total > 0 ? Math.round((hoveredSegment.value / total) * 100) : 0}%
              </span>
            </>
          ) : (
            <>
              <span className="text-[11px] font-bold uppercase tracking-wider text-surface-400">
                {totalLabel}
              </span>
              <span className="text-2xl font-black text-surface-900 mt-0.5">
                {total}
              </span>
              <span className="text-[11px] text-surface-400">
                {total === 1 ? "tarefa" : "tarefas"}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2.5 w-full max-w-[220px]">
        {segments.map((segment) => {
          const percent = total > 0 ? Math.round((segment.value / total) * 100) : 0;
          const isHovered = hoveredId === segment.id;

          return (
            <div
              key={segment.id}
              onMouseEnter={() => setHoveredId(segment.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`flex items-center justify-between rounded-xl p-2 transition-all cursor-pointer ${
                isHovered ? "bg-surface-100 shadow-2xs translate-x-1" : "hover:bg-surface-50"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="h-3 w-3 rounded-md shrink-0 shadow-xs"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-xs font-medium text-surface-700 truncate">
                  {segment.label}
                </span>
              </div>
              <div className="flex items-center gap-2 pl-2">
                <span className="text-xs font-bold text-surface-900 tabular-nums">
                  {segment.value}
                </span>
                <span className="text-[11px] font-medium text-surface-400 tabular-nums w-8 text-right">
                  {percent}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

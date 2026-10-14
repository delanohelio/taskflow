import React from "react";

interface RadialGaugeMeterProps {
  value: number; // 0 to 100
  title: string;
  subtitle?: string;
  size?: number;
  strokeWidth?: number;
  colorScheme?: "brand" | "emerald" | "blue" | "amber" | "rose";
  icon?: React.ReactNode;
}

const COLOR_MAPS = {
  brand: {
    gradientStart: "#6366f1",
    gradientEnd: "#4338ca",
    bgTrack: "#eef2ff",
    textColor: "text-brand-900",
    labelColor: "text-brand-600",
  },
  emerald: {
    gradientStart: "#10b981",
    gradientEnd: "#059669",
    bgTrack: "#ecfdf5",
    textColor: "text-emerald-900",
    labelColor: "text-emerald-600",
  },
  blue: {
    gradientStart: "#3b82f6",
    gradientEnd: "#1d4ed8",
    bgTrack: "#eff6ff",
    textColor: "text-blue-900",
    labelColor: "text-blue-600",
  },
  amber: {
    gradientStart: "#f59e0b",
    gradientEnd: "#d97706",
    bgTrack: "#fffbeb",
    textColor: "text-amber-900",
    labelColor: "text-amber-600",
  },
  rose: {
    gradientStart: "#f43f5e",
    gradientEnd: "#e11d48",
    bgTrack: "#fff1f2",
    textColor: "text-rose-900",
    labelColor: "text-rose-600",
  },
};

export default function RadialGaugeMeter({
  value,
  title,
  subtitle,
  size = 110,
  strokeWidth = 9,
  colorScheme = "brand",
  icon,
}: RadialGaugeMeterProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;
  const colors = COLOR_MAPS[colorScheme] || COLOR_MAPS.brand;
  const gradId = `gauge-grad-${colorScheme}-${title.replace(/\s+/g, "").toLowerCase()}`;

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.gradientStart} />
              <stop offset="100%" stopColor={colors.gradientEnd} />
            </linearGradient>
          </defs>

          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={colors.bgTrack}
            strokeWidth={strokeWidth}
          />

          {/* Value Progress Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={`url(#${gradId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="chart-gauge-animated"
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="flex items-center gap-0.5">
            <span className={`text-xl font-extrabold tracking-tight ${colors.textColor}`}>
              {Math.round(clamped)}
            </span>
            <span className="text-xs font-bold text-surface-400">%</span>
          </div>
          {icon && <div className="mt-0.5 text-surface-400">{icon}</div>}
        </div>
      </div>

      <span className="mt-2 text-xs font-bold text-surface-700">{title}</span>
      {subtitle && <span className="text-[11px] text-surface-400">{subtitle}</span>}
    </div>
  );
}

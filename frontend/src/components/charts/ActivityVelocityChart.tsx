import { useState } from "react";
import type { DayActivity } from "@/types/task";

interface ActivityVelocityChartProps {
  data: DayActivity[];
}

export default function ActivityVelocityChart({ data }: ActivityVelocityChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Compute maximum value for scaling
  const maxVal = Math.max(
    1,
    ...data.map((d) => Math.max(d.completed, d.created))
  );

  const totalCompleted = data.reduce((acc, d) => acc + d.completed, 0);
  const totalCreated = data.reduce((acc, d) => acc + d.created, 0);

  return (
    <div className="flex flex-col h-full justify-between">
      {/* Top Header Summary & Legend */}
      <div className="flex items-center justify-between pb-3 border-b border-surface-100 mb-4 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-xs" />
            <span className="text-surface-600 font-medium">Concluídas ({totalCompleted})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-500 shadow-xs" />
            <span className="text-surface-600 font-medium">Criadas ({totalCreated})</span>
          </div>
        </div>

        <div className="text-[11px] font-semibold text-surface-400">
          Últimos 7 dias
        </div>
      </div>

      {/* Bar Chart Area */}
      <div className="relative flex items-end justify-between gap-2 h-44 pt-6 px-1">
        {/* Background Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
          <div className="border-b border-surface-200 border-dashed w-full" />
          <div className="border-b border-surface-200 border-dashed w-full" />
          <div className="border-b border-surface-200 border-dashed w-full" />
        </div>

        {data.map((item, idx) => {
          const completedHeight = (item.completed / maxVal) * 100;
          const createdHeight = (item.created / maxVal) * 100;
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={item.date}
              className="relative flex flex-col items-center flex-1 h-full justify-end group cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Tooltip */}
              {isHovered && (
                <div className="absolute -top-10 z-20 whitespace-nowrap rounded-lg bg-surface-900 px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg pointer-events-none transform -translate-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400">{item.completed} concl.</span>
                    <span className="text-surface-400">|</span>
                    <span className="text-brand-300">{item.created} criadas</span>
                  </div>
                </div>
              )}

              {/* Bar Columns Container */}
              <div className="flex items-end gap-1 w-full justify-center h-full">
                {/* Completed Bar */}
                <div className="w-3.5 sm:w-4 bg-surface-100 rounded-t-md overflow-hidden h-full flex items-end">
                  <div
                    className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md transition-all duration-500 ease-out chart-bar-grow"
                    style={{
                      height: `${Math.max(item.completed > 0 ? 8 : 0, completedHeight)}%`,
                    }}
                  />
                </div>

                {/* Created Bar */}
                <div className="w-3.5 sm:w-4 bg-surface-100 rounded-t-md overflow-hidden h-full flex items-end">
                  <div
                    className="w-full bg-gradient-to-t from-brand-700 to-brand-400 rounded-t-md transition-all duration-500 ease-out chart-bar-grow"
                    style={{
                      height: `${Math.max(item.created > 0 ? 8 : 0, createdHeight)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Day Label */}
              <div className="mt-2 text-center">
                <span
                  className={`block text-[11px] font-bold ${
                    isHovered ? "text-brand-600" : "text-surface-600"
                  }`}
                >
                  {item.day_name}
                </span>
                <span className="block text-[9px] text-surface-400">
                  {item.date.slice(8, 10)}/{item.date.slice(5, 7)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

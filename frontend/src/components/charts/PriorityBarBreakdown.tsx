interface PriorityBarBreakdownProps {
  high: number;
  normal: number;
  low: number;
  total: number;
}

export default function PriorityBarBreakdown({
  high,
  normal,
  low,
  total,
}: PriorityBarBreakdownProps) {
  const highPct = total > 0 ? (high / total) * 100 : 0;
  const normalPct = total > 0 ? (normal / total) * 100 : 0;
  const lowPct = total > 0 ? (low / total) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Segmented Gradient Progress Bar */}
      <div className="h-4 w-full rounded-full bg-surface-100 flex overflow-hidden p-0.5 border border-surface-200">
        {highPct > 0 && (
          <div
            className="h-full bg-gradient-to-r from-red-500 to-rose-500 rounded-l-full transition-all duration-500"
            style={{ width: `${highPct}%` }}
            title={`Alta: ${high} (${Math.round(highPct)}%)`}
          />
        )}
        {normalPct > 0 && (
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
            style={{ width: `${normalPct}%` }}
            title={`Normal: ${normal} (${Math.round(normalPct)}%)`}
          />
        )}
        {lowPct > 0 && (
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-indigo-400 rounded-r-full transition-all duration-500"
            style={{ width: `${lowPct}%` }}
            title={`Baixa: ${low} (${Math.round(lowPct)}%)`}
          />
        )}
      </div>

      {/* Priority Legend Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="flex flex-col rounded-xl border border-red-200/80 bg-red-50/50 p-2.5 text-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">Alta</span>
          <span className="text-lg font-black text-red-900 mt-0.5">{high}</span>
          <span className="text-[10px] text-red-600 font-semibold">{Math.round(highPct)}%</span>
        </div>

        <div className="flex flex-col rounded-xl border border-amber-200/80 bg-amber-50/50 p-2.5 text-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Normal</span>
          <span className="text-lg font-black text-amber-900 mt-0.5">{normal}</span>
          <span className="text-[10px] text-amber-600 font-semibold">{Math.round(normalPct)}%</span>
        </div>

        <div className="flex flex-col rounded-xl border border-blue-200/80 bg-blue-50/50 p-2.5 text-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Baixa</span>
          <span className="text-lg font-black text-blue-900 mt-0.5">{low}</span>
          <span className="text-[10px] text-blue-600 font-semibold">{Math.round(lowPct)}%</span>
        </div>
      </div>
    </div>
  );
}

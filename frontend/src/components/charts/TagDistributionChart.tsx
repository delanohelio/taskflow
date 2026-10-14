import type { TagMetric } from "@/types/task";
import TagBadge from "@/components/ui/TagBadge";

interface TagDistributionChartProps {
  tags: TagMetric[];
  totalTasks: number;
}

export default function TagDistributionChart({ tags, totalTasks }: TagDistributionChartProps) {
  if (tags.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-surface-400">
        <p className="text-xs">Nenhuma tag cadastrada nas tarefas ainda.</p>
      </div>
    );
  }

  const maxCount = Math.max(1, ...tags.map((t) => t.count));

  return (
    <div className="space-y-3">
      {tags.map((item) => {
        const percentOfMax = (item.count / maxCount) * 100;
        const percentOfTotal = totalTasks > 0 ? Math.round((item.count / totalTasks) * 100) : 0;

        return (
          <div key={item.tag} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <TagBadge tag={item.tag} />
              </div>
              <div className="flex items-center gap-2 text-surface-500 font-semibold">
                <span className="text-surface-800">{item.count}</span>
                <span className="text-[10px] text-surface-400">({percentOfTotal}%)</span>
              </div>
            </div>

            <div className="h-2 w-full rounded-full bg-surface-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-indigo-600 transition-all duration-500"
                style={{ width: `${percentOfMax}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

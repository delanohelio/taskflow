/** Priority indicator dot with color and optional pulse animation. */

import { PRIORITY_CONFIG } from "@/utils/constants";
import type { Priority } from "@/types/task";

interface PriorityIndicatorProps {
  priority: Priority;
  showLabel?: boolean;
}

export default function PriorityIndicator({
  priority,
  showLabel = false,
}: PriorityIndicatorProps) {
  const config = PRIORITY_CONFIG[priority];

  return (
    <span className="inline-flex items-center gap-1.5" title={`Prioridade: ${config.label}`}>
      <span
        className={`inline-block h-2 w-2 rounded-full ${config.dotClass}`}
        aria-hidden="true"
      />
      {showLabel && (
        <span className="text-xs font-medium text-surface-500">
          {config.label}
        </span>
      )}
    </span>
  );
}

/** Priority indicator dot with color and optional pulse animation. */

import { PRIORITY_CONFIG } from "@/utils/constants";
import type { Priority } from "@/types/task";

interface PriorityIndicatorProps {
  priority: Priority;
  showLabel?: boolean;
  hideLabelOnMobile?: boolean;
}

export default function PriorityIndicator({
  priority,
  showLabel = false,
  hideLabelOnMobile = false,
}: PriorityIndicatorProps) {
  const config = PRIORITY_CONFIG[priority];

  return (
    <span className="inline-flex items-center gap-1.5 shrink-0" title={`Prioridade: ${config.label}`}>
      <span
        className={`inline-block h-2 w-2 rounded-full shrink-0 ${config.dotClass}`}
        aria-hidden="true"
      />
      {showLabel && (
        <span className={`text-xs font-medium text-surface-500 ${hideLabelOnMobile ? "hidden sm:inline" : ""}`}>
          {config.label}
        </span>
      )}
    </span>
  );
}


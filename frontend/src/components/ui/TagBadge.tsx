/** Colored badge for a task tag. */

import { getTagColor } from "@/utils/constants";

interface TagBadgeProps {
  tag: string;
  onClick?: (tag: string) => void;
  active?: boolean;
}

export default function TagBadge({ tag, onClick, active = false }: TagBadgeProps) {
  const colorClass = getTagColor(tag);
  const interactiveClass = onClick
    ? "cursor-pointer hover:opacity-80 transition-opacity"
    : "";
  const activeClass = active ? "ring-2 ring-brand-500 ring-offset-1" : "";

  return (
    <span
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={() => onClick?.(tag)}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick(tag);
        }
      }}
      className={`
        inline-flex items-center rounded-full border px-2 py-0.5
        text-[11px] font-medium leading-none
        ${colorClass} ${interactiveClass} ${activeClass}
      `}
    >
      {tag}
    </span>
  );
}

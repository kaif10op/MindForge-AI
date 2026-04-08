"use client";

import type { Tag } from "@/types/database";

interface TagBadgeProps {
  tag: Tag;
  size?: "sm" | "md";
  removable?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
}

export function TagBadge({
  tag,
  size = "sm",
  removable = false,
  onClick,
  onRemove,
}: TagBadgeProps) {
  return (
    <span
      className={`tag-badge inline-flex items-center gap-1 rounded-full font-medium transition-all duration-200 ${
        size === "sm"
          ? "px-2 py-0.5 text-[10px]"
          : "px-2.5 py-1 text-xs"
      } ${onClick ? "cursor-pointer hover:scale-105" : ""}`}
      style={{
        backgroundColor: `${tag.color}18`,
        color: tag.color,
        border: `1px solid ${tag.color}30`,
      }}
      onClick={onClick}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: tag.color }}
      />
      {tag.name}
      {removable && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 hover:opacity-70 transition-opacity cursor-pointer"
          aria-label={`Remove tag ${tag.name}`}
        >
          ×
        </button>
      )}
    </span>
  );
}

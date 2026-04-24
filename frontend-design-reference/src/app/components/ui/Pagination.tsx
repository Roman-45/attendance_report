import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Number of page buttons to show on each side of the active page. Default: 1 */
  siblingCount?: number;
  /** Show "X of Y pages" info label. Default: true */
  showInfo?: boolean;
  className?: string;
}

const DOTS = "DOTS" as const;
type PageItem = number | typeof DOTS;

// ─── Hook — page range ────────────────────────────────────────────────────────

function usePaginationRange(
  currentPage: number,
  totalPages: number,
  siblingCount: number
): PageItem[] {
  return useMemo(() => {
    const range = (start: number, end: number): number[] =>
      Array.from({ length: end - start + 1 }, (_, i) => start + i);

    // Total slots: siblings×2 + currentPage + 2 boundary pages + 2 DOTS slots
    const totalSlots = siblingCount * 2 + 5;

    // Show all pages when they fit
    if (totalSlots >= totalPages) {
      return range(1, totalPages);
    }

    const leftSibling = Math.max(currentPage - siblingCount, 1);
    const rightSibling = Math.min(currentPage + siblingCount, totalPages);
    const showLeftDots = leftSibling > 2;
    const showRightDots = rightSibling < totalPages - 2;

    if (!showLeftDots && showRightDots) {
      const leftCount = 3 + 2 * siblingCount;
      return [...range(1, leftCount), DOTS, totalPages];
    }

    if (showLeftDots && !showRightDots) {
      const rightCount = 3 + 2 * siblingCount;
      return [1, DOTS, ...range(totalPages - rightCount + 1, totalPages)];
    }

    // Both dots
    return [1, DOTS, ...range(leftSibling, rightSibling), DOTS, totalPages];
  }, [currentPage, totalPages, siblingCount]);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PageButton({
  page,
  isActive,
  onClick,
}: {
  page: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      aria-label={`Page ${page}`}
      className={[
        "min-w-[32px] h-8 px-2 rounded-md text-[13px] font-medium transition-all duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        isActive
          ? "bg-brand text-white shadow-sm"
          : "text-foreground hover:bg-background border border-transparent hover:border-border",
      ].join(" ")}
    >
      {page}
    </button>
  );
}

function NavButton({
  direction,
  disabled,
  onClick,
  label,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={[
        "flex items-center gap-1.5 h-8 px-2.5 rounded-md text-[13px] font-medium",
        "border border-border bg-white text-foreground",
        "transition-all duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        disabled
          ? "opacity-40 pointer-events-none"
          : "hover:bg-background hover:border-border-strong",
      ].join(" ")}
    >
      {direction === "prev" && <ChevronLeft size={14} strokeWidth={2} />}
      <span className="hidden sm:inline">{label}</span>
      {direction === "next" && <ChevronRight size={14} strokeWidth={2} />}
    </button>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  showInfo = true,
  className = "",
}: PaginationProps) {
  const pages = usePaginationRange(currentPage, totalPages, siblingCount);

  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className={`flex items-center justify-between gap-4 flex-wrap ${className}`}
    >
      {/* Info label */}
      {showInfo && (
        <p className="text-[12px] text-muted-foreground order-2 sm:order-1">
          Page <span className="font-medium text-foreground">{currentPage}</span>{" "}
          of <span className="font-medium text-foreground">{totalPages}</span>
        </p>
      )}

      {/* Controls */}
      <div className="flex items-center gap-1 order-1 sm:order-2 flex-wrap">
        <NavButton
          direction="prev"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          label="Previous"
        />

        <div className="flex items-center gap-1 mx-1">
          {pages.map((page, idx) =>
            page === DOTS ? (
              <span
                key={`dots-${idx}`}
                className="flex items-center justify-center w-8 h-8 text-muted-foreground"
                aria-hidden="true"
              >
                <MoreHorizontal size={14} strokeWidth={2} />
              </span>
            ) : (
              <PageButton
                key={page}
                page={page}
                isActive={page === currentPage}
                onClick={() => onPageChange(page)}
              />
            )
          )}
        </div>

        <NavButton
          direction="next"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          label="Next"
        />
      </div>
    </nav>
  );
}

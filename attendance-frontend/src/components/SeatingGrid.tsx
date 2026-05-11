import { useState } from 'react'
import type { ClassroomLayout, SeatAssignment } from '@/types'
import { cn } from '@/lib/utils'
import { User, Monitor } from 'lucide-react'

interface SeatingGridProps {
  layout: ClassroomLayout
  onSeatClick?: (row: number, col: number, assignment?: SeatAssignment) => void
  readOnly?: boolean
  highlightStudentId?: number
}

const COL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

export function SeatingGrid({ layout, onSeatClick, readOnly = false, highlightStudentId }: SeatingGridProps) {
  const { totalRows, columnsPerRow, columnGroups, seats } = layout
  const seatsPerGroup = columnsPerRow / columnGroups
  const [hoveredSeat, setHoveredSeat] = useState<string | null>(null)

  const seatMap = new Map<string, SeatAssignment>()
  seats.forEach(s => seatMap.set(`${s.rowNumber}-${s.columnNumber}`, s))

  const totalSeats = totalRows * columnsPerRow
  const assignedCount = seats.length
  const occupancyPercent = Math.round((assignedCount / totalSeats) * 100)

  return (
    <div className="flex flex-col items-center select-none w-full">
      <div className="w-full max-w-2xl mx-auto">

        {/* Whiteboard / Projector Screen */}
        <div className="relative mx-4 mb-6">
          <div className="bg-gradient-to-b from-[#F1F5F9] to-[#F8FAFC] dark:from-[#1E293B] dark:to-[#1E293B]/80 border-2 border-[#CBD5E1] dark:border-[#475569] rounded-xl px-6 py-4 text-center shadow-inner">
            <Monitor className="h-5 w-5 mx-auto mb-1 text-[#94A3B8] dark:text-[#64748B]" />
            <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#94A3B8] dark:text-[#64748B]">
              Whiteboard / Projector
            </span>
          </div>
          <div className="h-3 mx-8 bg-gradient-to-b from-[#E2E8F0]/60 to-transparent dark:from-[#334155]/40 rounded-b-full" />
        </div>

        {/* Teacher's Desk */}
        <div className="flex justify-center mb-8">
          <div className="relative bg-[#FFFBEB] dark:bg-[#D97706]/10 border-2 border-[#FDE68A] dark:border-[#D97706]/30 rounded-lg px-8 py-2 shadow-sm">
            <span className="text-[10px] font-semibold tracking-wider uppercase text-[#D97706]">
              Teacher&apos;s Desk
            </span>
          </div>
        </div>

        {/* Occupancy Stats */}
        <div className="flex items-center justify-between mx-4 mb-4 px-4 py-2.5 bg-[#F8FAFC] dark:bg-[#1E293B]/50 rounded-lg border border-[#E2E8F0] dark:border-[#1E3A5F]">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9]">{assignedCount}</span>
            <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">of {totalSeats} seats assigned</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-[#E2E8F0] dark:bg-[#334155] rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  occupancyPercent < 50 && "bg-gradient-to-r from-[#4F46E5] to-[#818CF8]",
                  occupancyPercent >= 50 && occupancyPercent < 80 && "bg-gradient-to-r from-[#059669] to-[#0D9488]",
                  occupancyPercent >= 80 && "bg-gradient-to-r from-[#D97706] to-[#EA580C]",
                )}
                style={{ width: `${occupancyPercent}%` }}
              />
            </div>
            <span className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">{occupancyPercent}%</span>
          </div>
        </div>

        {/* Column Labels */}
        <div className="flex items-center justify-center gap-0 mx-4 mb-1">
          <span className="w-8" />
          <div className="flex gap-1">
            {Array.from({ length: seatsPerGroup }, (_, i) => (
              <span key={`l-${i}`} className="w-[52px] text-center text-[10px] font-bold text-[#94A3B8] dark:text-[#64748B] uppercase">
                {COL_LABELS[i]}
              </span>
            ))}
          </div>
          <div className="w-10" />
          <div className="flex gap-1">
            {Array.from({ length: seatsPerGroup }, (_, i) => (
              <span key={`r-${i}`} className="w-[52px] text-center text-[10px] font-bold text-[#94A3B8] dark:text-[#64748B] uppercase">
                {COL_LABELS[seatsPerGroup + i]}
              </span>
            ))}
          </div>
          <span className="w-8" />
        </div>

        {/* Seat Rows */}
        <div className="mx-4 space-y-1.5">
          {Array.from({ length: totalRows }, (_, rowIdx) => {
            const rowNum = rowIdx + 1
            return (
              <div key={rowNum} className="flex items-center justify-center gap-0">
                <span className="w-8 text-right text-xs text-[#94A3B8] dark:text-[#64748B] font-mono pr-2 select-none font-medium">
                  {rowNum}
                </span>

                <div className="flex gap-1">
                  {Array.from({ length: seatsPerGroup }, (_, seatIdx) => {
                    const colNum = seatIdx + 1
                    return (
                      <SeatButton
                        key={colNum}
                        rowNum={rowNum}
                        colNum={colNum}
                        seatMap={seatMap}
                        hoveredSeat={hoveredSeat}
                        setHoveredSeat={setHoveredSeat}
                        readOnly={readOnly}
                        highlightStudentId={highlightStudentId}
                        onSeatClick={onSeatClick}
                      />
                    )
                  })}
                </div>

                {/* Aisle */}
                <div className="w-10 flex items-center justify-center">
                  <div className="w-[2px] h-8 rounded-full bg-[#E2E8F0] dark:bg-[#334155]/60" />
                </div>

                <div className="flex gap-1">
                  {Array.from({ length: seatsPerGroup }, (_, seatIdx) => {
                    const colNum = seatsPerGroup + seatIdx + 1
                    return (
                      <SeatButton
                        key={colNum}
                        rowNum={rowNum}
                        colNum={colNum}
                        seatMap={seatMap}
                        hoveredSeat={hoveredSeat}
                        setHoveredSeat={setHoveredSeat}
                        readOnly={readOnly}
                        highlightStudentId={highlightStudentId}
                        onSeatClick={onSeatClick}
                      />
                    )
                  })}
                </div>

                <span className="w-8 text-left text-xs text-[#94A3B8] dark:text-[#64748B] font-mono pl-2 select-none font-medium">
                  {rowNum}
                </span>
              </div>
            )
          })}
        </div>

        {/* Back Wall */}
        <div className="mx-4 mt-6 mb-2">
          <div className="h-2 bg-[#E2E8F0] dark:bg-[#334155] rounded-full mx-8" />
          <p className="text-center text-[10px] text-[#94A3B8] dark:text-[#64748B] font-medium tracking-wider uppercase mt-1.5">
            Back of Classroom
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-5 text-xs text-[#64748B] dark:text-[#94A3B8]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FFFFFF] dark:bg-[#1E293B] border-2 border-dashed border-[#CBD5E1] dark:border-[#475569]" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] shadow-sm shadow-[#4F46E5]/20" />
            <span>Occupied</span>
          </div>
          {highlightStudentId && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#D97706] to-[#EA580C] shadow-sm shadow-[#D97706]/25 ring-2 ring-[#FCD34D] ring-offset-1" />
              <span>Your Seat</span>
            </div>
          )}
          {!readOnly && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#FFFFFF] dark:bg-[#1E293B] border-2 border-[#4F46E5]/50 shadow-sm shadow-[#4F46E5]/10" />
              <span>Click to assign</span>
            </div>
          )}
        </div>
      </div>

      {/* Hover Tooltip */}
      {hoveredSeat && (() => {
        const assignment = seatMap.get(hoveredSeat)
        if (!assignment) return null
        const seatLabel = `Row ${assignment.rowNumber}, Seat ${COL_LABELS[assignment.columnNumber - 1]}`
        return (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-[#0F172A] dark:bg-[#FFFFFF] text-white dark:text-[#0F172A] pl-3 pr-5 py-2.5 rounded-2xl shadow-2xl text-sm flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200 backdrop-blur-sm">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center shadow-inner">
              <User className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-[13px] leading-tight">{assignment.studentName}</p>
              <p className="text-[11px] opacity-60">{seatLabel}</p>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

/* Individual Seat Component */

function SeatButton({
  rowNum,
  colNum,
  seatMap,
  hoveredSeat,
  setHoveredSeat,
  readOnly,
  highlightStudentId,
  onSeatClick,
}: {
  rowNum: number
  colNum: number
  seatMap: Map<string, SeatAssignment>
  hoveredSeat: string | null
  setHoveredSeat: (v: string | null) => void
  readOnly: boolean
  highlightStudentId?: number
  onSeatClick?: (row: number, col: number, assignment?: SeatAssignment) => void
}) {
  const key = `${rowNum}-${colNum}`
  const assignment = seatMap.get(key)
  const isHighlighted = highlightStudentId != null && assignment?.studentId === highlightStudentId
  const isHovered = hoveredSeat === key
  const label = COL_LABELS[colNum - 1] || String(colNum)

  return (
    <button
      disabled={readOnly && !assignment}
      onClick={() => onSeatClick?.(rowNum, colNum, assignment)}
      onMouseEnter={() => setHoveredSeat(key)}
      onMouseLeave={() => setHoveredSeat(null)}
      title={assignment ? assignment.studentName : `Seat ${rowNum}${label} — Available`}
      className={cn(
        "relative w-[52px] h-10 rounded-lg text-[10px] font-semibold transition-all duration-200 flex flex-col items-center justify-center gap-0.5 group",

        // Empty seat
        !assignment && [
          "bg-[#FFFFFF] dark:bg-[#1E293B] border-2 border-dashed border-[#CBD5E1] dark:border-[#475569] text-[#94A3B8] dark:text-[#64748B]",
          !readOnly && "hover:border-[#4F46E5]/60 hover:bg-[#EEF2FF] dark:hover:bg-[#4F46E5]/10 hover:text-[#4F46E5] cursor-pointer hover:scale-[1.08] hover:shadow-md hover:shadow-[#4F46E5]/10",
          readOnly && "cursor-default opacity-50",
        ],

        // Assigned seat
        assignment && !isHighlighted && [
          "bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white shadow-md shadow-[#4F46E5]/20 border border-[#4338CA]/30",
          !readOnly && "hover:from-[#4338CA] hover:to-[#6D28D9] hover:shadow-lg hover:shadow-[#4F46E5]/30 cursor-pointer hover:scale-[1.08]",
          readOnly && "cursor-default",
          isHovered && "ring-2 ring-[#818CF8] dark:ring-[#818CF8] ring-offset-2 scale-[1.08]",
        ],

        // Highlighted seat (your seat)
        isHighlighted && [
          "bg-gradient-to-br from-[#D97706] to-[#EA580C] text-white shadow-lg shadow-[#D97706]/30 border border-[#D97706]/30",
          "ring-2 ring-[#FCD34D] ring-offset-2",
          readOnly && "cursor-default",
        ],
      )}
    >
      {assignment ? (
        <>
          <User className="h-3.5 w-3.5 opacity-90" />
          <span className="truncate max-w-[44px] text-[8px] leading-none opacity-90">
            {assignment.studentName.split(' ')[0]}
          </span>
        </>
      ) : (
        <>
          <span className="font-mono text-[11px] font-bold">{rowNum}{label}</span>
        </>
      )}
    </button>
  )
}

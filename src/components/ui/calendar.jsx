import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

// Helper to generate a range of years
function getYearRange(start, end) {
  const years = []
  for (let y = start; y <= end; y++) years.push(y)
  return years
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}) {
  // Add state for month/year selection
  const [displayMonth, setDisplayMonth] = React.useState(() => {
    if (props.selected) return new Date(props.selected)
    return new Date()
  })
  const currentYear = new Date().getFullYear()
  const years = getYearRange(currentYear - 5, currentYear + 1)
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  return (
    <div>
      <div className="flex justify-center gap-2 mb-2">
        <select
          className="border rounded px-2 py-1 text-sm"
          value={displayMonth.getFullYear()}
          onChange={e => {
            const newDate = new Date(displayMonth)
            newDate.setFullYear(Number(e.target.value))
            setDisplayMonth(newDate)
            if (props.onMonthChange) props.onMonthChange(newDate)
          }}
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select
          className="border rounded px-2 py-1 text-sm"
          value={displayMonth.getMonth()}
          onChange={e => {
            const newDate = new Date(displayMonth)
            newDate.setMonth(Number(e.target.value))
            setDisplayMonth(newDate)
            if (props.onMonthChange) props.onMonthChange(newDate)
          }}
        >
          {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
        </select>
      </div>
      <DayPicker
        showOutsideDays={showOutsideDays}
        month={displayMonth}
        onMonthChange={setDisplayMonth}
        className={cn("p-3", className)}
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-medium",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell:
            "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
          row: "flex w-full mt-2",
          cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          day: cn(
            buttonVariants({ variant: "ghost" }),
            "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
          ),
          day_selected:
            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground",
          day_outside: "text-muted-foreground opacity-50",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle:
            "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
          ...classNames,
        }}
        components={{
          IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
          IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
        }}
        {...props}
      />
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }

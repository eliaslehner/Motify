import { Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface TimePickerProps {
  value: string
  onChange: (time: string) => void
  className?: string
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  const [hours, minutes] = value.split(':').map(Number)

  const handleHourChange = (hour: number) => {
    const newTime = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    onChange(newTime)
  }

  const handleMinuteChange = (minute: number) => {
    const newTime = `${hours.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    onChange(newTime)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal bg-background",
            !value && "text-muted-foreground",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value || "Pick a time"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0" align="start">
        <div className="flex divide-x divide-border">
          {/* Hours */}
          <div className="flex flex-col w-24">
            <div className="px-3 py-2 text-center text-sm font-medium border-b border-border bg-muted/50">
              Hours
            </div>
            <div className="max-h-40 overflow-y-auto py-2">
              {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                <Button
                  key={hour}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-center h-8",
                    hours === hour 
                      ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" 
                      : "text-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  onClick={() => handleHourChange(hour)}
                >
                  {hour.toString().padStart(2, '0')}
                </Button>
              ))}
            </div>
          </div>

          {/* Minutes */}
          <div className="flex flex-col w-24">
            <div className="px-3 py-2 text-center text-sm font-medium border-b border-border bg-muted/50">
              Minutes
            </div>
            <div className="max-h-40 overflow-y-auto py-2">
              {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                <Button
                  key={minute}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-center h-8",
                    minutes === minute 
                      ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" 
                      : "text-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  onClick={() => handleMinuteChange(minute)}
                >
                  {minute.toString().padStart(2, '0')}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
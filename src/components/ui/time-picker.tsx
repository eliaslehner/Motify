import { Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface TimePickerProps {
  value: string
  onChange: (time: string) => void
  className?: string
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  const [hours, minutes] = value.split(':').map(Number)

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let hour = parseInt(e.target.value) || 0
    // Clamp hours between 0 and 23
    hour = Math.max(0, Math.min(23, hour))
    const newTime = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    onChange(newTime)
  }

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let minute = parseInt(e.target.value) || 0
    // Clamp minutes between 0 and 59
    minute = Math.max(0, Math.min(59, minute))
    const newTime = `${hours.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    onChange(newTime)
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-2 w-full">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <Input
          type="number"
          min="0"
          max="23"
          value={hours.toString().padStart(2, '0')}
          onChange={handleHourChange}
          className="w-16 text-center bg-background"
          placeholder="HH"
        />
        <span className="text-muted-foreground">:</span>
        <Input
          type="number"
          min="0"
          max="59"
          value={minutes.toString().padStart(2, '0')}
          onChange={handleMinuteChange}
          className="w-16 text-center bg-background"
          placeholder="MM"
        />
      </div>
    </div>
  )
}
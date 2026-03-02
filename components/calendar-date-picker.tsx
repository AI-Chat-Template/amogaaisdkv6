import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { usePathname } from "next/navigation";

const buttonClass = "h-8 border border shadow-sm transition-colors";

export const CalendarDatePicker = ({
  date,
  onDateSelect,
  placeholder,
}: {
  date: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  placeholder: string;
}) => {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(date);
  const path = usePathname();
  const isTask = path.includes("Tasks");
  const isView = path.includes("view");
  const isPlanPhase = path.includes("planPhase");
  const isMsg = path.includes("Msg");
  const isDoBox = path.includes("DoBox");
  const isProjects = path.includes("Projects");
  const isStoryMaker = path.includes("StoryMaker");

  useEffect(() => {
    setSelectedDate(date);
  }, [date]);

  const handleSelect = (newDate: Date | undefined) => {
    if (newDate) {
      // Set the time to the start of the day for consistency
      newDate.setHours(0, 0, 0, 0);
    }
    setSelectedDate(newDate);
    onDateSelect(newDate);
    setOpen(false);
  };

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={isView}
            className={cn(
              buttonClass,
              `${
                isTask ||
                isProjects ||
                isDoBox ||
                isPlanPhase ||
                isMsg ||
                isStoryMaker
                  ? "w-full"
                  : "w-[200px]"
              } justify-start text-left font-normal`,
              !selectedDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? (
              format(selectedDate, "LLL dd, y")
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

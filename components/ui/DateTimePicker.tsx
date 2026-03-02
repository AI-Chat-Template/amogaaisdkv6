"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";

interface EnhancedDateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  setInput: (value: string) => void;
  form: any;
  field: any;
}

export function DateTimePicker({
  value,
  onChange,
  setInput,
  form,
  field,
}: EnhancedDateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const hours = value.getHours();
  const minutes = value.getMinutes();
  const period = hours >= 12 ? "PM" : "AM";

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      const updatedDate = new Date(newDate);

      // Use existing value's time
      updatedDate.setHours(value.getHours(), value.getMinutes());
      onChange(updatedDate);

      // Format and update setInput
      const formattedDate = updatedDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const hours = updatedDate.getHours() % 12 || 12;
      const minutes = updatedDate.getMinutes().toString().padStart(2, "0");
      const period = updatedDate.getHours() >= 12 ? "PM" : "AM";
      setInput(`${formattedDate} ${hours}:${minutes} ${period}`);
      if (form && field) {
        form.setValue(
          field.name,
          `${formattedDate} ${hours}:${minutes} ${period}`,
          {
            shouldValidate: true,
            shouldDirty: true,
          }
        );
      }
    }
  };

  const handleTimeChange = (newTime: { hours: number; minutes: number }) => {
    const updatedDate = new Date(value);

    // Set new time while keeping the existing date
    updatedDate.setHours(newTime.hours, newTime.minutes);
    onChange(updatedDate);

    // Format and update setInput
    const formattedDate = updatedDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const hours = newTime.hours % 12 || 12;
    const minutes = newTime.minutes.toString().padStart(2, "0");
    const period = newTime.hours >= 12 ? "PM" : "AM";
    setInput(`${formattedDate} ${hours}:${minutes} ${period}`);
    if (form && field) {
      form.setValue(
        field.name,
        `${formattedDate} ${hours}:${minutes} ${period}`,
        {
          shouldValidate: true,
          shouldDirty: true,
        }
      );
    }
  };

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHours = Math.min(Math.max(parseInt(e.target.value) || 0, 1), 12);
    handleTimeChange({
      hours: period === "PM" ? (newHours % 12) + 12 : newHours % 12,
      minutes,
    });
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMinutes = Math.min(Math.max(parseInt(e.target.value) || 0, 0), 59);
    handleTimeChange({ hours, minutes: newMinutes });
  };

  // const togglePeriod = () => {
  //   const newHours = (hours + 12) % 24
  //   handleTimeChange(newHours, minutes)
  // }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP p") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleDateChange}
          initialFocus
        />
        <div className="p-3 border-t flex items-center space-x-2">
          <Clock className="h-4 w-4" />
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              min={1}
              max={12}
              //   value={hours % 12 || 12}
              onChange={handleHourChange}
              className="w-14"
            />
            <span>:</span>
            <Input
              type="number"
              min={0}
              max={59}
              //   value={minutes.toString().padStart(2, '0')}
              onChange={handleMinuteChange}
              className="w-14"
            />
            <div className="flex">
              <Button
                onClick={() => handleTimeChange({ hours: hours % 12, minutes })}
                size="sm"
                variant={period === "AM" ? "default" : "outline"}
                className="rounded-r-none"
              >
                AM
              </Button>
              <Button
                onClick={() =>
                  handleTimeChange({ hours: (hours % 12) + 12, minutes })
                }
                size="sm"
                variant={period === "PM" ? "default" : "outline"}
                className="rounded-l-none"
              >
                PM
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

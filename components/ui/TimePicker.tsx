"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

interface TimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  setInput: (value: string) => void;
  form: any;
  field: any;
}

export function TimePicker({
  value,
  onChange,
  setInput,
  form,
  field,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const hours = value.getHours();
  const minutes = value.getMinutes();
  const period = hours >= 12 ? "PM" : "AM";

  const handleTimeChange = (newHours: number, newMinutes: number) => {
    const updatedDate = new Date(value);
    updatedDate.setHours(newHours, newMinutes);
    onChange(updatedDate);
    setInput(
      `${newHours % 12 || 12}:${newMinutes
        .toString()
        .padStart(2, "0")} ${period}`
    );
    if (form && field) {
      form.setValue(
        field.name,
        `${newHours % 12 || 12}:${newMinutes
          .toString()
          .padStart(2, "0")} ${period}`,
        {
          shouldValidate: true,
          shouldDirty: true,
        }
      );
    }
  };

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHours = Math.min(Math.max(parseInt(e.target.value) || 0, 1), 12);
    handleTimeChange(
      period === "PM" ? (newHours % 12) + 12 : newHours % 12,
      minutes
    );
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMinutes = Math.min(Math.max(parseInt(e.target.value) || 0, 0), 59);
    handleTimeChange(hours, newMinutes);
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
          <Clock className="mr-2 h-4 w-4" />
          {value ? (
            `${hours % 12 || 12}:${minutes
              .toString()
              .padStart(2, "0")} ${period}`
          ) : (
            <span>Pick a time</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 flex items-center space-x-2">
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
                onClick={() => handleTimeChange(hours % 12, minutes)}
                size="sm"
                variant={period === "AM" ? "default" : "outline"}
                className="rounded-r-none"
              >
                AM
              </Button>
              <Button
                onClick={() => handleTimeChange((hours % 12) + 12, minutes)}
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

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

interface TimeRangePickerProps {
  fromTime: Date;
  toTime: Date;
  onFromTimeChange: (date: Date) => void;
  onToTimeChange: (date: Date) => void;
  setInput: (value: string) => void;
  form: any;
  field: any;
}

function SingleTimePicker({
  value,
  onChange,
  setInput,
}: {
  value: Date;
  onChange: (date: Date) => void;
  setInput: (value: string) => void;
}) {
  const hours = value.getHours();
  const minutes = value.getMinutes();
  const period = hours >= 12 ? "PM" : "AM";

  const handleTimeChange = (newHours: number, newMinutes: number) => {
    const updatedDate = new Date(value);
    updatedDate.setHours(newHours, newMinutes);
    onChange(updatedDate);
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

  return (
    <div className="flex items-center space-x-2">
      <Input
        type="number"
        min={1}
        max={12}
        // value={hours % 12 || 12}
        onChange={handleHourChange}
        className="w-14"
      />
      <span>:</span>
      <Input
        type="number"
        min={0}
        max={59}
        // value={minutes.toString().padStart(2, "0")}
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
  );
}

export function TimeRangePicker({
  fromTime,
  toTime,
  onFromTimeChange,
  onToTimeChange,
  setInput,
  form,
  field,
}: TimeRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const formatTime = (date: Date) => {
    const hours = date.getHours() % 12 || 12;
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const period = date.getHours() >= 12 ? "PM" : "AM";
    return `${hours}:${minutes} ${period}`;
  };

  const handleTimeChange = (timeType: "from" | "to", newTime: Date) => {
    if (timeType === "from") {
      onFromTimeChange(newTime);
      updateFormValue(newTime, toTime);
    } else {
      onToTimeChange(newTime);
      updateFormValue(fromTime, newTime);
    }
  };

  const updateFormValue = (fromDate: Date, toDate: Date) => {
    const formattedFromTime = formatTime(fromDate);
    const formattedToTime = formatTime(toDate);
    const formattedValue = `From : ${formattedFromTime}, To : ${formattedToTime}`;

    setInput(formattedValue);

    if (form && field) {
      form.setValue(field.name, `${formattedFromTime} - ${formattedToTime}`, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !fromTime && !toTime && "text-muted-foreground"
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {fromTime && toTime ? (
            `From : ${formatTime(fromTime)}, To : ${formatTime(toTime)}`
          ) : (
            <span>From Time: To Time</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 space-y-3">
          <div>
            <h4 className="font-medium mb-2">From</h4>
            <SingleTimePicker
              value={fromTime}
              onChange={(newDate) => handleTimeChange("from", newDate)}
              setInput={setInput}
            />
          </div>
          <div>
            <h4 className="font-medium mb-2">To</h4>
            <SingleTimePicker
              value={toTime}
              onChange={(newDate) => handleTimeChange("to", newDate)}
              setInput={setInput}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

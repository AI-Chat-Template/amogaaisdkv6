import { CheckIcon } from "lucide-react";

interface ProgressIndicatorProps {
  steps: string[];
  currentStep: number;
}

export default function ProgressIndicator({
  steps,
  currentStep,
}: ProgressIndicatorProps) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 flex items-center justify-center rounded-full ${
                index <= currentStep
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {index < currentStep ? (
                <CheckIcon className="w-6 h-6" />
              ) : (
                <span className="text-lg font-semibold">{index + 1}</span>
              )}
            </div>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`h-0.5 flex-1 mx-2 ${
                index < currentStep ? "bg-primary" : "bg-secondary"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

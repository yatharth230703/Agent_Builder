import { cn } from "@/lib/utils";

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
}

const stepLabels = [
  "Approach",
  "Framework", 
  "Provider",
  "Tools",
  "Database",
  "Review"
];

export function WizardProgress({ currentStep, totalSteps }: WizardProgressProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber <= currentStep;
          const isCurrent = stepNumber === currentStep;
          
          return (
            <div key={stepNumber} className="flex items-center">
              <div className="flex items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-semibold",
                    isActive
                      ? "bg-phil-purple text-white"
                      : "bg-gray-300 text-gray-600"
                  )}
                >
                  {stepNumber}
                </div>
                <span
                  className={cn(
                    "ml-2 font-medium",
                    isActive ? "text-phil-dark" : "text-gray-600"
                  )}
                >
                  {stepLabels[index]}
                </span>
              </div>
              {stepNumber < totalSteps && (
                <div
                  className={cn(
                    "w-8 h-1 rounded mx-4",
                    stepNumber < currentStep
                      ? "bg-phil-light-purple"
                      : "bg-gray-300"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

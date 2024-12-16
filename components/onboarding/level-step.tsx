"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const LEVELS = ["Beginner", "Intermediate", "Advanced"];

interface OnboardingLevelStepProps {
  value: string;
  onChange: (value: string) => void;
}

export function OnboardingLevelStep({ value, onChange }: OnboardingLevelStepProps) {
  return (
    <div>
      <h2 className="font-semibold mb-2">Your current language level</h2>
      <RadioGroup value={value} onValueChange={onChange}>
        {LEVELS.map((l) => (
          <div key={l} className="flex items-center space-x-2 mb-2">
            <RadioGroupItem value={l} />
            <label>{l}</label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

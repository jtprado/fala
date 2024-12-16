"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const FREQUENCIES = ["Daily", "A few times a week", "Once a week", "Occasionally"];

interface OnboardingFrequencyStepProps {
  value: string;
  onChange: (value: string) => void;
}

export function OnboardingFrequencyStep({ value, onChange }: OnboardingFrequencyStepProps) {
  return (
    <div>
      <h2 className="font-semibold mb-2">How often do you plan to practice?</h2>
      <RadioGroup value={value} onValueChange={onChange}>
        {FREQUENCIES.map((f) => (
          <div key={f} className="flex items-center space-x-2 mb-2">
            <RadioGroupItem value={f} />
            <label>{f}</label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const REASONS = ["Travel", "Career", "Personal Growth", "Academic"];

interface OnboardingReasonStepProps {
  value: string;
  onChange: (value: string) => void;
}

export function OnboardingReasonStep({ value, onChange }: OnboardingReasonStepProps) {
  return (
    <div>
      <h2 className="font-semibold mb-2">Why are you learning this language?</h2>
      <RadioGroup value={value} onValueChange={onChange}>
        {REASONS.map((r) => (
          <div key={r} className="flex items-center space-x-2 mb-2">
            <RadioGroupItem value={r} />
            <label>{r}</label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const LANGUAGES = ["English", "Spanish", "French", "German"];

interface OnboardingLanguageStepProps {
  value: string;
  onChange: (value: string) => void;
}

export function OnboardingLanguageStep({ value, onChange }: OnboardingLanguageStepProps) {
  return (
    <div>
      <h2 className="font-semibold mb-2">Select your practice language</h2>
      <RadioGroup value={value} onValueChange={onChange}>
        {LANGUAGES.map((lang) => (
          <div key={lang} className="flex items-center space-x-2 mb-2">
            <RadioGroupItem value={lang} />
            <label>{lang}</label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

"use client";

import { Checkbox } from "@/components/ui/checkbox";

const TOPICS = ["Travel", "Food", "Music", "Business", "Art"];

interface OnboardingTopicsStepProps {
  values: string[];
  onChange: (values: string[]) => void;
}

export function OnboardingTopicsStep({ values, onChange }: OnboardingTopicsStepProps) {
  const toggleTopic = (topic: string, checked: boolean) => {
    if (checked && !values.includes(topic)) {
      onChange([...values, topic]);
    } else if (!checked && values.includes(topic)) {
      onChange(values.filter((t) => t !== topic));
    }
  };

  return (
    <div>
      <h2 className="font-semibold mb-2">Select topics of interest</h2>
      <div className="space-y-2">
        {TOPICS.map((t) => (
          <div key={t} className="flex items-center space-x-2">
            <Checkbox
              checked={values.includes(t)}
              onCheckedChange={(checked) => toggleTopic(t, !!checked)}
            />
            <label>{t}</label>
          </div>
        ))}
      </div>
    </div>
  );
}

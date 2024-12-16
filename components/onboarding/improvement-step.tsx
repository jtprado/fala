"use client";

import { Checkbox } from "@/components/ui/checkbox";

const IMPROVEMENT_AREAS = ["Speaking", "Writing", "Listening", "Reading"];

interface OnboardingImprovementStepProps {
  values: string[];
  onChange: (values: string[]) => void;
}

export function OnboardingImprovementStep({ values, onChange }: OnboardingImprovementStepProps) {
  const toggleArea = (area: string, checked: boolean) => {
    if (checked && !values.includes(area)) {
      onChange([...values, area]);
    } else if (!checked && values.includes(area)) {
      onChange(values.filter((a) => a !== area));
    }
  };

  return (
    <div>
      <h2 className="font-semibold mb-2">What areas do you want to improve?</h2>
      {IMPROVEMENT_AREAS.map((ia) => (
        <div key={ia} className="flex items-center space-x-2 mb-2">
          <Checkbox
            checked={values.includes(ia)}
            onCheckedChange={(checked) => toggleArea(ia, !!checked)}
          />
          <label>{ia}</label>
        </div>
      ))}
    </div>
  );
}

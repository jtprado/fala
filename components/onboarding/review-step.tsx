"use client";

interface OnboardingReviewStepProps {
  practiceLanguage: string;
  reason: string;
  topics: string[];
  level: string;
  improvementAreas: string[];
  practiceFrequency: string;
}

export function OnboardingReviewStep(props: OnboardingReviewStepProps) {
  const {
    practiceLanguage,
    reason,
    topics,
    level,
    improvementAreas,
    practiceFrequency
  } = props;

  return (
    <div className="space-y-4">
      <h2 className="font-semibold mb-2">Review Your Choices</h2>
      <ul className="text-sm space-y-2">
        <li><strong>Language:</strong> {practiceLanguage}</li>
        <li><strong>Reason:</strong> {reason}</li>
        <li><strong>Topics:</strong> {topics.join(", ")}</li>
        <li><strong>Level:</strong> {level}</li>
        <li><strong>Improvement Areas:</strong> {improvementAreas.join(", ")}</li>
        <li><strong>Practice Frequency:</strong> {practiceFrequency}</li>
      </ul>
      <p className="text-sm text-muted-foreground">If everything looks good, click Complete to finish onboarding.</p>
    </div>
  );
}

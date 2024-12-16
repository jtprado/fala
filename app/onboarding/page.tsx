"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

import { OnboardingLanguageStep } from "@/components/onboarding/language-step";
import { OnboardingReasonStep } from "@/components/onboarding/reason-step";
import { OnboardingTopicsStep } from "@/components/onboarding/topic-step";
import { OnboardingLevelStep } from "@/components/onboarding/level-step";
import { OnboardingImprovementStep } from "@/components/onboarding/improvement-step";
import { OnboardingFrequencyStep } from "@/components/onboarding/frequency-step";
import { OnboardingReviewStep } from "@/components/onboarding/review-step";

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);

  // State for all onboarding answers
  const [practiceLanguage, setPracticeLanguage] = useState("");
  const [reason, setReason] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [level, setLevel] = useState("");
  const [improvementAreas, setImprovementAreas] = useState<string[]>([]);
  const [practiceFrequency, setPracticeFrequency] = useState("");

  const validateStep = () => {
    switch (step) {
      case 1: if (!practiceLanguage) { toast({ title: "Please select a language" }); return false; }
      break;
      case 2: if (!reason) { toast({ title: "Please select a reason" }); return false; }
      break;
      case 3: if (topics.length === 0) { toast({ title: "Please select at least one topic" }); return false; }
      break;
      case 4: if (!level) { toast({ title: "Please select a level" }); return false; }
      break;
      case 5: if (improvementAreas.length === 0) { toast({ title: "Please select at least one improvement area" }); return false; }
      break;
      case 6: if (!practiceFrequency) { toast({ title: "Please select a practice frequency" }); return false; }
      break;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    setStep((prev) => prev - 1);
  };

  const handleComplete = async () => {
    const sessionId = crypto.randomUUID();
    try {
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          practiceLanguage,
          reason,
          topics,
          level,
          improvementAreas,
          practiceFrequency
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to complete onboarding");
      }

      router.push(`/sign-in?session_id=${sessionId}`);
    } catch (error: any) {
      toast({ title: "Error completing onboarding", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Onboarding</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Step {step} of 7
      </p>

      {step === 1 && <OnboardingLanguageStep value={practiceLanguage} onChange={setPracticeLanguage} />}
      {step === 2 && <OnboardingReasonStep value={reason} onChange={setReason} />}
      {step === 3 && <OnboardingTopicsStep values={topics} onChange={setTopics} />}
      {step === 4 && <OnboardingLevelStep value={level} onChange={setLevel} />}
      {step === 5 && <OnboardingImprovementStep values={improvementAreas} onChange={setImprovementAreas} />}
      {step === 6 && <OnboardingFrequencyStep value={practiceFrequency} onChange={setPracticeFrequency} />}
      {step === 7 && (
        <OnboardingReviewStep
          practiceLanguage={practiceLanguage}
          reason={reason}
          topics={topics}
          level={level}
          improvementAreas={improvementAreas}
          practiceFrequency={practiceFrequency}
        />
      )}

      <div className="mt-6 flex justify-between">
        {step > 1 && step < 7 && (
          <Button variant="ghost" onClick={handlePrev}>
            Previous
          </Button>
        )}
        {step < 7 && (
          <Button onClick={handleNext}>
            Next
          </Button>
        )}
        {step === 7 && (
          <Button onClick={handleComplete} className="ml-auto">
            Complete
          </Button>
        )}
      </div>
    </div>
  );
}

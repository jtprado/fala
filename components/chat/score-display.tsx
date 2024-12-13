"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { MessageFeedback } from "@/lib/types";

type ScoreDisplayProps = {
  feedback: Pick<MessageFeedback, 
    'pronunciation_score' | 
    'accuracy_score' | 
    'fluency_score' | 
    'completeness_score'
  >;
}

export function ScoreDisplay({ feedback }: ScoreDisplayProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Assessment Results</CardTitle>
        <CardDescription>Your pronunciation assessment scores</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Accuracy</span>
            <span>{Math.round(feedback.accuracy_score)}%</span>
          </div>
          <Progress value={feedback.accuracy_score} />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Fluency</span>
            <span>{Math.round(feedback.fluency_score)}%</span>
          </div>
          <Progress value={feedback.fluency_score} />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Completeness</span>
            <span>{Math.round(feedback.completeness_score)}%</span>
          </div>
          <Progress value={feedback.completeness_score} />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Overall Pronunciation</span>
            <span>{Math.round(feedback.pronunciation_score)}%</span>
          </div>
          <Progress value={feedback.pronunciation_score} />
        </div>
      </CardContent>
    </Card>
  );
}

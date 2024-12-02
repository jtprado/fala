"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ScoreDisplayProps {
  scores: {
    accuracyScore: number;
    fluencyScore: number;
    completenessScore: number;
    prosodyScore: number;
    pronunciationScore: number;
  };
}

export function ScoreDisplay({ scores }: ScoreDisplayProps) {
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
            <span>{Math.round(scores.accuracyScore)}%</span>
          </div>
          <Progress value={scores.accuracyScore} />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Fluency</span>
            <span>{Math.round(scores.fluencyScore)}%</span>
          </div>
          <Progress value={scores.fluencyScore} />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Completeness</span>
            <span>{Math.round(scores.completenessScore)}%</span>
          </div>
          <Progress value={scores.completenessScore} />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Prosody</span>
            <span>{Math.round(scores.prosodyScore)}%</span>
          </div>
          <Progress value={scores.prosodyScore} />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Overall Pronunciation</span>
            <span>{Math.round(scores.pronunciationScore)}%</span>
          </div>
          <Progress value={scores.pronunciationScore} />
        </div>
      </CardContent>
    </Card>
  );
}
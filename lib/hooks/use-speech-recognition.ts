"use client";

import { useState, useRef, useCallback } from 'react';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { createSpeechRecognizer, createPronunciationAssessmentConfig } from '../utils/azure-speech-client';
import type { MessageFeedback } from '@/lib/types';

interface SpeechResult {
  NBest: Array<{
    Words: Array<{
      Word: string;
      Offset: number;
      Duration: number;
      PronunciationAssessment: {
        AccuracyScore: number;
        ErrorType: string;
      };
    }>;
    PronunciationAssessment: {
      AccuracyScore: number;
      FluencyScore: number;
      CompletenessScore: number;
      ProsodyScore: number;
      PronScore: number;
    };
  }>;
}

type SpeechFeedback = Pick<MessageFeedback, 
  'pronunciation_score' | 
  'accuracy_score' | 
  'fluency_score' | 
  'completeness_score'
>;

export function useSpeechRecognition(language: string, referenceText: string) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognizerRef = useRef<sdk.SpeechRecognizer | null>(null);
  const resultsRef = useRef<SpeechResult[]>([]);

  const setupRecognizer = useCallback(() => {
    if (!language) {
      setError("Language is not set");
      return null;
    }

    try {
      const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = createSpeechRecognizer(language, audioConfig);
      const pronunciationAssessmentConfig = createPronunciationAssessmentConfig(referenceText);
      pronunciationAssessmentConfig.applyTo(recognizer);

      recognizer.recognized = (s, e) => {
        const result = JSON.parse(
          e.result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)
        );
        resultsRef.current.push(result);
      };

      return recognizer;
    } catch (error) {
      console.error("Error setting up recognizer:", error);
      setError("Failed to initialize speech recognition");
      return null;
    }
  }, [language, referenceText]);

  const startRecording = useCallback(() => {
    setError(null);
    resultsRef.current = [];
    const recognizer = setupRecognizer();
    if (!recognizer) return;
    
    recognizerRef.current = recognizer;
    recognizerRef.current.startContinuousRecognitionAsync();
    setIsRecording(true);
  }, [setupRecognizer]);

  const stopRecording = useCallback(() => {
    if (recognizerRef.current) {
      recognizerRef.current.stopContinuousRecognitionAsync();
      recognizerRef.current = null;
      setIsRecording(false);
    }
  }, []);

  const getFeedback = useCallback((): SpeechFeedback | null => {
    if (resultsRef.current.length === 0) return null;

    // Get the best result (first NBest entry of the last result)
    const lastResult = resultsRef.current[resultsRef.current.length - 1];
    const bestResult = lastResult.NBest[0];

    if (!bestResult?.PronunciationAssessment) return null;

    return {
      pronunciation_score: bestResult.PronunciationAssessment.PronScore,
      accuracy_score: bestResult.PronunciationAssessment.AccuracyScore,
      fluency_score: bestResult.PronunciationAssessment.FluencyScore,
      completeness_score: bestResult.PronunciationAssessment.CompletenessScore
    };
  }, []);

  return {
    isRecording,
    error,
    startRecording,
    stopRecording,
    getFeedback,
  };
}

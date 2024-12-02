import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

const AZURE_SPEECH_KEY = process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY!;
const AZURE_SPEECH_REGION = process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION!;

export function createSpeechConfig() {
  return sdk.SpeechConfig.fromSubscription(AZURE_SPEECH_KEY, AZURE_SPEECH_REGION);
}

export function createSpeechRecognizer(language: string, audioConfig: sdk.AudioConfig) {
  const speechConfig = createSpeechConfig();
  speechConfig.speechRecognitionLanguage = language;
  return new sdk.SpeechRecognizer(speechConfig, audioConfig);
}

export function createPronunciationAssessmentConfig(referenceText: string) {
  return new sdk.PronunciationAssessmentConfig(
    referenceText,
    sdk.PronunciationAssessmentGradingSystem.HundredMark,
    sdk.PronunciationAssessmentGranularity.Word,
    true
  );
}

export async function textToSpeech(text: string, language: string): Promise<ArrayBuffer> {
  const speechConfig = createSpeechConfig();
  speechConfig.speechSynthesisLanguage = language;
  
  const synthesizer = new sdk.SpeechSynthesizer(speechConfig);
  
  return new Promise((resolve, reject) => {
    synthesizer.speakTextAsync(
      text,
      result => {
        synthesizer.close();
        resolve(result.audioData);
      },
      error => {
        synthesizer.close();
        reject(error);
      }
    );
  });
}
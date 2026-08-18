'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { normalizeSpokenExpenseText } from '@/lib/voice-normalizer';

export type VoiceLanguage = 'en-IN' | 'gu-IN';

export interface UseSpeechRecognitionOptions {
  onResult?: (normalizedText: string) => void;
  onEnd?: (finalText: string) => void;
  initialLanguage?: VoiceLanguage;
}

export function useSpeechRecognition({
  onResult,
  onEnd,
  initialLanguage = 'en-IN',
}: UseSpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [language, setLanguage] = useState<VoiceLanguage>(initialLanguage);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const latestTranscriptRef = useRef<string>('');
  // Accumulates only the final (non-interim) segments so we never re-process old results
  const finalTranscriptRef = useRef<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setIsSupported(!!SpeechRecognition);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop errors
      }
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    // Stop any existing instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore abort errors
      }
    }

    setError(null);
    setTranscript('');
    latestTranscriptRef.current = '';
    finalTranscriptRef.current = '';

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        // Only process results starting from event.resultIndex to avoid
        // re-concatenating previous results on each callback (which caused
        // duplicates like "petrol petrol petrol 100 pet" in continuous mode).
        let newSegment = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item && item[0] && item[0].transcript) {
            if (item.isFinal) {
              // Commit finalized segment to the permanent accumulator
              finalTranscriptRef.current += item[0].transcript + ' ';
            } else {
              // Interim result for the current segment
              newSegment = item[0].transcript;
            }
          }
        }

        // Full text = all finalized segments + current interim word(s)
        const fullText = (finalTranscriptRef.current + newSegment).trim();
        const normalized = normalizeSpokenExpenseText(fullText);

        if (normalized) {
          latestTranscriptRef.current = normalized;
          setTranscript(normalized);
          if (onResult) {
            onResult(normalized);
          }
        }

        // Reset silence timer on speech input (auto-stop after 2s of silence)
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        silenceTimerRef.current = setTimeout(() => {
          stopListening();
        }, 2000);
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          setError('No speech detected');
        } else if (event.error === 'not-allowed') {
          setError('Microphone permission denied');
        } else {
          setError(`Speech error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        const finalNormalized = latestTranscriptRef.current.trim();
        if (onEnd && finalNormalized) {
          onEnd(finalNormalized);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setError(err.message || 'Failed to start microphone');
      setIsListening(false);
    }
  }, [language, onResult, onEnd, stopListening]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    error,
    isSupported,
    language,
    setLanguage,
    startListening,
    stopListening,
  };
}

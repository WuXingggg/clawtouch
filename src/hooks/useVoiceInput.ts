"use client";

import { useState, useRef, useCallback } from "react";
import { useT } from "@/lib/i18n";

export function useVoiceInput(setInput: (updater: (prev: string) => string) => void) {
  const { t, locale } = useT();
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const toggleVoice = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(t("voice.unsupported"));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = locale === "en" ? "en-US" : "zh-CN";
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = "";
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim = transcript;
        }
      }
      setInput(() => {
        return finalTranscript + (interim ? "\u200B" + interim : "");
      });
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      setInput((prev) => prev.replace(/\u200B/g, ""));
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [isRecording, setInput, t, locale]);

  return { isRecording, toggleVoice };
}

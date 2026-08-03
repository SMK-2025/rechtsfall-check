"use client";

import { useEffect, useRef, useState, type KeyboardEventHandler } from "react";

type VoiceTextareaProps = {
  id: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  caseId: string;
  aiConsent: boolean;
  promptText?: string;
  autoSpeak?: boolean;
  conversationMode?: boolean;
  onVoiceComplete?: (value: string) => boolean | void | Promise<boolean | void>;
  className?: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  autoFocus?: boolean;
  onKeyDown?: KeyboardEventHandler<HTMLTextAreaElement>;
};

function appendTranscript(current: string, transcript: string) {
  const clean = transcript.trim();
  if (!current.trim()) return clean;
  return `${current.trimEnd()}\n${clean}`;
}

function spokenConfirmation(transcript: string) {
  const normalized = transcript.replace(/\s+/g, " ").trim();
  const shortened = normalized.length > 220 ? `${normalized.slice(0, 217).trimEnd()} …` : normalized;
  return `Danke. Ich habe verstanden: ${shortened}`;
}

export function VoiceTextarea({
  id, name, value, onChange, onBlur, caseId, aiConsent, promptText,
  autoSpeak = false, conversationMode = false, onVoiceComplete,
  className, placeholder, required, minLength, autoFocus, onKeyDown,
}: VoiceTextareaProps) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const lastSpokenRef = useRef("");
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState("");
  const [voiceStatus, setVoiceStatus] = useState("");

  function stopSpeech() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !text.trim()) return;
    stopSpeech();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "de-DE";
    utterance.rate = 0.95;
    const voice = window.speechSynthesis.getVoices().find(item => item.lang.toLowerCase().startsWith("de"));
    if (voice) utterance.voice = voice;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  function speakAndWait(text: string) {
    return new Promise<void>(resolve => {
      if (typeof window === "undefined" || !("speechSynthesis" in window) || !text.trim()) {
        resolve();
        return;
      }
      stopSpeech();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "de-DE";
      utterance.rate = 0.95;
      const voice = window.speechSynthesis.getVoices().find(item => item.lang.toLowerCase().startsWith("de"));
      if (voice) utterance.voice = voice;
      utterance.onend = () => { setSpeaking(false); resolve(); };
      utterance.onerror = () => { setSpeaking(false); resolve(); };
      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    });
  }

  useEffect(() => {
    if (autoSpeak && promptText && promptText !== lastSpokenRef.current) {
      lastSpokenRef.current = promptText;
      speak(promptText);
    }
    return () => stopSpeech();
    // A new prompt is the only event that should trigger automatic read-aloud.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSpeak, promptText]);

  async function transcribe(blob: Blob) {
    setTranscribing(true);
    setError("");
    setVoiceStatus(conversationMode ? "Ihre Antwort wird direkt übernommen …" : "");
    try {
      const extension = blob.type.includes("ogg") ? "ogg" : blob.type.includes("mp4") ? "m4a" : "webm";
      const form = new FormData();
      form.set("caseId", caseId);
      form.set("field", id);
      form.set("aiConsent", String(aiConsent));
      form.set("file", new File([blob], `spracheingabe.${extension}`, { type: blob.type || "audio/webm" }));
      const response = await fetch("/api/v1/audio/transcriptions", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Die Spracheingabe konnte nicht verarbeitet werden.");
      const nextValue = appendTranscript(value, data.text || "");
      if (!nextValue.trim()) throw new Error("Es wurde keine verständliche Antwort erkannt. Bitte sprechen Sie noch einmal.");
      onChange(nextValue);
      if (conversationMode && onVoiceComplete) {
        const confirmation = spokenConfirmation(data.text || "");
        setVoiceStatus(confirmation);
        await speakAndWait(confirmation);
        const committed = await onVoiceComplete(nextValue);
        setVoiceStatus(committed === false ? "" : "Ihre Antwort wurde übernommen.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Die Spracheingabe konnte nicht verarbeitet werden.");
      setVoiceStatus("");
    } finally {
      setTranscribing(false);
    }
  }

  async function startRecording() {
    setError("");
    setVoiceStatus("");
    if (!aiConsent) {
      setError("Bitte stimmen Sie zuerst der KI-Verarbeitung zu.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Ihr Browser unterstützt die Spracheingabe nicht. Sie können jederzeit weiterschreiben.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const preferredType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "";
      const recorder = new MediaRecorder(stream, preferredType ? { mimeType: preferredType } : undefined);
      recorderRef.current = recorder;
      recorder.ondataavailable = event => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        if (blob.size) void transcribe(blob);
      };
      recorder.start();
      setRecording(true);
    } catch {
      setError("Der Mikrofonzugriff wurde nicht erlaubt. Sie können Ihre Antwort weiterhin eintippen.");
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    setRecording(false);
  }

  useEffect(() => () => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    streamRef.current?.getTracks().forEach(track => track.stop());
  }, []);

  return <div className={`voice-textarea ${recording ? "is-recording" : ""} ${conversationMode ? "is-conversation" : ""}`}>
    <textarea
      id={id} name={name} value={value} onChange={event => onChange(event.target.value)}
      onBlur={onBlur} className={className} placeholder={placeholder} required={conversationMode ? false : required}
      minLength={minLength} autoFocus={autoFocus} onKeyDown={onKeyDown} hidden={conversationMode}
    />
    <div className="voice-toolbar">
      <button type="button" className="voice-record" onClick={recording ? stopRecording : startRecording} disabled={transcribing}>
        <span aria-hidden="true">{recording ? "■" : "●"}</span>
        {recording ? "Antwort abschließen" : transcribing ? "Antwort wird übernommen …" : "Antwort sprechen"}
      </button>
      {promptText && <button type="button" onClick={() => speaking ? stopSpeech() : speak(promptText)}>
        <span aria-hidden="true">◖</span>{speaking ? "Vorlesen stoppen" : "Frage vorlesen"}
      </button>}
      {value.trim() && <button type="button" onClick={() => speaking ? stopSpeech() : speak(value)}>
        <span aria-hidden="true">▶</span>Antwort anhören
      </button>}
    </div>
    {recording && <p className="voice-status" role="status">Aufnahme läuft. Sprechen Sie in Ruhe und beenden Sie anschließend die Aufnahme.</p>}
    {voiceStatus && !recording && <p className="voice-status" role="status">{voiceStatus}</p>}
    {error && <p className="voice-error" role="alert">{error}</p>}
  </div>;
}

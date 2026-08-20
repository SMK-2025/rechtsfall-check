"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RetryAnalysisButton({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function retry() {
    if (state === "running") return;
    setState("running");
    setMessage("Die gespeicherten Angaben und Unterlagen werden erneut analysiert.");
    try {
      const response = await fetch("/api/v1/assessments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caseId, adminRetry: true }),
      });
      const payload = await response.json() as { stage?: string; error?: { message?: string }; message?: string };
      if (!response.ok) throw new Error(payload.error?.message || payload.message || "Die Analyse konnte nicht wiederholt werden.");
      setState("done");
      setMessage(payload.stage === "NEEDS_INFORMATION"
        ? "Analyse abgeschlossen: Es werden noch Angaben der Kundin benötigt."
        : "Analyse abgeschlossen und der nächste Bearbeitungsschritt wurde gespeichert.");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Die Analyse konnte nicht wiederholt werden.");
      router.refresh();
    }
  }

  return <div className={`admin-retry-analysis ${state}`}>
    <button type="button" onClick={retry} disabled={state === "running"}>
      {state === "running" ? "Analyse läuft …" : "Analyse erneut starten"}
    </button>
    {message ? <small role={state === "error" ? "alert" : "status"}>{message}</small> : null}
  </div>;
}

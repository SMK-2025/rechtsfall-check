"use client";

import { FormEvent, useState } from "react";

export function LawyerReviewForm({ lawyerId, initialNote, initialLatitude, initialLongitude }: { lawyerId: string; initialNote: string; initialLatitude: number | null; initialLongitude: number | null }) {
  const [latitude, setLatitude] = useState(initialLatitude?.toString() ?? "");
  const [longitude, setLongitude] = useState(initialLongitude?.toString() ?? "");
  const [note, setNote] = useState(initialNote);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function update(status: "VERIFIED" | "REJECTED") {
    setBusy(true); setMessage("");
    const response = await fetch(`/api/internal/lawyers/${lawyerId}`, {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ status, latitude: Number(latitude), longitude: Number(longitude), verificationNote: note }),
    });
    const data = await response.json().catch(() => null);
    setBusy(false);
    if (!response.ok) return setMessage(data?.error?.message || "Die Prüfung konnte nicht gespeichert werden.");
    setMessage(status === "VERIFIED" ? "Zulassung und Kanzleisitz wurden freigegeben." : "Die Rückfrage wurde gespeichert.");
    window.setTimeout(() => window.location.reload(), 900);
  }
  return <form onSubmit={(event: FormEvent) => event.preventDefault()} className="lawyer-review-form">
    <label>Breitengrad Kanzleisitz<input inputMode="decimal" value={latitude} onChange={event => setLatitude(event.target.value)} placeholder="51.045"/></label>
    <label>Längengrad Kanzleisitz<input inputMode="decimal" value={longitude} onChange={event => setLongitude(event.target.value)} placeholder="7.012"/></label>
    <label className="full">Prüfnotiz / Rückfrage<textarea rows={3} value={note} onChange={event => setNote(event.target.value)} maxLength={1000}/></label>
    {message && <p className="full" role="status">{message}</p>}
    <div className="full lawyer-review-actions"><button type="button" disabled={busy} onClick={() => update("VERIFIED")}>Zulassung freigeben</button><button type="button" disabled={busy} onClick={() => update("REJECTED")}>Rückfrage erforderlich</button></div>
  </form>;
}

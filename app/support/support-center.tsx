"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  supportBoundary,
  supportCategories,
  supportStatuses,
  type SupportCategory,
  type SupportStatus,
} from "@/lib/support";

type Ticket = {
  id: string;
  ticketNumber: string;
  ownerId: string;
  caseId: string | null;
  category: string;
  subject: string;
  status: string;
  lastMessageAt: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  ownerEmail: string | null;
  ownerFirstName: string | null;
  ownerLastName: string | null;
};
type Message = {
  id: string;
  senderRole: string;
  body: string;
  createdAt: string;
};

const dateTime = (value: Date | string) => new Intl.DateTimeFormat("de-DE", {
  dateStyle: "short", timeStyle: "short",
}).format(new Date(value));

export function SupportCenter({
  initialTickets,
  cases,
  admin,
  initialTicketId,
}: {
  initialTickets: Ticket[];
  cases: Array<{ id: string; title: string }>;
  admin: boolean;
  initialTicketId?: string;
}) {
  const initialSelection = initialTickets.some(ticket => ticket.id === initialTicketId)
    ? initialTicketId!
    : initialTickets[0]?.id || "";
  const [tickets, setTickets] = useState(initialTickets);
  const [selectedId, setSelectedId] = useState(initialSelection);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newTicket, setNewTicket] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const selected = useMemo(() => tickets.find(ticket => ticket.id === selectedId), [tickets, selectedId]);

  useEffect(() => {
    if (initialSelection) void openTicket(initialSelection);
    // Initiales Ticket einmalig laden; weitere Wechsel erfolgen bewusst über die Ticketliste.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshTickets(preferredId?: string) {
    const response = await fetch("/api/v1/support", { cache: "no-store" });
    if (!response.ok) throw new Error("Die Support-Tickets konnten nicht geladen werden.");
    const data = await response.json();
    setTickets(data.tickets);
    if (preferredId) setSelectedId(preferredId);
  }

  async function openTicket(id: string) {
    setNewTicket(false);
    setSelectedId(id);
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/v1/support/${id}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Das Ticket konnte nicht geöffnet werden.");
      const data = await response.json();
      setMessages(data.messages);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Das Ticket konnte nicht geöffnet werden.");
    } finally {
      setLoading(false);
    }
  }

  async function createTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/v1/support", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          category: form.get("category"),
          subject: form.get("subject"),
          message: form.get("message"),
          caseId: form.get("caseId") || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "Das Ticket konnte nicht erstellt werden.");
      await refreshTickets(data.ticket.id);
      await openTicket(data.ticket.id);
      setNotice(`Ticket ${data.ticket.ticketNumber} wurde eröffnet.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Das Ticket konnte nicht erstellt werden.");
    } finally {
      setLoading(false);
    }
  }

  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId) return;
    setLoading(true);
    setError("");
    const form = event.currentTarget;
    const message = new FormData(form).get("message");
    try {
      const response = await fetch(`/api/v1/support/${selectedId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "Die Nachricht konnte nicht gesendet werden.");
      form.reset();
      await Promise.all([openTicket(selectedId), refreshTickets(selectedId)]);
      setNotice("Ihre Nachricht wurde gesendet.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Die Nachricht konnte nicht gesendet werden.");
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(status: SupportStatus) {
    if (!selectedId) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/v1/support/${selectedId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "Der Status konnte nicht geändert werden.");
      await refreshTickets(selectedId);
      setNotice("Ticketstatus aktualisiert.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Der Status konnte nicht geändert werden.");
    } finally {
      setLoading(false);
    }
  }

  return <div className="support-wrap">
    <header className="support-header">
      <div><span>{admin ? "BETREIBER-SUPPORT" : "HILFE IM NUTZERKONTO"}</span><h1>{admin ? "Support-Tickets" : "Wie können wir helfen?"}</h1>
        <p>{admin ? "Technische und organisatorische Anliegen der Nutzer bearbeiten." : "Melden Sie technische Probleme, Fragen zu Konto oder Zahlung sowie Auffälligkeiten bei der Bedienung."}</p></div>
      {!admin && <button className="button" type="button" onClick={() => { setNewTicket(true); setSelectedId(""); setMessages([]); }}>Neues Ticket öffnen</button>}
    </header>
    <aside className="support-boundary"><strong>Klare Grenze</strong><p>{supportBoundary}</p></aside>
    {(notice || error) && <p className={`support-feedback ${error ? "error" : "success"}`} role="status">{error || notice}</p>}

    <div className="support-layout">
      <aside className="support-ticket-list" aria-label="Support-Tickets">
        <div className="support-ticket-list-head"><strong>{admin ? "Alle Tickets" : "Meine Tickets"}</strong><span>{tickets.length}</span></div>
        {tickets.length ? tickets.map(ticket => <button type="button" key={ticket.id}
          className={selectedId === ticket.id ? "active" : ""} onClick={() => openTicket(ticket.id)}>
          <span><b>{ticket.ticketNumber}</b><i className={`support-status ${ticket.status.toLowerCase()}`}>{supportStatuses[ticket.status as SupportStatus] || ticket.status}</i></span>
          <strong>{ticket.subject}</strong>
          {admin && <small>{[ticket.ownerFirstName, ticket.ownerLastName].filter(Boolean).join(" ") || ticket.ownerEmail}</small>}
          <small>{dateTime(ticket.lastMessageAt)}</small>
        </button>) : <p className="support-empty">Noch keine Tickets vorhanden.</p>}
      </aside>

      <section className="support-conversation">
        {newTicket && !admin ? <form className="support-form" onSubmit={createTicket}>
          <span className="section-label">NEUES SUPPORT-TICKET</span>
          <h2>Ihr Anliegen schildern</h2>
          <label>Thema<select name="category" required defaultValue="">
            <option value="" disabled>Bitte auswählen</option>
            {Object.entries(supportCategories).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select></label>
          <label>Betreff<input name="subject" required minLength={5} maxLength={140} placeholder="Worum geht es?" /></label>
          {cases.length > 0 && <label>Zugehörige Fallakte (optional)<select name="caseId" defaultValue="">
            <option value="">Keine Fallakte zuordnen</option>
            {cases.map(item => <option value={item.id} key={item.id}>{item.title}</option>)}
          </select></label>}
          <label>Beschreibung<textarea name="message" required minLength={10} maxLength={5000} rows={7}
            placeholder="Was ist passiert? Was haben Sie erwartet? Welche Fehlermeldung wird angezeigt?" /></label>
          <small>Bitte senden Sie keine zusätzlichen sensiblen Fallinhalte. Der Support nimmt keine rechtliche Bewertung vor.</small>
          <button className="button" disabled={loading}>{loading ? "Ticket wird erstellt …" : "Ticket verbindlich öffnen"}</button>
        </form> : selected ? <>
          <header className="support-thread-head">
            <div><span>{selected.ticketNumber} · {supportCategories[selected.category as SupportCategory] || selected.category}</span><h2>{selected.subject}</h2>
              {admin && <p>{[selected.ownerFirstName, selected.ownerLastName].filter(Boolean).join(" ") || "Nutzer"} · {selected.ownerEmail}</p>}</div>
            {admin ? <label>Status<select value={selected.status} onChange={event => changeStatus(event.target.value as SupportStatus)} disabled={loading}>
              {Object.entries(supportStatuses).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </select></label> : <i className={`support-status ${selected.status.toLowerCase()}`}>{supportStatuses[selected.status as SupportStatus] || selected.status}</i>}
          </header>
          <div className="support-messages" aria-live="polite">
            {loading && !messages.length ? <p>Nachrichten werden geladen …</p> : messages.map(message => <article key={message.id} className={message.senderRole === "SUPPORT" ? "support" : "member"}>
              <header><strong>{message.senderRole === "SUPPORT" ? "Rechtsfall-Check Support" : "Nutzer"}</strong><time>{dateTime(message.createdAt)}</time></header>
              <p>{message.body}</p>
            </article>)}
          </div>
          {selected.status !== "CLOSED" ? <form className="support-reply" onSubmit={sendReply}>
            <label>Neue Nachricht<textarea name="message" required minLength={2} maxLength={5000} rows={5}
              placeholder={admin ? "Hilfreiche Antwort ohne rechtliche Einzelfallberatung …" : "Ihre Ergänzung zum Support-Anliegen …"} /></label>
            <button className="button" disabled={loading}>{loading ? "Wird gesendet …" : "Nachricht senden"}</button>
          </form> : <p className="support-closed">Dieses Ticket ist geschlossen.</p>}
        </> : <div className="support-welcome"><span>?</span><h2>{admin ? "Ticket auswählen" : "Support-Center"}</h2><p>{admin ? "Wählen Sie links ein Ticket zur Bearbeitung." : "Wählen Sie ein vorhandenes Ticket oder öffnen Sie ein neues Anliegen."}</p></div>}
      </section>
    </div>
  </div>;
}

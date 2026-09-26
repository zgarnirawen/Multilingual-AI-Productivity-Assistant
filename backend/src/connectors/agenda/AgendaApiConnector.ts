import { AgendaConnector, AgendaEvent, CreateAgendaEventInput, UpdateAgendaEventInput } from "./AgendaConnector.js";
export class AgendaApiConnector implements AgendaConnector {
  constructor(private readonly baseUrl: string, private readonly token?: string) {}
  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers); headers.set("Accept", "application/json"); headers.set("Content-Type", "application/json");
    if (this.token) headers.set("Authorization", "Bearer " + this.token);
    const response = await fetch(new URL(path, this.baseUrl), { ...init, headers });
    if (!response.ok) throw new Error("Agenda API " + response.status + ": " + (await response.text()));
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }
  listEvents(startDate?: string, endDate?: string) {
    const params = new URLSearchParams(); if (startDate) params.set("startDate", startDate); if (endDate) params.set("endDate", endDate);
    const suffix = params.toString() ? "?" + params.toString() : "";
    return this.request<AgendaEvent[]>("/events" + suffix);
  }
  getEvent(id: string) { return this.request<AgendaEvent>("/events/" + encodeURIComponent(id)).catch(e => {
    if (e instanceof Error && e.message.startsWith("Agenda API 404")) return null; throw e;
  }); }
  findEventsByTitle(query: string) { return this.request<AgendaEvent[]>("/events?search=" + encodeURIComponent(query)); }
  createEvent(input: CreateAgendaEventInput) { return this.request<AgendaEvent>("/events", { method: "POST", body: JSON.stringify(input) }); }
  updateEvent(id: string, input: UpdateAgendaEventInput) { return this.request<AgendaEvent>("/events/" + encodeURIComponent(id), { method: "PATCH", body: JSON.stringify(input) }).catch(e => {
    if (e instanceof Error && e.message.startsWith("Agenda API 404")) return null; throw e;
  }); }
  async deleteEvent(id: string) {
    try { await this.request<void>("/events/" + encodeURIComponent(id), { method: "DELETE" }); return true; }
    catch (e) { if (e instanceof Error && e.message.startsWith("Agenda API 404")) return false; throw e; }
  }
}

import { AgendaConnector, AgendaEvent, CreateAgendaEventInput, UpdateAgendaEventInput } from "./AgendaConnector.js";
import { createStubEvent, getStubEvents, getEventsInRange, findEventsByTitle, deleteStubEvent, updateStubEvent } from "../../services/stubModules.js";
export class StubAgendaConnector implements AgendaConnector {
  async listEvents(startDate?: string, endDate?: string): Promise<AgendaEvent[]> { return startDate && endDate ? getEventsInRange(startDate, endDate) : getStubEvents(); }
  async getEvent(id: string): Promise<AgendaEvent | null> { return getStubEvents().find(e => e.id === id) ?? null; }
  async findEventsByTitle(query: string): Promise<AgendaEvent[]> { return findEventsByTitle(query); }
  async createEvent(input: CreateAgendaEventInput): Promise<AgendaEvent> { return createStubEvent(input.title, input.dateTime); }
  async updateEvent(id: string, input: UpdateAgendaEventInput): Promise<AgendaEvent | null> { return updateStubEvent(id, input.title, input.dateTime); }
  async deleteEvent(id: string): Promise<boolean> { return deleteStubEvent(id); }
}

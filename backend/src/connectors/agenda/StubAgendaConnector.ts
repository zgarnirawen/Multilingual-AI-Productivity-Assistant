import {
  AgendaConnector,
  AgendaEvent,
  CreateAgendaEventInput,
  UpdateAgendaEventInput,
} from "./AgendaConnector.js";

import {
  createStubEvent,
  getStubEvents,
  getEventsInRange,
  findEventsByTitle,
  deleteStubEvent,
  updateStubEvent,
} from "../../services/stubModules.js";

const toAgendaEvent = (event: {
  id: string;
  title: string;
  dateTime: string;
  createdAt: string;
}): AgendaEvent => ({
  id: event.id,
  title: event.title,
  dateTime: event.dateTime,
  createdAt: event.createdAt,
});

export class StubAgendaConnector implements AgendaConnector {
  async listEvents(
    startDate?: string,
    endDate?: string
  ): Promise<AgendaEvent[]> {
    const events =
      startDate && endDate
        ? getEventsInRange(startDate, endDate)
        : getStubEvents();

    return events.map(toAgendaEvent);
  }

  async getEvent(id: string): Promise<AgendaEvent | null> {
    const event = getStubEvents().find((e) => e.id === id);
    return event ? toAgendaEvent(event) : null;
  }

  async findEventsByTitle(query: string): Promise<AgendaEvent[]> {
    return findEventsByTitle(query).map(toAgendaEvent);
  }

  async createEvent(
    input: CreateAgendaEventInput
  ): Promise<AgendaEvent> {
    return toAgendaEvent(
      createStubEvent(input.title, input.dateTime)
    );
  }

  async updateEvent(
    id: string,
    input: UpdateAgendaEventInput
  ): Promise<AgendaEvent | null> {
    const event = updateStubEvent(
      id,
      input.title,
      input.dateTime
    );

    return event ? toAgendaEvent(event) : null;
  }

  async deleteEvent(id: string): Promise<boolean> {
    return deleteStubEvent(id);
  }
}

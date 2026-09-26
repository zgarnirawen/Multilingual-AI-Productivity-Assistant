export interface AgendaEvent {
  id: string; title: string; dateTime: string; createdAt?: string; duration?: number | null; [key: string]: unknown;
}
export interface CreateAgendaEventInput { title: string; dateTime: string; duration?: number | null; [key: string]: unknown; }
export interface UpdateAgendaEventInput { title?: string; dateTime?: string; duration?: number | null; [key: string]: unknown; }
export interface AgendaConnector {
  listEvents(startDate?: string, endDate?: string): Promise<AgendaEvent[]>; getEvent(id: string): Promise<AgendaEvent | null>;
  findEventsByTitle(query: string): Promise<AgendaEvent[]>; createEvent(input: CreateAgendaEventInput): Promise<AgendaEvent>;
  updateEvent(id: string, input: UpdateAgendaEventInput): Promise<AgendaEvent | null>; deleteEvent(id: string): Promise<boolean>;
}

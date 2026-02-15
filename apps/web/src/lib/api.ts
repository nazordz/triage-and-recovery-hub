import { CreateTicketPayload, Ticket } from "@/types/ticket";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const parseResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(payload.message || "Request failed");
  }

  return (await response.json()) as T;
};

export const fetchTickets = async (): Promise<Ticket[]> => {
  const response = await fetch(`${apiBaseUrl}/tickets`, { cache: "no-store" });
  return parseResponse<Ticket[]>(response);
};

export const createTicket = async (payload: CreateTicketPayload): Promise<Ticket> => {
  const response = await fetch(`${apiBaseUrl}/tickets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResponse<Ticket>(response);
};

export const resolveTicket = async (id: string, agentDraft: string): Promise<Ticket> => {
  const response = await fetch(`${apiBaseUrl}/tickets/${id}/resolve`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agentDraft }),
  });

  return parseResponse<Ticket>(response);
};

export const getEventsUrl = (): string => `${process.env.NEXT_PUBLIC_API_EVENTS_URL || `${apiBaseUrl}/events`}`;

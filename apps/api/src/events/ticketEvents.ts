import { Response } from "express";

type EventPayload = {
  type: "ticket_created" | "ticket_triaged" | "ticket_resolved" | "ticket_failed";
  ticketId: string;
};

const clients = new Set<Response>();

export const subscribeToTicketEvents = (res: Response): void => {
  clients.add(res);
};

export const unsubscribeFromTicketEvents = (res: Response): void => {
  clients.delete(res);
};

export const broadcastTicketEvent = (payload: EventPayload): void => {
  const message = `data: ${JSON.stringify(payload)}\n\n`;

  for (const client of clients) {
    client.write(message);
  }
};

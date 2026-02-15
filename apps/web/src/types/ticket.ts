export type TicketUrgency = "HIGH" | "MEDIUM" | "LOW";
export type TicketStatus = "PENDING" | "TRIAGED" | "RESOLVED" | "FAILED";

export type Ticket = {
  id: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  message: string;
  category: "BILLING" | "TECHNICAL" | "FEATURE_REQUEST" | null;
  sentiment: number | null;
  urgency: TicketUrgency | null;
  aiDraft: string | null;
  agentDraft: string | null;
  status: TicketStatus;
  triageError: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateTicketPayload = {
  customerName: string;
  customerEmail: string;
  subject: string;
  message: string;
};

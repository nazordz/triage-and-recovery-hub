import prisma from "@/configs/prisma";
import openAIClient from "@/configs/openAIClient";
import { TicketCategory, TicketUrgency } from "@/generated/prisma/client";
import { broadcastTicketEvent } from "@/events/ticketEvents";

type TriageResult = {
  category: "BILLING" | "TECHNICAL" | "FEATURE_REQUEST";
  sentiment: number;
  urgency: "HIGH" | "MEDIUM" | "LOW";
  aiDraft: string;
};

const triageSystemPrompt = `You are an expert support triage agent. Return JSON only with fields:
- category: one of BILLING, TECHNICAL, FEATURE_REQUEST
- sentiment: integer from 1 to 10
- urgency: one of HIGH, MEDIUM, LOW
- aiDraft: polite context-aware response draft for the customer
Do not include markdown or extra keys.`;

const parseTriageResult = (raw: string): TriageResult => {
  const parsed = JSON.parse(raw) as Partial<TriageResult>;

  if (
    !parsed.category ||
    !parsed.urgency ||
    typeof parsed.sentiment !== "number" ||
    typeof parsed.aiDraft !== "string"
  ) {
    throw new Error("Invalid triage payload structure");
  }

  return {
    category: parsed.category,
    urgency: parsed.urgency,
    sentiment: Math.max(1, Math.min(10, Math.round(parsed.sentiment))),
    aiDraft: parsed.aiDraft.trim(),
  };
};

const requestTriage = async (ticketMessage: string, subject: string): Promise<TriageResult> => {
  const completion = await openAIClient.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: triageSystemPrompt },
      {
        role: "user",
        content: JSON.stringify({
          subject,
          ticketMessage,
        }),
      },
    ],
  });

  const content = completion.choices[0]?.message.content;

  if (!content) {
    throw new Error("Empty triage response");
  }

  return parseTriageResult(content);
};

export const triageTicketInBackground = (ticketId: string, subject: string, message: string): void => {
  setImmediate(async () => {
    try {
      const triage = await requestTriage(message, subject);

      await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          category: triage.category as TicketCategory,
          urgency: triage.urgency as TicketUrgency,
          sentiment: triage.sentiment,
          aiDraft: triage.aiDraft,
          status: "TRIAGED",
          triageError: null,
        },
      });

      broadcastTicketEvent({ type: "ticket_triaged", ticketId });
    } catch (error) {
      const triageError = error instanceof Error ? error.message : "Unknown triage failure";

      await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          status: "FAILED",
          triageError,
        },
      });

      broadcastTicketEvent({ type: "ticket_failed", ticketId });
    }
  });
};

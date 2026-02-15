import prisma from "@/configs/prisma";
import openAIClient from "@/configs/openAIClient";
import { TicketCategory, TicketUrgency } from "@/generated/prisma/client";
import { broadcastTicketEvent } from "@/events/ticketEvents";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

const triageResultSchema = z
  .object({
    category: z.enum(["BILLING", "TECHNICAL", "FEATURE_REQUEST"]),
    sentiment: z.number().int().min(1).max(10),
    urgency: z.enum(["HIGH", "MEDIUM", "LOW"]),
    aiDraft: z.string().trim().min(1),
  })
  .strict();

type TriageResult = z.infer<typeof triageResultSchema>;

const triageSystemPrompt = `You are an expert support triage agent. Return JSON only with fields:
- category: one of BILLING, TECHNICAL, FEATURE_REQUEST
- sentiment: integer from 1 to 10
- urgency: one of HIGH, MEDIUM, LOW
- aiDraft: polite context-aware response draft for the customer
Do not include markdown or extra keys.`;

const requestTriage = async (ticketMessage: string, subject: string): Promise<TriageResult> => {
  const completion = await openAIClient.chat.completions.parse({
    model: "gpt-5-mini",
    response_format: zodResponseFormat(triageResultSchema, "ticket_triage"),
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

  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) {
    throw new Error("Empty triage response");
  }
  return parsed;
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

import "dotenv/config";
import bodyParser from "body-parser";
import cors from "cors";
import express, { type Express } from "express";
import { PrismaClient } from "@prisma/client";

type TicketEventType = "ticket.created" | "ticket.updated";

type TicketEvent = {
  type: TicketEventType;
  ticketId: string;
};

type TicketTriageResult = {
  category: keyof typeof TicketCategory;
  sentiment: number;
  urgency: keyof typeof TicketUrgency;
  draftResponse: string;
};

const TicketCategory = {
  BILLING: "BILLING",
  TECHNICAL: "TECHNICAL",
  FEATURE_REQUEST: "FEATURE_REQUEST",
} as const;

const TicketUrgency = {
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
} as const;

const TicketStatus = {
  PENDING: "PENDING",
  TRIAGED: "TRIAGED",
  RESOLVED: "RESOLVED",
  FAILED: "FAILED",
} as const;

type TicketStatusType = (typeof TicketStatus)[keyof typeof TicketStatus];

const prisma = new PrismaClient() as any;
const app: Express = express();
const port = Number(process.env.PORT ?? "8000");
const sseClients = new Set<express.Response>();

app.use(bodyParser.json({ limit: "10mb" }));
app.use(cors());
app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: "50mb",
  }),
);
app.use(express.json());

const broadcast = (event: TicketEvent) => {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of sseClients) {
    client.write(payload);
  }
};

const isTicketCategory = (value: string): value is keyof typeof TicketCategory =>
  ["BILLING", "TECHNICAL", "FEATURE_REQUEST"].includes(value);

const isTicketUrgency = (value: string): value is keyof typeof TicketUrgency =>
  ["HIGH", "MEDIUM", "LOW"].includes(value);

const parseAiJson = (content: string): TicketTriageResult | null => {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced?.[1] ?? content;

  try {
    const parsed = JSON.parse(raw) as Partial<TicketTriageResult>;

    if (
      typeof parsed.category !== "string" ||
      !isTicketCategory(parsed.category) ||
      typeof parsed.urgency !== "string" ||
      !isTicketUrgency(parsed.urgency) ||
      typeof parsed.sentiment !== "number" ||
      parsed.sentiment < 1 ||
      parsed.sentiment > 10 ||
      typeof parsed.draftResponse !== "string" ||
      parsed.draftResponse.trim().length < 10
    ) {
      return null;
    }

    return {
      category: parsed.category,
      urgency: parsed.urgency,
      sentiment: Math.round(parsed.sentiment),
      draftResponse: parsed.draftResponse.trim(),
    };
  } catch {
    return null;
  }
};

const triageWithLlm = async (input: {
  customerName: string;
  customerEmail: string;
  subject: string;
  message: string;
}): Promise<TicketTriageResult> => {
  const endpoint = process.env.OPENAI_ENDPOINT;
  const apiKey = process.env.OPENAI_KEY;

  if (!endpoint || !apiKey) {
    throw new Error("Missing OPENAI_ENDPOINT or OPENAI_KEY environment variables.");
  }

  const prompt = `You are a support triage assistant.
Analyze the ticket and return ONLY strict JSON with this shape:
{
  "category": "BILLING" | "TECHNICAL" | "FEATURE_REQUEST",
  "sentiment": number from 1-10,
  "urgency": "HIGH" | "MEDIUM" | "LOW",
  "draftResponse": string
}

Ticket:
Name: ${input.customerName}
Email: ${input.customerEmail}
Subject: ${input.subject}
Message: ${input.message}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "Return valid JSON only. No markdown or explanations.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`LLM call failed (${response.status}): ${text}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("LLM response missing message content.");
  }

  const parsed = parseAiJson(content);
  if (!parsed) {
    throw new Error("LLM returned malformed triage JSON.");
  }

  return parsed;
};

const processTicketAsync = async (ticketId: string) => {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    return;
  }

  try {
    const triageResult = await triageWithLlm({
      customerName: ticket.customerName,
      customerEmail: ticket.customerEmail,
      subject: ticket.subject,
      message: ticket.message,
    });

    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        category: TicketCategory[triageResult.category],
        urgency: TicketUrgency[triageResult.urgency],
        sentiment: triageResult.sentiment,
        aiDraft: triageResult.draftResponse,
        agentDraft: triageResult.draftResponse,
        status: TicketStatus.TRIAGED,
        triageError: null,
      },
    });
  } catch (error) {
    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: TicketStatus.FAILED,
        triageError: error instanceof Error ? error.message : "Unknown triage error",
      },
    });
  }

  broadcast({ type: "ticket.updated", ticketId });
};

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  sseClients.add(res);
  res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

  req.on("close", () => {
    sseClients.delete(res);
  });
});

app.post("/tickets", async (req, res) => {
  const { customerName, customerEmail, subject, message } = req.body as {
    customerName?: string;
    customerEmail?: string;
    subject?: string;
    message?: string;
  };

  if (
    !customerName?.trim() ||
    !customerEmail?.trim() ||
    !subject?.trim() ||
    !message?.trim()
  ) {
    res.status(400).json({ message: "customerName, customerEmail, subject and message are required." });
    return;
  }

  const ticket = await prisma.ticket.create({
    data: {
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      subject: subject.trim(),
      message: message.trim(),
      status: TicketStatus.PENDING,
    },
  });

  setTimeout(() => {
    void processTicketAsync(ticket.id);
  }, 0);

  broadcast({ type: "ticket.created", ticketId: ticket.id });

  res.status(201).json(ticket);
});

app.get("/tickets", async (req, res) => {
  const statusParam = req.query.status;
  const status = typeof statusParam === "string" ? statusParam : undefined;

  const where = status && ["PENDING", "TRIAGED", "RESOLVED", "FAILED"].includes(status)
    ? { status }
    : undefined;

  const tickets = await prisma.ticket.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  res.json(tickets);
});

app.get("/tickets/:id", async (req, res) => {
  const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id } });
  if (!ticket) {
    res.status(404).json({ message: "Ticket not found" });
    return;
  }

  res.json(ticket);
});

app.patch("/tickets/:id", async (req, res) => {
  const { agentDraft, status } = req.body as {
    agentDraft?: string;
    status?: TicketStatusType;
  };

  const data: { agentDraft?: string; status?: TicketStatusType } = {};

  if (typeof agentDraft === "string") {
    data.agentDraft = agentDraft.trim();
  }

  if (status && ["PENDING", "TRIAGED", "RESOLVED", "FAILED"].includes(status)) {
    data.status = status;
  }

  try {
    const updated = await prisma.ticket.update({
      where: { id: req.params.id },
      data,
    });

    broadcast({ type: "ticket.updated", ticketId: updated.id });
    res.json(updated);
  } catch {
    res.status(404).json({ message: "Ticket not found" });
  }
});

app.listen(port, () => {
  console.log(`server is running at http://localhost:${port}`);
});

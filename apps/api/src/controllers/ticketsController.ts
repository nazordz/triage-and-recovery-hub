import { Request, Response } from "express";
import { body, param } from "express-validator";
import prisma from "@/configs/prisma";
import { Prisma } from "@/generated/prisma/client";
import { triageTicketInBackground } from "@/services/triageService";
import {
  broadcastTicketEvent,
  subscribeToTicketEvents,
  unsubscribeFromTicketEvents,
} from "@/events/ticketEvents";

export const createTicketValidators = [
  body("customerName").trim().notEmpty().isLength({ max: 120 }),
  body("customerEmail").trim().isEmail().isLength({ max: 180 }),
  body("subject").trim().notEmpty().isLength({ min: 5, max: 180 }),
  body("message").trim().notEmpty().isLength({ min: 10, max: 4000 }),
];

export const resolveTicketValidators = [
  param("id").trim().notEmpty(),
  body("agentDraft").trim().notEmpty().isLength({ min: 5, max: 5000 }),
];

export const ticketIdValidators = [param("id").trim().notEmpty()];

export const createTicket = async (req: Request, res: Response): Promise<void> => {
  const { customerName, customerEmail, subject, message } = req.body as {
    customerName: string;
    customerEmail: string;
    subject: string;
    message: string;
  };

  const ticket = await prisma.ticket.create({
    data: {
      customerName,
      customerEmail,
      subject,
      message,
      status: "PENDING",
    },
  });

  broadcastTicketEvent({ type: "ticket_created", ticketId: ticket.id });
  triageTicketInBackground(ticket.id, ticket.subject, ticket.message);

  res.status(201).json(ticket);
};

export const listTickets = async (_req: Request, res: Response): Promise<void> => {
  const tickets = await prisma.ticket.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  res.json(tickets);
};

export const getTicketById = async (req: Request, res: Response): Promise<void> => {
  const ticketId = String(req.params.id);

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket) {
    res.status(404).json({ message: "Ticket not found" });
    return;
  }

  res.json(ticket);
};

export const resolveTicket = async (req: Request, res: Response): Promise<void> => {
  const { agentDraft } = req.body as { agentDraft: string };
  const ticketId = String(req.params.id);

  try {
    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        agentDraft,
        status: "RESOLVED",
      },
    });

    broadcastTicketEvent({ type: "ticket_resolved", ticketId: ticket.id });
    res.json(ticket);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      res.status(404).json({ message: "Ticket not found" });
      return;
    }

    throw error;
  }
};

export const streamTicketEvents = (_req: Request, res: Response): void => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  subscribeToTicketEvents(res);

  res.write('event: connected\ndata: {"ok":true}\n\n');

  res.on("close", () => {
    unsubscribeFromTicketEvents(res);
  });
};

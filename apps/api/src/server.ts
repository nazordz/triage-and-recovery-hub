import "dotenv/config";
import express, { Express, NextFunction, Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import {
  createTicket,
  createTicketValidators,
  getTicketById,
  listTickets,
  resolveTicket,
  resolveTicketValidators,
  streamTicketEvents,
  ticketIdValidators,
} from "@/controllers/ticketsController";
import { validateRequest } from "@/middlewares/validate";

const app: Express = express();
const port = process.env.PORT || "8000";

app.use(bodyParser.json({ limit: "10mb" }));
app.use(cors());
app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: "50mb",
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/tickets", createTicketValidators, validateRequest, createTicket);
app.get("/tickets", listTickets);
app.get("/tickets/:id", ticketIdValidators, validateRequest, getTicketById);
app.patch("/tickets/:id/resolve", resolveTicketValidators, validateRequest, resolveTicket);
app.get("/events", streamTicketEvents);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = error instanceof Error ? error.message : "Unexpected server error";
  res.status(500).json({ message });
});

app.listen(port, () => {
  console.log(`server is running at http://localhost:${port}`);
});

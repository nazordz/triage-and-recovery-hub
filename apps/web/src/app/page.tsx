"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";

type TicketStatus = "PENDING" | "TRIAGED" | "RESOLVED" | "FAILED";
type TicketUrgency = "HIGH" | "MEDIUM" | "LOW";
type TicketCategory = "BILLING" | "TECHNICAL" | "FEATURE_REQUEST";

type Ticket = {
  id: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  message: string;
  category: TicketCategory | null;
  sentiment: number | null;
  urgency: TicketUrgency | null;
  aiDraft: string | null;
  agentDraft: string | null;
  status: TicketStatus;
  triageError: string | null;
  createdAt: string;
  updatedAt: string;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const apiEventsUrl = process.env.NEXT_PUBLIC_API_EVENTS_URL ?? "http://localhost:8000/events";

const urgencyColor = (urgency: TicketUrgency | null): "error" | "warning" | "success" => {
  if (urgency === "HIGH") return "error";
  if (urgency === "MEDIUM") return "warning";
  return "success";
};

export default function Home() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "ALL">("ALL");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    subject: "",
    message: "",
  });

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedId) ?? null,
    [tickets, selectedId],
  );

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = statusFilter === "ALL" ? "" : `?status=${statusFilter}`;
      const response = await fetch(`${apiUrl}/tickets${query}`);
      if (!response.ok) {
        throw new Error("Failed to fetch tickets.");
      }
      const data = (await response.json()) as Ticket[];
      setTickets(data);
      if (!selectedId && data.length > 0) {
        setSelectedId(data[0].id);
        setDraft(data[0].agentDraft ?? "");
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  }, [selectedId, statusFilter]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    if (!selectedTicket) {
      setDraft("");
      return;
    }

    setDraft(selectedTicket.agentDraft ?? selectedTicket.aiDraft ?? "");
  }, [selectedTicket]);

  useEffect(() => {
    const events = new EventSource(apiEventsUrl);
    events.onmessage = () => {
      void loadTickets();
    };

    events.onerror = () => {
      events.close();
    };

    return () => {
      events.close();
    };
  }, [loadTickets]);

  const createTicket = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { message?: string };
        throw new Error(payload.message ?? "Unable to create ticket.");
      }

      setForm({ customerName: "", customerEmail: "", subject: "", message: "" });
      await loadTickets();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unexpected error.");
    } finally {
      setSubmitting(false);
    }
  };

  const updateDraft = async (resolve = false) => {
    if (!selectedTicket) return;

    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/tickets/${selectedTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentDraft: draft,
          status: resolve ? "RESOLVED" : undefined,
        }),
      });
      if (!response.ok) {
        throw new Error("Unable to update ticket.");
      }

      await loadTickets();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unexpected error.");
    } finally {
      setSaving(false);
    }
  };

  const isFormValid =
    form.customerName.trim().length >= 2 &&
    /.+@.+\..+/.test(form.customerEmail) &&
    form.subject.trim().length >= 3 &&
    form.message.trim().length >= 10;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        AI Support Triage & Recovery Hub
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Submit complaints, let AI triage in the background, then review and resolve.
      </Typography>

      {error && (
        <Alert sx={{ mb: 2 }} severity="error">
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Submit New Ticket
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Customer Name"
                  value={form.customerName}
                  onChange={(event) => setForm((prev) => ({ ...prev, customerName: event.target.value }))}
                  required
                />
                <TextField
                  label="Customer Email"
                  value={form.customerEmail}
                  onChange={(event) => setForm((prev) => ({ ...prev, customerEmail: event.target.value }))}
                  required
                />
                <TextField
                  label="Subject"
                  value={form.subject}
                  onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
                  required
                />
                <TextField
                  label="Complaint"
                  multiline
                  minRows={4}
                  value={form.message}
                  onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                  required
                />
                <Button disabled={!isFormValid || submitting} variant="contained" onClick={() => void createTicket()}>
                  {submitting ? "Submitting..." : "Create Ticket"}
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Paper sx={{ mt: 2, p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Ticket Queue</Typography>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as TicketStatus | "ALL")}
                >
                  <MenuItem value="ALL">All</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="TRIAGED">Triaged</MenuItem>
                  <MenuItem value="RESOLVED">Resolved</MenuItem>
                  <MenuItem value="FAILED">Failed</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <Divider sx={{ my: 1 }} />
            {loading ? (
              <Box py={4} textAlign="center">
                <CircularProgress size={28} />
              </Box>
            ) : (
              <Stack spacing={1}>
                {tickets.map((ticket) => (
                  <Paper
                    key={ticket.id}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      cursor: "pointer",
                      borderColor: selectedId === ticket.id ? "primary.main" : undefined,
                    }}
                    onClick={() => setSelectedId(ticket.id)}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Typography fontWeight={600}>{ticket.subject}</Typography>
                      <Chip label={ticket.urgency ?? "LOW"} color={urgencyColor(ticket.urgency)} size="small" />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {ticket.customerName} • {ticket.status}
                    </Typography>
                  </Paper>
                ))}
                {tickets.length === 0 && <Typography color="text.secondary">No tickets found.</Typography>}
              </Stack>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ minHeight: "100%" }}>
            <CardContent>
              {!selectedTicket ? (
                <Typography color="text.secondary">Select a ticket to inspect details.</Typography>
              ) : (
                <Stack spacing={2}>
                  <Typography variant="h6">Ticket Details</Typography>
                  <Typography><strong>Customer:</strong> {selectedTicket.customerName} ({selectedTicket.customerEmail})</Typography>
                  <Typography><strong>Category:</strong> {selectedTicket.category ?? "Pending AI"}</Typography>
                  <Typography><strong>Sentiment:</strong> {selectedTicket.sentiment ?? "Pending AI"}</Typography>
                  <Typography><strong>Urgency:</strong> {selectedTicket.urgency ?? "Pending AI"}</Typography>
                  <Typography><strong>Message:</strong> {selectedTicket.message}</Typography>

                  {selectedTicket.triageError && <Alert severity="warning">AI triage error: {selectedTicket.triageError}</Alert>}

                  <TextField
                    label="Agent Draft"
                    multiline
                    minRows={8}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    fullWidth
                  />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <Button variant="outlined" disabled={saving} onClick={() => void updateDraft(false)}>
                      Save Draft
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      disabled={saving || !draft.trim()}
                      onClick={() => void updateDraft(true)}
                    >
                      Mark Resolved
                    </Button>
                  </Stack>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Grid, Paper, Stack, Typography } from "@mui/material";
import { fetchTickets, getEventsUrl } from "@/lib/api";
import TicketForm from "@/components/TicketForm";
import TicketList from "@/components/TicketList";
import TicketDetail from "@/components/TicketDetail";

export default function TriageDashboard() {
  const queryClient = useQueryClient();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const { data: tickets = [] } = useQuery({
    queryKey: ["tickets"],
    queryFn: fetchTickets,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    const events = new EventSource(getEventsUrl());

    events.onmessage = () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    };

    return () => events.close();
  }, [queryClient]);

  const activeTicketId = useMemo(() => {
    if (!tickets.length) {
      return null;
    }

    if (selectedTicketId && tickets.some((ticket) => ticket.id === selectedTicketId)) {
      return selectedTicketId;
    }

    return tickets[0].id;
  }, [selectedTicketId, tickets]);

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === activeTicketId) || null,
    [activeTicketId, tickets]
  );

  return (
    <Stack spacing={3} sx={{ p: 3 }}>
      <Typography variant="h4">Triage & Recovery Hub</Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2 }}>
            <TicketForm />
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TicketList tickets={tickets} selectedTicketId={activeTicketId} onSelect={setSelectedTicketId} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TicketDetail ticket={selectedTicket} />
        </Grid>
      </Grid>
    </Stack>
  );
}

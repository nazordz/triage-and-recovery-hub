"use client";

import { Chip, List, ListItemButton, ListItemText, Stack, Typography } from "@mui/material";
import { Ticket } from "@/types/ticket";

const urgencyColorMap: Record<string, "error" | "success" | "default" | "warning"> = {
  HIGH: "error",
  MEDIUM: "warning",
  LOW: "success",
};

type Props = {
  tickets: Ticket[];
  selectedTicketId: string | null;
  onSelect: (ticketId: string) => void;
};

export default function TicketList({ tickets, selectedTicketId, onSelect }: Props) {
  return (
    <Stack spacing={2}>
      <Typography variant="h6">Agent Queue</Typography>
      <List sx={{ border: "1px solid #ddd", borderRadius: 2, maxHeight: 520, overflowY: "auto" }}>
        {tickets.map((ticket) => (
          <ListItemButton key={ticket.id} selected={selectedTicketId === ticket.id} onClick={() => onSelect(ticket.id)}>
            <ListItemText
              primary={ticket.subject}
              secondary={`${ticket.customerName} • ${ticket.status}`}
            />
            <Chip
              label={ticket.urgency || "PENDING"}
              color={urgencyColorMap[ticket.urgency || ""] || "default"}
              size="small"
            />
          </ListItemButton>
        ))}
      </List>
    </Stack>
  );
}

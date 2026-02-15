"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFormik } from "formik";
import * as yup from "yup";
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { resolveTicket } from "@/lib/api";
import { Ticket } from "@/types/ticket";

const validationSchema = yup.object({
  agentDraft: yup.string().required("Agent draft is required").min(5).max(5000),
});

export default function TicketDetail({ ticket }: { ticket: Ticket | null }) {
  const queryClient = useQueryClient();

  const resolveMutation = useMutation({
    mutationFn: ({ id, agentDraft }: { id: string; agentDraft: string }) => resolveTicket(id, agentDraft),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      agentDraft: ticket?.agentDraft || ticket?.aiDraft || "",
    },
    validationSchema,
    onSubmit: async (values) => {
      if (!ticket) return;
      await resolveMutation.mutateAsync({ id: ticket.id, agentDraft: values.agentDraft });
    },
  });

  if (!ticket) {
    return <Typography color="text.secondary">Select a ticket to review details.</Typography>;
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="h6">{ticket.subject}</Typography>
        <Typography variant="body2">From: {ticket.customerName} ({ticket.customerEmail})</Typography>
        <Typography variant="body2">Message: {ticket.message}</Typography>
        <Typography variant="body2">Category: {ticket.category || "Pending"}</Typography>
        <Typography variant="body2">Sentiment: {ticket.sentiment || "Pending"}</Typography>
        <Typography variant="body2">Urgency: {ticket.urgency || "Pending"}</Typography>
        {ticket.triageError && <Alert severity="error">Triage failed: {ticket.triageError}</Alert>}

        <Box component="form" onSubmit={formik.handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Editable response draft"
              multiline
              minRows={5}
              {...formik.getFieldProps("agentDraft")}
              error={formik.touched.agentDraft && Boolean(formik.errors.agentDraft)}
              helperText={formik.touched.agentDraft && formik.errors.agentDraft}
            />
            <Button type="submit" variant="contained" disabled={resolveMutation.isPending || ticket.status === "RESOLVED"}>
              {ticket.status === "RESOLVED" ? "Resolved" : resolveMutation.isPending ? "Saving..." : "Resolve"}
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}

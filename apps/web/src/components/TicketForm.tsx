"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFormik } from "formik";
import * as yup from "yup";
import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import { createTicket } from "@/lib/api";

const validationSchema = yup.object({
  customerName: yup.string().required("Name is required").max(120),
  customerEmail: yup.string().email("Must be a valid email").required("Email is required").max(180),
  subject: yup.string().required("Subject is required").min(5).max(180),
  message: yup.string().required("Message is required").min(10).max(4000),
});

export default function TicketForm() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createTicket,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  const formik = useFormik({
    initialValues: {
      customerName: "",
      customerEmail: "",
      subject: "",
      message: "",
    },
    validationSchema,
    onSubmit: async (values, helpers) => {
      await mutation.mutateAsync(values);
      helpers.resetForm();
    },
  });

  return (
    <Box component="form" onSubmit={formik.handleSubmit}>
      <Stack spacing={2}>
        <Typography variant="h6">Submit Customer Ticket</Typography>
        {mutation.isError && <Alert severity="error">{(mutation.error as Error).message}</Alert>}
        {mutation.isSuccess && <Alert severity="success">Ticket submitted for async triage.</Alert>}

        <TextField label="Customer Name" {...formik.getFieldProps("customerName")} error={formik.touched.customerName && Boolean(formik.errors.customerName)} helperText={formik.touched.customerName && formik.errors.customerName} />
        <TextField label="Customer Email" {...formik.getFieldProps("customerEmail")} error={formik.touched.customerEmail && Boolean(formik.errors.customerEmail)} helperText={formik.touched.customerEmail && formik.errors.customerEmail} />
        <TextField label="Subject" {...formik.getFieldProps("subject")} error={formik.touched.subject && Boolean(formik.errors.subject)} helperText={formik.touched.subject && formik.errors.subject} />
        <TextField label="Message" multiline minRows={4} {...formik.getFieldProps("message")} error={formik.touched.message && Boolean(formik.errors.message)} helperText={formik.touched.message && formik.errors.message} />

        <Button variant="contained" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Submitting..." : "Create Ticket"}
        </Button>
      </Stack>
    </Box>
  );
}

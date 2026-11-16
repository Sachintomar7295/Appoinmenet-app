import { Router } from "express";
import Appointment from "../models/Appointment.js";

const router = Router();
const allowedStatuses = ["Pending", "Confirmed", "Cancelled"];

function validateAppointment(body, partial = false) {
  const errors = {};
  if (!partial || body.customerName !== undefined) {
    if (typeof body.customerName !== "string" || !body.customerName.trim()) {
      errors.customerName = "Customer name is required.";
    }
  }
  if (!partial || body.service !== undefined) {
    if (typeof body.service !== "string" || !body.service.trim()) {
      errors.service = "Service is required.";
    }
  }
  if (!partial || body.dateTime !== undefined) {
    if (!body.dateTime || Number.isNaN(new Date(body.dateTime).getTime())) {
      errors.dateTime = "A valid date and time is required.";
    }
  }
  if (body.status !== undefined && !allowedStatuses.includes(body.status)) {
    errors.status = "Choose Pending, Confirmed or Cancelled.";
  }
  return errors;
}

router.get("/", async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status && status !== "All") {
      if (!allowedStatuses.includes(status)) return res.status(400).json({ message: "Invalid status filter." });
      filter.status = status;
    }
    if (search?.trim()) filter.customerName = { $regex: search.trim(), $options: "i" };
    const appointments = await Appointment.find(filter).sort({ dateTime: 1 });
    res.json(appointments);
  } catch (error) { next(error); }
});

router.post("/", async (req, res, next) => {
  try {
    const errors = validateAppointment(req.body);
    if (Object.keys(errors).length) return res.status(400).json({ message: "Please correct the highlighted fields.", errors });
    const appointment = await Appointment.create({
      customerName: req.body.customerName.trim(),
      service: req.body.service.trim(),
      dateTime: req.body.dateTime,
      status: req.body.status || "Pending"
    });
    res.status(201).json(appointment);
  } catch (error) { next(error); }
});

router.patch("/:id/status", async (req, res, next) => {
  try {
    if (!allowedStatuses.includes(req.body.status)) {
      return res.status(400).json({ message: "Choose a valid appointment status." });
    }
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id, { status: req.body.status }, { new: true, runValidators: true }
    );
    if (!appointment) return res.status(404).json({ message: "Appointment not found." });
    res.json(appointment);
  } catch (error) { next(error); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found." });
    res.json({ message: "Appointment deleted." });
  } catch (error) { next(error); }
});

export default router;
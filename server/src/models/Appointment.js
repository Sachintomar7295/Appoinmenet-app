import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  customerName: { type: String, required: true, trim: true, maxlength: 80 },
  service: { type: String, required: true, trim: true, maxlength: 100 },
  dateTime: { type: Date, required: true },
  status: {
    type: String,
    enum: ["Pending", "Confirmed", "Cancelled"],
    default: "Pending"
  }
}, { timestamps: true });

export default mongoose.model("Appointment", appointmentSchema);
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 10000
});

export const getAppointments = (params) => api.get("/appointments", { params });
export const createAppointment = (data) => api.post("/appointments", data);
export const updateAppointmentStatus = (id, status) =>
  api.patch(`/appointments/${id}/status`, { status });
export const deleteAppointment = (id) => api.delete(`/appointments/${id}`);
export default api;
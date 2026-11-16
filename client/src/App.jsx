import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, Search, Plus, Users, CheckCircle2, CircleDashed, XCircle, RefreshCw, Trash2 } from "lucide-react";
import { getAppointments, createAppointment, updateAppointmentStatus, deleteAppointment } from "./api";

const statuses = ["All", "Pending", "Confirmed", "Cancelled"];
const emptyForm = { customerName: "", service: "", dateTime: "", status: "Pending" };

function formatDate(value) {
  return new Date(value).toLocaleString([], {
    dateStyle: "medium", timeStyle: "short"
  });
}

function StatusPill({ status }) {
  return <span className={`status-pill ${status.toLowerCase()}`}>{status}</span>;
}

export default function App() {
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [apiError, setApiError] = useState("");

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setApiError("");
    try {
      const response = await getAppointments();
      setAppointments(response.data);
    } catch (error) {
      setApiError(error.response?.data?.message || "Could not connect to the API. Check that the server and MongoDB are running.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAppointments(); }, [loadAppointments]);

  const visibleAppointments = useMemo(() => appointments.filter((item) => {
    const matchesStatus = filter === "All" || item.status === filter;
    const matchesSearch = item.customerName.toLowerCase().includes(search.trim().toLowerCase());
    return matchesStatus && matchesSearch;
  }), [appointments, filter, search]);

  const counts = useMemo(() => ({
    total: appointments.length,
    pending: appointments.filter(a => a.status === "Pending").length,
    confirmed: appointments.filter(a => a.status === "Confirmed").length,
    cancelled: appointments.filter(a => a.status === "Cancelled").length
  }), [appointments]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm(current => ({ ...current, [name]: value }));
    setErrors(current => ({ ...current, [name]: "" }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!form.customerName.trim()) nextErrors.customerName = "Customer name is required.";
    if (!form.service.trim()) nextErrors.service = "Please enter a service.";
    if (!form.dateTime) nextErrors.dateTime = "Please choose a date and time.";
    else if (new Date(form.dateTime) < new Date()) nextErrors.dateTime = "Choose a future date and time.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    setNotice("");
    try {
      const response = await createAppointment(form);
      setAppointments(current => [...current, response.data].sort((a,b) => new Date(a.dateTime)-new Date(b.dateTime)));
      setForm(emptyForm);
      setNotice("Appointment added successfully.");
    } catch (error) {
      setNotice(error.response?.data?.message || "Could not save appointment. Please try again.");
    } finally { setSaving(false); }
  }

  async function handleStatusChange(id, status) {
    try {
      const response = await updateAppointmentStatus(id, status);
      setAppointments(current => current.map(item => item._id === id ? response.data : item));
      setNotice("Appointment status updated.");
    } catch (error) {
      setNotice(error.response?.data?.message || "Status update failed.");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this appointment?")) return;
    try {
      await deleteAppointment(id);
      setAppointments(current => current.filter(item => item._id !== id));
      setNotice("Appointment deleted.");
    } catch (error) { setNotice(error.response?.data?.message || "Delete failed."); }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#"><span className="brand-mark"><CalendarDays size={20}/></span>appoint<span>ly</span></a>
        <div className="topbar-right"><span className="live-dot"/> Appointment workspace <span className="avatar">ST</span></div>
      </header>

      <section className="page-heading">
        <div><p className="eyebrow">WORKSPACE / OVERVIEW</p><h1>Appointment Manager</h1><p className="subtitle">Manage your schedule and keep every customer on track.</p></div>
        <div className="today-chip"><CalendarDays size={16}/>{new Date().toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</div>
      </section>

      <section className="stats-grid" aria-label="Appointment summary">
        <StatCard title="Total appointments" value={counts.total} icon={<Users/>} tone="blue"/>
        <StatCard title="Pending" value={counts.pending} icon={<CircleDashed/>} tone="amber"/>
        <StatCard title="Confirmed" value={counts.confirmed} icon={<CheckCircle2/>} tone="green"/>
        <StatCard title="Cancelled" value={counts.cancelled} icon={<XCircle/>} tone="rose"/>
      </section>

      {apiError && <div className="alert error"><strong>Connection issue:</strong> {apiError}</div>}
      {notice && <div className="alert info" role="status">{notice}</div>}

      <section className="content-grid">
        <div className="panel list-panel">
          <div className="panel-heading">
            <div><h2>Appointments</h2><p>Your upcoming customer bookings</p></div>
            <button className="icon-button" onClick={loadAppointments} title="Refresh appointments" aria-label="Refresh appointments"><RefreshCw size={17}/></button>
          </div>
          <div className="toolbar">
            <div className="search-box"><Search size={17}/><input aria-label="Search customer name" placeholder="Search customer name..." value={search} onChange={e => setSearch(e.target.value)}/></div>
            <div className="filter-tabs" role="group" aria-label="Filter by status">
              {statuses.map(status => <button key={status} className={filter === status ? "filter-tab active" : "filter-tab"} onClick={() => setFilter(status)}>{status}</button>)}
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Customer</th><th>Service</th><th>Date & time</th><th>Status</th><th aria-label="Actions"/></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan="5" className="empty-state">Loading appointments...</td></tr> :
                 visibleAppointments.length === 0 ? <tr><td colSpan="5" className="empty-state">No appointments found. Try another filter or add a booking.</td></tr> :
                 visibleAppointments.map(item => <tr key={item._id}>
                  <td><div className="customer-cell"><span className="customer-avatar">{item.customerName.split(" ").map(s=>s[0]).slice(0,2).join("").toUpperCase()}</span><strong>{item.customerName}</strong></div></td>
                  <td>{item.service}</td>
                  <td><span className="date-cell"><Clock3 size={14}/>{formatDate(item.dateTime)}</span></td>
                  <td><div className="status-control"><StatusPill status={item.status}/><select aria-label={`Change status for ${item.customerName}`} value={item.status} onChange={e => handleStatusChange(item._id, e.target.value)}><option>Pending</option><option>Confirmed</option><option>Cancelled</option></select></div></td>
                  <td><button className="delete-button" onClick={() => handleDelete(item._id)} title="Delete appointment" aria-label={`Delete ${item.customerName}`}><Trash2 size={15}/></button></td>
                 </tr>)}
              </tbody>
            </table>
          </div>
          <div className="list-footer"><span>Showing {visibleAppointments.length} of {appointments.length} appointments</span><span>Changes save to database</span></div>
        </div>

        <aside className="panel form-panel">
          <div className="panel-heading"><div><h2>New appointment</h2><p>Fill in the booking details</p></div><span className="plus-icon"><Plus size={18}/></span></div>
          <form onSubmit={handleSubmit} noValidate>
            <FormField label="Customer name" error={errors.customerName}><input name="customerName" value={form.customerName} onChange={updateField} placeholder="e.g. Alex Morgan" maxLength="80"/></FormField>
            <FormField label="Service" error={errors.service}><input name="service" value={form.service} onChange={updateField} placeholder="e.g. Consultation" maxLength="100"/></FormField>
            <FormField label="Date & time" error={errors.dateTime}><input type="datetime-local" name="dateTime" value={form.dateTime} onChange={updateField}/></FormField>
            <FormField label="Initial status"><select name="status" value={form.status} onChange={updateField}><option>Pending</option><option>Confirmed</option><option>Cancelled</option></select></FormField>
            <button className="primary-button" type="submit" disabled={saving}><Plus size={17}/>{saving ? "Adding..." : "Add appointment"}</button>
          </form>
          <div className="form-hint"><span className="hint-dot"/> Required fields must be completed before saving.</div>
        </aside>
      </section>
      <footer className="footer">Appointment Manager <span>•</span> MERN assessment project</footer>
    </main>
  );
}

function StatCard({ title, value, icon, tone }) {
  return <article className="stat-card"><span className={`stat-icon ${tone}`}>{icon}</span><div><p>{title}</p><strong>{value}</strong></div></article>;
}
function FormField({ label, error, children }) {
  return <label className="form-field"><span>{label}</span>{children}{error && <small className="field-error">{error}</small>}</label>;
}
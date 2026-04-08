import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketService } from '../services/ticketService';

const PatientAppointmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [description, setDescription] = useState('');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const results = await ticketService.getPatientAppointments(email, phone);
      setAppointments(results);
      setMessage(results.length === 0 ? 'No se encontraron citas con esos datos.' : 'Citas encontradas.');
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'No se pudieron consultar las citas.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const appointment = await ticketService.createPatientAppointment({
        fullName,
        email,
        phone,
        scheduledFor,
        description,
        title: 'Cita dental'
      });
      setAppointments(prev => [appointment, ...prev]);
      setMessage('Cita solicitada correctamente.');
      setDescription('');
      setScheduledFor('');
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'No se pudo solicitar la cita.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)', padding: '32px 16px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <button className="btn btn-outline" onClick={() => navigate('/login')} style={{ marginBottom: 16 }}>
          Volver
        </button>

        <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.08)', marginBottom: 24 }}>
          <h1 style={{ marginTop: 0, marginBottom: 8 }}>Mis Citas</h1>
          <p style={{ color: '#4b5563', marginTop: 0 }}>Consulta tus citas programadas o solicita una nueva cita sin entrar al sistema interno.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            <form onSubmit={handleLookup}>
              <h2 style={{ fontSize: 18 }}>Consultar citas</h2>
              <div className="form-group">
                <label className="form-label">Correo</label>
                <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} required />
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading}>Consultar</button>
            </form>

            <form onSubmit={handleCreate}>
              <h2 style={{ fontSize: 18 }}>Solicitar cita</h2>
              <div className="form-group">
                <label className="form-label">Nombre completo</label>
                <input className="form-input" value={fullName} onChange={e => setFullName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Correo</label>
                <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha y hora deseada</label>
                <input className="form-input" type="datetime-local" value={scheduledFor} onChange={e => setScheduledFor(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Motivo</label>
                <textarea className="form-input" rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe el motivo de tu consulta" />
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading}>Solicitar cita</button>
            </form>
          </div>

          {message && (
            <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: '#eff6ff', color: '#1d4ed8' }}>
              {message}
            </div>
          )}
        </div>

        <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
          <h2 style={{ marginTop: 0 }}>Citas encontradas</h2>
          {appointments.length === 0 ? (
            <p style={{ color: '#6b7280' }}>No hay citas para mostrar.</p>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {appointments.map(appointment => (
                <div key={appointment.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <strong>{appointment.title}</strong>
                    <span>{appointment.status}</span>
                  </div>
                  <div style={{ color: '#4b5563', marginTop: 8 }}>{appointment.description}</div>
                  <div style={{ marginTop: 8, fontSize: 14, color: '#374151' }}>
                    Fecha programada: {appointment.scheduledFor ? new Date(appointment.scheduledFor).toLocaleString() : 'Pendiente'}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 14, color: '#374151' }}>
                    Profesional asignado: {appointment.assignedTo?.fullName || 'Pendiente de asignación'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientAppointmentsPage;
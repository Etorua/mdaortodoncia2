import React, { useState, useEffect } from 'react';

export interface AddPatientModalProps {
  onSubmit: (data: any) => void;
  loading?: boolean;
  initialData?: any;
  onCancel?: () => void;
}

const AddPatientModal: React.FC<AddPatientModalProps> = ({ onSubmit, loading = false, initialData = {}, onCancel }) => {
  const [nombreCompleto, setNombreCompleto] = useState(initialData.fullName || '');
  const [correo, setCorreo] = useState(initialData.email || '');
  const [telefono, setTelefono] = useState(initialData.phone || '');
  const [direccion, setDireccion] = useState(initialData.address || '');
  const [fechaNacimiento, setFechaNacimiento] = useState(initialData.birthDate ? String(initialData.birthDate).slice(0, 10) : '');
  const [genero, setGenero] = useState(initialData.gender || '');
  const [antecedentes, setAntecedentes] = useState(initialData.medicalHistory || '');

  useEffect(() => {
    if (initialData) {
        setNombreCompleto(initialData.fullName || '');
        setCorreo(initialData.email || '');
        setTelefono(initialData.phone || '');
        setDireccion(initialData.address || '');
        setFechaNacimiento(initialData.birthDate ? String(initialData.birthDate).slice(0, 10) : '');
        setGenero(initialData.gender || '');
        setAntecedentes(initialData.medicalHistory || '');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      nombre_completo: nombreCompleto,
      correo,
      telefono,
      direccion,
      fecha_nacimiento: fechaNacimiento || undefined,
      genero,
      antecedentes
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label form-label-required">Nombre Completo</label>
          <input 
            required
            className="form-input"
            placeholder="Ej. Juan Pérez" 
            value={nombreCompleto} 
            onChange={e => setNombreCompleto(e.target.value)} 
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label form-label-required">Correo Electrónico</label>
          <input 
            type="email"
            className="form-input"
            placeholder="juan@ejemplo.com" 
            value={correo} 
            onChange={e => setCorreo(e.target.value)} 
          />
        </div>
        <div className="form-group">
          <label className="form-label form-label-required">Teléfono</label>
          <input 
            className="form-input"
            placeholder="Ej. 55-1234-5678" 
            value={telefono} 
            onChange={e => setTelefono(e.target.value)} 
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Fecha de Nacimiento</label>
          <input 
            type="date"
            className="form-input"
            value={fechaNacimiento}
            onChange={e => setFechaNacimiento(e.target.value)} 
          />
        </div>
        <div className="form-group">
          <label className="form-label">Género</label>
          <select 
            className="form-input"
            value={genero}
            onChange={e => setGenero(e.target.value)}
          >
            <option value="">-- Seleccionar --</option>
            <option value="femenino">Femenino</option>
            <option value="masculino">Masculino</option>
            <option value="otro">Otro</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group" style={{ width: '100%' }}>
          <label className="form-label">Dirección</label>
          <input 
            className="form-input"
            placeholder="Domicilio del paciente" 
            value={direccion} 
            onChange={e => setDireccion(e.target.value)} 
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group" style={{ width: '100%' }}>
          <label className="form-label">Antecedentes Médicos</label>
          <textarea 
            className="form-input"
            style={{ height: '100px', resize: 'vertical' }}
            placeholder="Describa antecedentes médicos relevantes..." 
            value={antecedentes} 
            onChange={e => setAntecedentes(e.target.value)} 
          />
        </div>
      </div>

      <div className="modal-actions">
        {onCancel && (
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </button>
        )}
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading}
        >
          {loading ? 'Guardando...' : 'Guardar Paciente'}
        </button>
      </div>
    </form>
  );
};

export default AddPatientModal;

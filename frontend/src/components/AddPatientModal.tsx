import React, { useState, useEffect } from 'react';

export interface AddPatientModalProps {
  onSubmit: (data: any) => void;
  loading?: boolean;
  initialData?: any;
  onCancel?: () => void;
}

const AddPatientModal: React.FC<AddPatientModalProps> = ({ onSubmit, loading = false, initialData = {}, onCancel }) => {
  const [nombreCompleto, setNombreCompleto] = useState(initialData.nombre_completo || '');
  const [correo, setCorreo] = useState(initialData.correo || '');
  const [telefono, setTelefono] = useState(initialData.telefono || '');
  const [antecedentes, setAntecedentes] = useState(initialData.antecedentes || '');

  useEffect(() => {
    if (initialData) {
        setNombreCompleto(initialData.nombre_completo || '');
        setCorreo(initialData.correo || '');
        setTelefono(initialData.telefono || '');
        setAntecedentes(initialData.antecedentes || '');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      nombre_completo: nombreCompleto,
      correo,
      telefono,
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
            required
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
            required
            className="form-input"
            placeholder="Ej. 55-1234-5678" 
            value={telefono} 
            onChange={e => setTelefono(e.target.value)} 
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

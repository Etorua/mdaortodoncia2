import React, { useState, useEffect } from 'react';

export interface AddInsumoModalProps {
  onSubmit: (data: any) => void;
  loading?: boolean;
  initialData?: any;
  onCancel?: () => void;
}

const AddInsumoModal: React.FC<AddInsumoModalProps> = ({ onSubmit, loading = false, initialData = {}, onCancel }) => {
  const [nombre, setNombre] = useState(initialData.nombre || '');
  const [descripcion, setDescripcion] = useState(initialData.descripcion || '');
  const [cantidad, setCantidad] = useState(initialData.cantidad || 0);
  const [unidad, setUnidad] = useState(initialData.unidad || '');
  const [ubicacion, setUbicacion] = useState(initialData.ubicacion || '');

  useEffect(() => {
    if (initialData) {
      setNombre(initialData.nombre || '');
      setDescripcion(initialData.descripcion || '');
      setCantidad(initialData.cantidad || 0);
      setUnidad(initialData.unidad || '');
      setUbicacion(initialData.ubicacion || '');
    }
  }, [initialData]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ nombre, descripcion, cantidad, unidad, ubicacion });
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="form-row">
        <div className="form-group">
          <label className="form-label form-label-required">Nombre</label>
          <input required className="form-input" placeholder="Ej. Guantes de seguridad" value={nombre} onChange={e => setNombre(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Descripción</label>
          <input className="form-input" placeholder="Ej. Guantes resistentes" value={descripcion} onChange={e => setDescripcion(e.target.value)} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label form-label-required">Cantidad</label>
          <input required type="number" className="form-input" placeholder="Ej. 50" value={cantidad} onChange={e => setCantidad(Number(e.target.value))} />
        </div>
        <div className="form-group">
          <label className="form-label">Unidad</label>
          <input className="form-input" placeholder="Ej. Pares" value={unidad} onChange={e => setUnidad(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Ubicación</label>
          <input className="form-input" placeholder="Ej. Almacén A" value={ubicacion} onChange={e => setUbicacion(e.target.value)} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>Regresar</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
      </div>
    </form>
  );
};

export default AddInsumoModal;

import React, { useState, useEffect } from 'react';
import { User, Equipment } from '@/types';
import { useAuth } from '@/hooks/useAuth.tsx';
import SearchableSelect from './SearchableSelect';

export interface TicketFormProps {
  onSubmit: (data: any) => void;
  loading?: boolean;
  initialData?: any;
  users?: User[];
  equipment?: Equipment[];
  onCancel?: () => void;
  isEditMode?: boolean;
}

const DetailItem = ({ label, value, fullWidth = false }: { label: string, value: React.ReactNode, fullWidth?: boolean }) => (
  <div className="form-group" style={fullWidth ? { gridColumn: '1 / -1' } : {}}>
    <label className="form-label" style={{ color: '#6b7280', fontSize: '0.875rem' }}>{label}</label>
    <div style={{ padding: '0.5rem 0', color: '#111827', fontWeight: 500 }}>{value}</div>
  </div>
);

const TicketForm: React.FC<TicketFormProps> = ({ 
  onSubmit, 
  loading = false, 
  initialData = {}, 
  users = [], 
  equipment = [],
  onCancel,
  isEditMode = false
}) => {
  const { user } = useAuth();
  const isTechnician = user?.role === 'tecnico' || user?.role === 'admin';
  const isClosed = initialData?.status === 'cerrado';

  // Filter equipment for non-technicians
  const availableEquipment = isTechnician 
    ? equipment 
    : equipment.filter(eq => {
        if (!user || !user.id) return false;
        if (!eq.assignedUserId) return false;
        
        // Direct comparison
        if (eq.assignedUserId === user.id) return true;
        
        // Normalized comparison
        const eqId = String(eq.assignedUserId).trim().toLowerCase();
        const userId = String(user.id).trim().toLowerCase();
        return eqId === userId;
    });

  // Debug logging for assignment issues (console only)
  useEffect(() => {
    if (!isTechnician && equipment.length > 0) {
      console.log('TicketForm Equipment Check:', {
        userId: user?.id,
        totalEquipment: equipment.length,
        available: availableEquipment.length,
        firstFew: equipment.slice(0, 3).map(e => ({ 
          id: e.id, 
          assignedTo: e.assignedUserId,
          match: e.assignedUserId === user?.id
        }))
      });
    }
  }, [isTechnician, equipment, user, availableEquipment.length]);

  const [title, setTitle] = useState(initialData.title || (isTechnician ? '' : 'Nuevo Reporte'));
  const [description, setDescription] = useState(initialData.description || '');
  const [priority, setPriority] = useState(initialData.priority || 'sin_clasificar');
  const [status, setStatus] = useState(initialData.status || 'nuevo');
  const [serviceType, setServiceType] = useState(initialData.serviceType || 'correctivo');
  const [equipmentId, setEquipmentId] = useState(initialData.equipmentId || '');
  const [assignedToId, setAssignedToId] = useState(initialData.assignedToId || '');
  const [reportedById, setReportedById] = useState(initialData.reportedById || user?.id || '');
  const [diagnosis, setDiagnosis] = useState(initialData.diagnosis || '');
  const [solution, setSolution] = useState(initialData.solution || '');
  const [notes, setNotes] = useState(initialData.notes || '');
  const [timeSpent, setTimeSpent] = useState(initialData.timeSpent || '');
  const [parts, setParts] = useState<Array<{ nombre: string; cantidad: number }>>(() => {
    if (!initialData.parts) return [];
    if (Array.isArray(initialData.parts)) return initialData.parts;
    if (typeof initialData.parts === 'string') {
      try {
        return JSON.parse(initialData.parts);
      } catch (e) {
        console.error('Error parsing initial parts:', e);
        return [];
      }
    }
    return [];
  });
  const [commonServices, setCommonServices] = useState<Array<{ nombre: string; tipo: string }>>([]);
  const [insumos, setInsumos] = useState<Array<{ nombre: string; cantidad: number; unidad: string }>>([]);
  const [activePartIndex, setActivePartIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch('/catalogo_servicios.json')
      .then(res => res.json())
      .then(data => setCommonServices(data))
      .catch(err => console.error('Error loading services catalog:', err));

    // Cargar insumos para el autocompletado
    const token = sessionStorage.getItem('authToken');
    fetch('/api/insumos', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setInsumos(data.data);
        } else if (Array.isArray(data)) {
           setInsumos(data);
        }
      })
      .catch(err => console.error('Error loading insumos:', err));
  }, []);

  useEffect(() => {
    // Solo actualizar si initialData tiene contenido real (modo edición)
    // Evita borrar el formulario cuando initialData es {} (modo creación) y el componente se re-renderiza
    if (initialData && Object.keys(initialData).length > 0) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setPriority(initialData.priority || 'media');
      setStatus(initialData.status || 'nuevo');
      setServiceType(initialData.serviceType || 'correctivo');
      setEquipmentId(initialData.equipmentId || '');
      setAssignedToId(initialData.assignedToId || '');
      setReportedById(initialData.reportedById || user?.id || '');
      setDiagnosis(initialData.diagnosis || '');
      setSolution(initialData.solution || '');
      setNotes(initialData.notes || '');
      setTimeSpent(initialData.timeSpent || '');
      
      let parsedParts = [];
      if (typeof initialData.parts === 'string') {
        try {
          parsedParts = JSON.parse(initialData.parts);
        } catch (e) {
          console.error('Error parsing parts:', e);
        }
      } else if (Array.isArray(initialData.parts)) {
        parsedParts = initialData.parts;
      }
      setParts(parsedParts);
    } else if (!isTechnician && availableEquipment.length === 1 && !equipmentId) {
      // Auto-select equipment if user has only one AND none is selected yet
      setEquipmentId(availableEquipment[0].id);
    }
  }, [initialData, isTechnician, availableEquipment]);

  // Auto-select equipment when reportedBy changes (only for technicians creating new tickets)
  useEffect(() => {
    if (isTechnician && !initialData.id && reportedById) {
      const assignedEquipment = equipment.find(e => e.assignedUserId === reportedById);
      if (assignedEquipment) {
        setEquipmentId(assignedEquipment.id);
      }
    }
  }, [reportedById, equipment, isTechnician, initialData.id]);

  function handleAddPart() {
    setParts([...parts, { nombre: '', cantidad: 1 }]);
  }
  function handleRemovePart(idx: number) {
    setParts(parts.filter((_, i) => i !== idx));
  }
  function handlePartChange(idx: number, field: 'nombre' | 'cantidad', value: string | number) {
    setParts(parts.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  }

  function handleCommonServiceChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const selectedName = e.target.value;
    // Permitir deseleccionar si es necesario
    if (!selectedName) {
      if (!isTechnician) {
        setTitle('');
        setServiceType('correctivo');
      }
      return;
    }
    
    const service = commonServices.find(s => s.nombre === selectedName);
    if (service) {
      setTitle(service.nombre);
      setServiceType(service.tipo.toLowerCase());
    }
  }

  const selectedEquipment = availableEquipment.find(e => e.id === equipmentId);

  if (isClosed) {
    return (
      <div className="ticket-viewer">
        <div className="form-section">
          <h3 className="section-title">Resumen del Ticket</h3>
          <div className="ticket-header" style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem' }}>
             <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#111827' }}>{title}</h2>
             <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <span className={`status-badge status-${status}`}>{status.toUpperCase()}</span>
                <span className={`priority-badge priority-${priority}`}>{priority.toUpperCase()}</span>
                <span className="service-type-badge" style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#e5e7eb', color: '#374151' }}>{serviceType.toUpperCase()}</span>
             </div>
          </div>
        </div>

        <div className="form-section">
            <h3 className="section-title">Datos del Solicitante</h3>
            <div className="details-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <DetailItem label="Nombre" value={initialData.reportedBy?.fullName || 'N/A'} />
                <DetailItem label="Departamento" value={initialData.reportedBy?.department || 'N/A'} />
            </div>
        </div>

        <div className="form-section">
            <h3 className="section-title">Equipo Afectado</h3>
             {selectedEquipment ? (
                <div className="details-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <DetailItem label="Equipo" value={`${selectedEquipment.name} (${selectedEquipment.inventoryNumber || selectedEquipment.serialNumber || ''})`} />
                  <DetailItem label="Asignado a" value={selectedEquipment.assignedUser?.fullName || users.find(u => u.id === selectedEquipment.assignedUserId)?.fullName || 'Sin asignar'} />
                  <DetailItem label="Tipo" value={selectedEquipment.type} />
                  <DetailItem label="Ubicación" value={selectedEquipment.location} />
                </div>
             ) : (
                <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No hay información del equipo.</p>
             )}
        </div>

        <div className="form-section">
            <h3 className="section-title">Descripción del Problema</h3>
            <div className="text-block" style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '0.5rem', color: '#374151' }}>
                {description}
            </div>
        </div>

        <div className="form-section">
            <h3 className="section-title">Detalles Técnicos</h3>
            <div className="details-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <DetailItem label="Diagnóstico" value={diagnosis || 'Sin diagnóstico'} fullWidth />
                <DetailItem label="Solución" value={solution || 'Sin solución registrada'} fullWidth />
                <DetailItem label="Tiempo Invertido" value={timeSpent ? `${timeSpent} horas` : 'N/A'} />
                <DetailItem label="Técnico Asignado" value={users.find(u => u.id === assignedToId)?.fullName || 'Sin asignar'} />
            </div>
        </div>

        <div className="form-section">
            <h3 className="section-title">Partes y Refacciones</h3>
            {parts.length > 0 ? (
                <ul className="parts-list" style={{ listStyle: 'none', padding: 0 }}>
                    {parts.map((p, idx) => (
                        <li key={idx} style={{ padding: '0.5rem', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{p.nombre}</span>
                            <span style={{ fontWeight: 600 }}>x{p.cantidad}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No se utilizaron partes.</p>
            )}
        </div>

        <div className="form-actions" style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
            <button type="button" className="btn btn-secondary" onClick={onCancel}>Cerrar</button>
        </div>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // For non-technicians, force default status and unassigned
    const finalStatus = isTechnician ? status : 'nuevo';
    const finalAssignedToId = isTechnician ? assignedToId : null;
    
    // For non-technicians, ensure title is set if empty. 
    // Use existing state for priority/serviceType to preserve values during edit, 
    // or defaults for new tickets (handled by state initialization).
    const finalTitle = title || 'Nuevo Reporte';

    onSubmit({ 
      title: finalTitle,
      description,
      priority,
      status: finalStatus,
      serviceType,
      equipmentId, 
      assignedToId: finalAssignedToId,
      reportedById,
      diagnosis,
      solution,
      notes,
      timeSpent,
      partsUsed: parts // Enviar como array real
    });
  }

  const selectedUser = users.find(u => u.id === reportedById) || (initialData.reportedBy) || user;

  return (
    <form onSubmit={handleSubmit} className="ticket-form">
      {/* Sección 1: Datos de usuario */}
      <div className="form-section">
        <h3 className="section-title">Datos de Usuario</h3>
        {user?.role === 'admin' ? (
          <div className="form-group">
            <label className="form-label">Usuario Reportante (Admin)</label>
            <SearchableSelect
              options={[...users]
                .sort((a, b) => a.fullName.localeCompare(b.fullName))
                .map(u => ({
                  value: u.id,
                  label: u.fullName,
                  subLabel: u.department
                }))
              }
              value={reportedById}
              onChange={(val) => setReportedById(val)}
              placeholder="Seleccionar Usuario"
            />
          </div>
        ) : (
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nombre(s)</label>
              <input 
                className="form-input" 
                value={selectedUser?.fullName || ''} 
                disabled 
                readOnly 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Departamento</label>
              <input 
                className="form-input" 
                value={selectedUser?.department || ''} 
                disabled 
                readOnly 
              />
            </div>
          </div>
        )}
      </div>

      {/* Sección 2: Información del equipo */}
      <div className="form-section">
        <h3 className="section-title">Información del Equipo</h3>
        <div className="form-group">
          <label className="form-label form-label-required">Seleccionar Equipo</label>
          {!isTechnician && availableEquipment.length === 0 && (
             <div style={{ fontSize: '0.85rem', color: '#b91c1c', marginBottom: '0.5rem', padding: '0.75rem', backgroundColor: '#fef2f2', borderRadius: '0.375rem', border: '1px solid #fecaca' }}>
               {equipment.length === 0 ? 'Cargando equipos...' : 'No tiene equipos asignados. Por favor contacte al administrador si cree que esto es un error.'}
             </div>
          )}
          <SearchableSelect
            required
            placeholder="Seleccionar Equipo"
            value={equipmentId}
            onChange={(val) => setEquipmentId(val)}
            options={availableEquipment.map(eq => {
              const inventory = eq.inventoryNumber || eq.serialNumber || 'S/N';
              const assignedName = eq.assignedUser?.fullName || users.find(u => u.id === eq.assignedUserId)?.fullName || '';
              
              return {
                value: eq.id,
                label: eq.name, // Columna principal: Nombre del equipo
                subLabel: `(${inventory})`, // Columna secundaria: Inventario
                extraInfo: assignedName // Columna terciaria: Usuario asignado
              };
            })}
          />
        </div>

        {selectedEquipment && (
          <div className="equipment-details-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
            <div className="form-group">
              <label className="form-label">Tipo</label>
              <input className="form-input" value={selectedEquipment.type || ''} disabled readOnly />
            </div>
            <div className="form-group">
              <label className="form-label">Procesador</label>
              <input className="form-input" value={selectedEquipment.processor || ''} disabled readOnly />
            </div>
            <div className="form-group">
              <label className="form-label">RAM</label>
              <input className="form-input" value={selectedEquipment.ram || ''} disabled readOnly />
            </div>
            <div className="form-group">
              <label className="form-label">Disco Duro</label>
              <input className="form-input" value={selectedEquipment.hardDrive || ''} disabled readOnly />
            </div>
            <div className="form-group">
              <label className="form-label">Asignado a</label>
              <input className="form-input" value={selectedEquipment.assignedUser?.fullName || users.find(u => u.id === selectedEquipment.assignedUserId)?.fullName || 'Sin asignar'} disabled readOnly />
            </div>
            <div className="form-group">
              <label className="form-label">Ubicación</label>
              <input className="form-input" value={selectedEquipment.location || ''} disabled readOnly />
            </div>
          </div>
        )}
      </div>

      {/* Sección 3: Descripción Detallada */}
      <div className="form-section">
        <h3 className="section-title">Descripción Detallada</h3>
        <div className="form-group">
          <textarea 
            required
            minLength={3}
            rows={4}
            className="form-input"
            placeholder="Describa el problema detalladamente..." 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            style={{ resize: 'vertical' }}
            disabled={loading || isClosed}
          />
        </div>
      </div>

      {/* Sección 4: Catálogo de servicio */}
      {isTechnician && initialData.id && (
      <div className="form-section">
        <h3 className="section-title">Catálogo de Servicio</h3>
        {commonServices.length > 0 && (
          <div className="form-group">
            <label className="form-label">Servicios Comunes</label>
            <select 
              className="form-input" 
              onChange={handleCommonServiceChange} 
              value={commonServices.find(s => s.nombre === title)?.nombre || ""}
              disabled={loading || isClosed}
            >
              <option value="">-- Seleccionar Servicio --</option>
              {commonServices.map((s, idx) => (
                <option key={idx} value={s.nombre}>
                  {s.nombre} ({s.tipo})
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="form-group">
          <label className="form-label form-label-required">Título del Ticket</label>
          <input 
            required
            minLength={5}
            className="form-input"
            placeholder="Resumen del problema" 
            value={title} 
            onChange={e => setTitle(e.target.value)}
            disabled={loading || isClosed} // User can edit title if not using catalog, or refine it
          />
        </div>
      </div>
      )}

      {/* Sección 5: Prioridad, Estado, Tipo de Servicio */}
      {isTechnician && initialData.id && (
      <div className="form-section">
        <h3 className="section-title">Clasificación del Servicio</h3>
        <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div className="form-group">
            <label className="form-label">Prioridad</label>
            <select 
              className="form-input" 
              value={priority} 
              onChange={e => setPriority(e.target.value)}
              disabled={!isTechnician || loading || isClosed} 
            >
              <option value="sin_clasificar">Sin Clasificar</option>
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Estado</label>
            <select 
              className="form-input" 
              value={status} 
              onChange={e => setStatus(e.target.value)}
              disabled={!isTechnician || loading || isClosed} 
            >
              <option value="nuevo">Nuevo</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_proceso">En Proceso</option>
              <option value="cerrado">Cerrado</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Tipo de Servicio</label>
            <select 
              className="form-input" 
              value={serviceType} 
              onChange={e => setServiceType(e.target.value)}
              disabled={!isTechnician || loading || isClosed} 
            >
              <option value="correctivo">Correctivo</option>
              <option value="preventivo">Preventivo</option>
              <option value="instalacion">Instalación</option>
            </select>
          </div>
        </div>
      </div>
      )}

      {/* Secciones Técnicas (Solo visibles para técnicos al editar) */}
      {isTechnician && initialData.id && (
        <>
          {/* Sección 6: Diagnóstico Técnico */}
          <div className="form-section">
            <h3 className="section-title">Diagnóstico Técnico</h3>
            <div className="form-group">
              <textarea 
                rows={3}
                className="form-input"
                placeholder="Diagnóstico del técnico..." 
                value={diagnosis} 
                onChange={e => setDiagnosis(e.target.value)} 
                style={{ resize: 'vertical' }} 
                disabled={loading || isClosed}
              />
            </div>
          </div>

          {/* Sección 7: Solución Aplicada */}
          <div className="form-section">
            <h3 className="section-title">Solución Aplicada</h3>
            <div className="form-group">
              <textarea 
                rows={3}
                className="form-input"
                placeholder="Solución aplicada..." 
                value={solution} 
                onChange={e => setSolution(e.target.value)} 
                style={{ resize: 'vertical' }} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tiempo Invertido (horas)</label>
              <input 
                type="number"
                min="0"
                step="0.5"
                className="form-input"
                placeholder="0.0" 
                value={timeSpent} 
                onChange={e => setTimeSpent(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Técnico Asignado</label>
              <select 
                className="form-input" 
                value={assignedToId} 
                onChange={e => setAssignedToId(e.target.value)}
                disabled={loading || isClosed || (!!initialData.assignedToId && user?.role !== 'admin')}
              >
                <option value="">-- Sin Asignar --</option>
                {users.filter(u => u.role === 'tecnico' || u.role === 'admin').map(u => (
                  <option key={u.id} value={u.id}>{u.fullName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sección 8: Partes y Refacciones */}
          <div className="form-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 className="section-title" style={{ marginBottom: 0 }}>Partes y Refacciones</h3>
              <button 
                type="button" 
                onClick={handleAddPart} 
                style={{ 
                  fontSize: '0.85rem', 
                  color: '#2563eb', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                + Agregar Parte
              </button>
            </div>
            
            {parts.length === 0 && <p style={{ fontSize: '0.875rem', color: '#9ca3af', fontStyle: 'italic' }}>No se han agregado partes.</p>}

            {parts.map((p, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'flex-start' }}>
                <div style={{ flex: 2, position: 'relative' }}>
                  <input
                    className="form-input"
                    placeholder="Nombre de la pieza"
                    value={p.nombre}
                    onChange={e => handlePartChange(idx, 'nombre', e.target.value)}
                    onFocus={() => setActivePartIndex(idx)}
                    onBlur={() => setTimeout(() => setActivePartIndex(null), 200)}
                    style={{ width: '100%' }}
                    autoComplete="off"
                  />
                  {activePartIndex === idx && (
                    <div style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: 0,
                      right: 0,
                      zIndex: 50,
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      marginBottom: '4px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}>
                      {insumos
                        .filter(i => !p.nombre || i.nombre.toLowerCase().includes(p.nombre.toLowerCase()))
                        .map((item, i) => (
                          <div
                            key={i}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handlePartChange(idx, 'nombre', item.nombre);
                              setActivePartIndex(null);
                            }}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f3f4f6',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '0.9rem'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                          >
                            <span style={{ fontWeight: 500, color: '#374151' }}>{item.nombre}</span>
                            <span style={{ fontSize: '0.8rem', color: item.cantidad > 0 ? '#059669' : '#dc2626', backgroundColor: item.cantidad > 0 ? '#d1fae5' : '#fee2e2', padding: '2px 6px', borderRadius: '4px' }}>
                              {item.cantidad} {item.unidad}
                            </span>
                          </div>
                        ))}
                        {insumos.filter(i => !p.nombre || i.nombre.toLowerCase().includes(p.nombre.toLowerCase())).length === 0 && (
                          <div style={{ padding: '8px 12px', color: '#9ca3af', fontSize: '0.9rem', fontStyle: 'italic' }}>
                            No se encontraron coincidencias
                          </div>
                        )}
                    </div>
                  )}
                </div>
                <input
                  type="number"
                  min={1}
                  className="form-input"
                  placeholder="Cant."
                  value={p.cantidad}
                  onChange={e => handlePartChange(idx, 'cantidad', Number(e.target.value))}
                  style={{ flex: 1 }}
                />
                <button 
                  type="button" 
                  onClick={() => handleRemovePart(idx)} 
                  style={{ 
                    padding: '0 0.5rem', 
                    color: '#dc2626', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer',
                    height: '38px'
                  }}
                  title="Eliminar"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Sección 9: Notas (Observaciones) */}
          <div className="form-section">
            <h3 className="section-title">Notas (Observaciones)</h3>
            <div className="form-group">
              <textarea 
                rows={3}
                className="form-input"
                placeholder="Notas u observaciones adicionales..." 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
                style={{ resize: 'vertical' }} 
              />
            </div>
          </div>
        </>
      )}

      <div className="form-actions" style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
        {onCancel && (
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={onCancel}
          >
            Regresar
          </button>
        )}
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading} 
        >
          {loading ? 'Guardando...' : 'Guardar Ticket'}
        </button>
      </div>
    </form>
  );
};

export default TicketForm;

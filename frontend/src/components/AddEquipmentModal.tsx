import React, { useState, useEffect } from 'react';
import { User, Department } from '@/types';
import SearchableSelect from './SearchableSelect';

export interface AddEquipmentModalProps {
  onSubmit: (data: any) => void;
  loading?: boolean;
  initialData?: any;
  users?: User[];
  departments?: Department[];
  onCancel?: () => void;
}

const AddEquipmentModal: React.FC<AddEquipmentModalProps> = ({ 
  onSubmit, 
  loading = false, 
  initialData = {}, 
  users = [],
  departments = [],
  onCancel 
}) => {
  const [name, setName] = useState(initialData.name || '');
  const [type, setType] = useState(initialData.type || 'computadora');
  const [brand, setBrand] = useState(initialData.brand || '');
  const [model, setModel] = useState(initialData.model || '');
  const [serialNumber, setSerialNumber] = useState(initialData.serialNumber || '');
  const [status, setStatus] = useState(initialData.status || 'operativo');
  const [location, setLocation] = useState(initialData.location || '');
  const [purchaseDate, setPurchaseDate] = useState(initialData.purchaseDate ? initialData.purchaseDate.split('T')[0] : '');
  const [warrantyExpiration, setWarrantyExpiration] = useState(initialData.warrantyExpiration ? initialData.warrantyExpiration.split('T')[0] : '');
  const [assignedUserId, setAssignedUserId] = useState(initialData.assignedUserId || '');
  const [notes, setNotes] = useState(initialData.notes || '');
  const [requirement, setRequirement] = useState(initialData.requirement || '');
  
  // Hardware Specs
  const [inventoryNumber, setInventoryNumber] = useState(initialData.inventoryNumber || '');
  const [processor, setProcessor] = useState(initialData.processor || '');
  const [ram, setRam] = useState(initialData.ram || '');
  const [hardDrive, setHardDrive] = useState(initialData.hardDrive || '');
  const [operatingSystem, setOperatingSystem] = useState(initialData.operatingSystem || 'Windows 10 Pro');

  // Listas de opciones estandarizadas
  const OS_OPTIONS = [
    "Windows 11 Pro",
    "Windows 11 Home",
    "Windows 10 Pro",
    "Windows 10 Home",
    "Windows 8.1",
    "Windows 7",
    "macOS Sonoma",
    "macOS Ventura",
    "macOS Monterey",
    "Ubuntu Linux",
    "Windows Server 2022",
    "Windows Server 2019",
    "Android",
    "iOS",
    "Otro"
  ];

  const RAM_OPTIONS = [
    "4GB", "8GB", "12GB", "16GB", "32GB", "64GB", "128GB"
  ];

  const STORAGE_OPTIONS = [
    "128GB SSD", "240GB SSD", "256GB SSD", "480GB SSD", "500GB SSD", "512GB SSD", "1TB SSD",
    "500GB HDD", "1TB HDD", "2TB HDD"
  ];

  const PROCESSOR_OPTIONS = [
    "Intel Core i3", "Intel Core i5", "Intel Core i7", "Intel Core i9", "Intel Xeon",
    "AMD Ryzen 3", "AMD Ryzen 5", "AMD Ryzen 7", "AMD Ryzen 9",
    "Apple M1", "Apple M1 Pro", "Apple M1 Max",
    "Apple M2", "Apple M2 Pro", "Apple M2 Max",
    "Apple M3", "Apple M3 Pro", "Apple M3 Max",
    "Otro"
  ];

  const BRAND_OPTIONS = [
    "Dell", "HP", "Lenovo", "Apple", "Acer", "Asus", "Samsung", "Toshiba", "Brother", "Epson", "Canon", "Kyocera"
  ];

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      // ... restaurar otros campos
      setOperatingSystem(initialData.operatingSystem || 'Windows 10 Pro');
      // ...
    }
  }, [initialData]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ 
      name, 
      type, 
      brand, 
      model, 
      serialNumber, 
      status, 
      location, 
      purchaseDate: purchaseDate || null, 
      warrantyExpiration: warrantyExpiration || null, 
      assignedUserId: assignedUserId || null, 
      notes,
      requirement,
      inventoryNumber,
      processor,
      ram,
      hardDrive,
      operatingSystem
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label form-label-required">Nombre del Equipo</label>
          <input 
            required
            className="form-input"
            placeholder="Ej: Laptop Dell 01" 
            value={name} 
            onChange={e => setName(e.target.value)} 
          />
        </div>
        <div className="form-group">
          <label className="form-label">Tipo</label>
          <select className="form-input" value={type} onChange={e => setType(e.target.value)}>
            <option value="computadora">Computadora</option>
            <option value="laptop">Laptop</option>
            <option value="desktop">Desktop</option>
            <option value="impresora">Impresora</option>
            <option value="servidor">Servidor</option>
            <option value="celular">Celular</option>
            <option value="telefono">Teléfono</option>
            <option value="monitor">Monitor</option>
            <option value="tv">TV</option>
            <option value="tablet">Tablet</option>
            <option value="otro">Otro</option>
          </select>
        </div>
      </div>

      <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <div className="form-group">
          <label className="form-label">Marca</label>
          <input 
            className="form-input"
            placeholder="Marca" 
            value={brand} 
            list="brand-options"
            onChange={e => setBrand(e.target.value)} 
          />
          <datalist id="brand-options">
            {BRAND_OPTIONS.map(opt => <option key={opt} value={opt} />)}
          </datalist>
        </div>
        <div className="form-group">
          <label className="form-label">Modelo</label>
          <input 
            className="form-input"
            placeholder="Modelo" 
            value={model} 
            onChange={e => setModel(e.target.value)} 
          />
        </div>
        <div className="form-group">
          <label className="form-label form-label-required">No. Serie</label>
          <input 
            required
            className="form-input"
            placeholder="S/N" 
            value={serialNumber} 
            onChange={e => setSerialNumber(e.target.value)} 
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Estado</label>
          <select className="form-input" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="operativo">Operativo</option>
            <option value="en_reparacion">En Reparación</option>
            <option value="en_almacen">En Almacén</option>
            <option value="baja">De Baja</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Ubicación (Departamento)</label>
          <select 
            className="form-input"
            value={location} 
            onChange={e => setLocation(e.target.value)} 
          >
            <option value="">Seleccionar Departamento</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.display_name}>
                {dept.display_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Fecha de Compra</label>
          <input 
            type="date"
            className="form-input"
            value={purchaseDate} 
            onChange={e => setPurchaseDate(e.target.value)} 
          />
        </div>
        <div className="form-group">
          <label className="form-label">Vencimiento Garantía</label>
          <input 
            type="date"
            className="form-input"
            value={warrantyExpiration} 
            onChange={e => setWarrantyExpiration(e.target.value)} 
          />
        </div>
      </div>

      <div style={{ borderTop: '1px solid #e5e7eb', margin: '1rem 0', paddingTop: '1rem' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: '#374151' }}>Especificaciones Técnicas</h4>
        
        <div className="form-group">
          <label className="form-label">Activo Fijo</label>
          <input 
            className="form-input"
            placeholder="Ej: INV-2023-001" 
            value={inventoryNumber} 
            onChange={e => setInventoryNumber(e.target.value)} 
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Procesador</label>
            <select 
              className="form-input"
              value={processor} 
              onChange={e => setProcessor(e.target.value)} 
            >
              <option value="">Seleccionar Procesador</option>
              {PROCESSOR_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">RAM</label>
            <select 
              className="form-input"
              value={ram} 
              onChange={e => setRam(e.target.value)} 
            >
              <option value="">Seleccionar RAM</option>
              {RAM_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Disco Duro</label>
            <select 
              className="form-input"
              value={hardDrive} 
              onChange={e => setHardDrive(e.target.value)} 
            >
              <option value="">Seleccionar Disco</option>
              {STORAGE_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Sistema Operativo</label>
            <select
              className="form-input"
              value={operatingSystem} 
              onChange={e => setOperatingSystem(e.target.value)} 
            >
              <option value="">Seleccionar SO</option>
              {OS_OPTIONS.map(os => (
                <option key={os} value={os}>{os}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Usuario Asignado</label>
        <SearchableSelect
          value={assignedUserId}
          onChange={(val) => setAssignedUserId(val)}
          placeholder="-- Sin Asignar --"
          options={[...users]
            .sort((a, b) => a.fullName.localeCompare(b.fullName))
            .map(u => ({
              value: u.id,
              label: u.fullName,
              subLabel: u.department
            }))
          }
        />
      </div>

      <div className="form-group">
        <label className="form-label">Requerimientos</label>
        <input 
          className="form-input"
          placeholder="Ej: Requiere UPS, Conexión a red dedicada..." 
          value={requirement} 
          onChange={e => setRequirement(e.target.value)} 
        />
      </div>

      <div className="form-group">
        <label className="form-label">Notas / Especificaciones</label>
        <textarea 
          rows={3}
          className="form-input"
          placeholder="Detalles adicionales..." 
          value={notes} 
          onChange={e => setNotes(e.target.value)} 
          style={{ resize: 'vertical' }} 
        />
      </div>

      <div className="form-actions">
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
          {loading ? 'Guardando...' : 'Guardar Equipo'}
        </button>
      </div>
    </form>
  );
};

export default AddEquipmentModal;

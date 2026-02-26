import React, { useState, useEffect } from 'react';
import { UserRole, Department } from '@/types';
import { Eye, EyeOff } from 'lucide-react';

export interface AddUserModalProps {
  onSubmit: (data: any) => void;
  loading?: boolean;
  initialData?: any;
  departments?: Department[];
  onCancel?: () => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ onSubmit, loading = false, initialData = {}, departments = [], onCancel }) => {
  const [fullName, setFullName] = useState(initialData.name || '');
  const [username, setUsername] = useState(initialData.username || '');
  const [email, setEmail] = useState(initialData.email || '');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState(initialData.departmentId || '');
  const [employeeNumber, setEmployeeNumber] = useState(initialData.employeeNumber || '');
  const [role, setRole] = useState<UserRole>(initialData.role || 'usuario');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFullName(initialData.name || '');
      setUsername(initialData.username || '');
      setEmail(initialData.email || '');
      setDepartment(initialData.departmentId || '');
      setEmployeeNumber(initialData.employeeNumber || '');
      setRole(initialData.role || 'usuario');
    }
  }, [initialData]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ 
      name: fullName, 
      username, 
      email, 
      password, 
      department, 
      employeeNumber,
      role
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label form-label-required">Nombre Completo</label>
          <input 
            required
            className="form-input"
            placeholder="Ej. Juan Pérez" 
            value={fullName} 
            onChange={e => setFullName(e.target.value)} 
          />
        </div>
        <div className="form-group">
          <label className="form-label form-label-required">Usuario</label>
          <input 
            required
            className="form-input"
            placeholder="Ej. jperez" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
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
            placeholder="juan@empresa.com" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
          />
        </div>
        <div className="form-group">
          <label className="form-label">Contraseña {initialData.id && '(Opcional)'}</label>
          <div style={{ position: 'relative' }}>
            <input 
              type={showPassword ? "text" : "password"}
              className="form-input"
              placeholder={initialData.id ? "Dejar en blanco para mantener" : "Contraseña"} 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              style={{ paddingRight: '40px' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#6b7280',
                display: 'flex',
                alignItems: 'center'
              }}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">No. Empleado</label>
          <input 
            className="form-input"
            placeholder="Ej. EMP-001" 
            value={employeeNumber} 
            onChange={e => setEmployeeNumber(e.target.value)} 
          />
        </div>
        <div className="form-group">
          <label className="form-label">Departamento</label>
          <select 
            className="form-input"
            value={department} 
            onChange={e => setDepartment(e.target.value)}
          >
            <option value="">-- Seleccionar Departamento --</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.display_name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label form-label-required">Rol del Usuario</label>
          <select 
            className="form-input"
            value={role} 
            onChange={e => setRole(e.target.value as UserRole)}
            required
          >
            <option value="usuario">Usuario (Básico)</option>
            <option value="tecnico">Técnico (Soporte)</option>
            <option value="inventario">Inventario (Equipos)</option>
            <option value="admin">Administrador (Total)</option>
          </select>
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
            Regresar
          </button>
        )}
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading}
        >
          {loading ? 'Guardando...' : 'Guardar Usuario'}
        </button>
      </div>
    </form>
  );
};

export default AddUserModal;

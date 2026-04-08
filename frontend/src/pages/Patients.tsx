import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';

import { patientService } from '../services/patientService';
import { Patient } from '@/types';

import styles from './Patients.module.css';

import Table from '../components/Table';
import AddPatientModal from '../components/AddPatientModal';
import Pagination from '../components/Pagination';
import { Pencil, Trash2, Plus, Columns, ArrowLeft, Search, FileSpreadsheet, Home } from 'lucide-react';
import { exportToExcel } from '../utils/exportUtils';
import { showSuccess, showError, showConfirm } from '../utils/swal';
import { useAuth } from '../hooks/useAuth';

const Patients: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ search: '', isActive: 'true' });
  const [visibleColumns, setVisibleColumns] = useState<string[]>(['fullName', 'email', 'phone', 'address', 'gender', 'medicalHistory', 'isActive', 'createdAt', 'actions']);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPatientIds, setSelectedPatientIds] = useState<(string | number)[]>([]);

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      const response = await patientService.getPatients({
        page,
        limit,
        search: filters.search,
        isActive: filters.isActive
      });

      setPatients(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setError(null);
    } catch (err) {
      setError('No se pudo cargar la lista de pacientes. Por favor, intente de nuevo más tarde.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleOpenModal = (patient: Patient | null = null) => {
    setCurrentPatient(patient);
    setIsEditing(!!patient);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentPatient(null);
    setIsEditing(false);
    setError(null);
  };

  const handleSubmit = async (formData: any) => {
    if (!formData.nombre_completo) {
      setError('Por favor, complete el nombre completo del paciente.');
      return;
    }

    try {
      if (isEditing && currentPatient) {
        await patientService.updatePatient(currentPatient.id, formData);
        await showSuccess('Éxito', 'Paciente actualizado exitosamente.');
      } else {
        await patientService.createPatient(formData);
        await showSuccess('Éxito', 'Paciente creado exitosamente.');
      }
      fetchPatients();
      handleCloseModal();
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.response?.data?.message || 'Ocurrió un error al guardar el paciente.';
      await showError('Error', errorMessage);
    }
  };

  const handleDelete = async (id: string) => {
    if (await showConfirm('¿Eliminar paciente?', '¿Está seguro de que desea eliminar este paciente?')) {
      try {
        await patientService.deletePatient(id);
        fetchPatients();
        await showSuccess('Eliminado', 'Paciente eliminado correctamente.');
      } catch (err) {
        setError('Error al eliminar el paciente.');
        console.error(err);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (await showConfirm('¿Eliminar pacientes?', `¿Estás seguro de eliminar ${selectedPatientIds.length} pacientes?`)) {
      try {
        setLoading(true);
        await Promise.all(selectedPatientIds.map(id => patientService.deletePatient(id.toString())));
        await fetchPatients();
        setSelectedPatientIds([]);
        await showSuccess('Eliminados', 'Pacientes eliminados correctamente.');
      } catch (err) {
        console.error('Error deleting patients:', err);
        setError('Error al eliminar algunos pacientes. Por favor intente de nuevo.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const response = await patientService.getPatients({
        page: 1,
        limit: 10000,
        search: filters.search,
        isActive: filters.isActive
      });

      const allPatients = response.data || [];
      const dataToExport = allPatients.map(patient => {
        const row: Record<string, any> = {};

        if (visibleColumns.includes('fullName')) row['Nombre Completo'] = patient.fullName;
        if (visibleColumns.includes('email')) row['Correo'] = patient.email || '-';
        if (visibleColumns.includes('phone')) row['Teléfono'] = patient.phone || '-';
        if (visibleColumns.includes('address')) row['Dirección'] = patient.address || '-';
        if (visibleColumns.includes('birthDate')) row['Fecha Nacimiento'] = patient.birthDate ? new Date(patient.birthDate).toLocaleDateString() : '-';
        if (visibleColumns.includes('gender')) row['Género'] = patient.gender || '-';
        if (visibleColumns.includes('medicalHistory')) row['Antecedentes'] = patient.medicalHistory || '-';
        if (visibleColumns.includes('isActive')) row['Estado'] = patient.isActive ? 'ACTIVO' : 'INACTIVO';
        if (visibleColumns.includes('createdAt')) row['Fecha Registro'] = patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : '-';

        return row;
      });

      exportToExcel(dataToExport, 'Pacientes');
    } catch (err) {
      console.error('Error exporting patients:', err);
      await showError('Error', 'No se pudo exportar los datos.');
    } finally {
      setLoading(false);
    }
  };

  const allColumns = [
    {
      key: 'fullName',
      label: 'Nombre Completo',
      render: (patient: Patient) => <div style={{ fontWeight: 500 }}>{patient.fullName}</div>
    },
    {
      key: 'email',
      label: 'Correo',
      render: (patient: Patient) => patient.email || '-'
    },
    {
      key: 'phone',
      label: 'Teléfono',
      render: (patient: Patient) => patient.phone || '-'
    },
    {
      key: 'address',
      label: 'Dirección',
      render: (patient: Patient) => patient.address || '-'
    },
    {
      key: 'birthDate',
      label: 'Fecha Nac.',
      render: (patient: Patient) => patient.birthDate ? new Date(patient.birthDate).toLocaleDateString() : '-'
    },
    {
      key: 'gender',
      label: 'Género',
      render: (patient: Patient) => patient.gender || '-'
    },
    {
      key: 'medicalHistory',
      label: 'Antecedentes',
      render: (patient: Patient) => (
        <div style={{ maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {patient.medicalHistory || '-'}
        </div>
      )
    },
    {
      key: 'isActive',
      label: 'Estado',
      render: (patient: Patient) => (patient.isActive ? 'ACTIVO' : 'INACTIVO')
    },
    {
      key: 'createdAt',
      label: 'Fecha Registro',
      render: (patient: Patient) => patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : '-'
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (patient: Patient) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={(e) => { e.stopPropagation(); handleOpenModal(patient); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb' }}
            title="Editar"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(patient.id.toString()); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
            title="Eliminar"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  const filteredColumns = allColumns.filter(col => visibleColumns.includes(col.key));

  const toggleColumn = (key: string) => {
    if (visibleColumns.includes(key)) {
      setVisibleColumns(visibleColumns.filter(columnKey => columnKey !== key));
    } else {
      setVisibleColumns([...visibleColumns, key]);
    }
  };

  return (
    <Layout>
      <div className={styles.container}>
        {!isModalOpen && (
          <>
            <div className={styles.header} style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'flex-start' }}>
              <button
                onClick={() => navigate('/dashboard')}
                style={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#374151',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.2s'
                }}
                title="Volver al Panel Principal"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1>Gestión de Pacientes</h1>
                <p>Crea, edita y gestiona los pacientes del sistema.</p>
              </div>
            </div>

            <div className={styles.tableCard}>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, alignItems: 'end' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Estado</label>
                      <select
                        className="form-select"
                        value={filters.isActive}
                        onChange={e => setFilters({ ...filters, isActive: e.target.value })}
                      >
                        <option value="">TODOS</option>
                        <option value="true">ACTIVOS</option>
                        <option value="false">INACTIVOS</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      {(user?.role === 'admin' || user?.role === 'tecnico' || user?.role === 'technician') && (
                        <button
                          className="btn btn-outline"
                          onClick={handleExport}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#107c41', borderColor: '#107c41' }}
                          title="Exportar a Excel"
                        >
                          <FileSpreadsheet size={20} />
                          Excel
                        </button>
                      )}
                      <div style={{ position: 'relative' }}>
                        <button
                          className="btn btn-outline"
                          onClick={() => setShowColumnSelector(!showColumnSelector)}
                          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                          title="Columnas"
                        >
                          <Columns size={20} />
                          Columnas
                        </button>
                        {showColumnSelector && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            background: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: 8,
                            padding: 12,
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            zIndex: 10,
                            minWidth: 220
                          }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: 14 }}>Columnas Visibles</h4>
                            {allColumns.map(col => (
                              <label key={col.key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontSize: 13, cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={visibleColumns.includes(col.key)}
                                  onChange={() => toggleColumn(col.key)}
                                  disabled={col.key === 'actions'}
                                />
                                {col.label}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ position: 'relative', width: '100%' }}>
                    <Search size={20} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input
                      className="form-input"
                      type="text"
                      placeholder="Buscar pacientes..."
                      value={filters.search}
                      onChange={e => setFilters({ ...filters, search: e.target.value })}
                      style={{ width: '100%', paddingLeft: 40, height: '48px', fontSize: '1rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  {selectedPatientIds.length > 0 && (
                    <button
                      className="btn btn-danger"
                      onClick={handleBulkDelete}
                      style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                      <Trash2 size={16} />
                      Eliminar ({selectedPatientIds.length})
                    </button>
                  )}
                  <button className={styles.btnAgregar} onClick={() => handleOpenModal()}>
                    <Plus size={16} />
                    Agregar
                  </button>
                </div>
              </div>

              <Table
                columns={filteredColumns}
                data={patients}
                loading={loading}
                error={error && !loading ? error : null}
                selectable={true}
                selectedIds={selectedPatientIds}
                onSelectionChange={setSelectedPatientIds}
              />

              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </>
        )}

        {isModalOpen && (
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
            <div style={{ marginBottom: '24px', borderBottom: '1px solid #e5e7eb', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#6b7280', marginBottom: '8px', fontFamily: 'system-ui' }}>
                <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => navigate('/dashboard')}>
                  <Home size={14} style={{ marginRight: 4 }} /> Inicio
                </span>
                <span style={{ margin: '0 8px' }}>/</span>
                <span style={{ cursor: 'pointer' }} onClick={handleCloseModal}>Pacientes</span>
                <span style={{ margin: '0 8px' }}>/</span>
                <span style={{ color: '#111827', fontWeight: 600 }}>{isEditing ? 'Editar' : 'Crear'} Paciente</span>
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#111827', margin: 0 }}>
                {isEditing ? 'Editar Paciente' : 'Crear Paciente'}
              </h2>
            </div>
            <AddPatientModal
              onSubmit={handleSubmit}
              loading={loading}
              onCancel={handleCloseModal}
              initialData={currentPatient || {}}
            />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Patients;

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import Table from '../components/Table';
import Pagination from '../components/Pagination';
import { clinicalModuleMap, type ClinicalModuleField } from '../config/clinicalModules';
import { clinicalModuleService, type ClinicalModuleRecord } from '../services/clinicalModuleService';
import { exportToExcel } from '../utils/exportUtils';
import { showConfirm, showError, showSuccess } from '../utils/swal';
import { ArrowLeft, Columns, FileSpreadsheet, Home, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import styles from './Users.module.css';
import type { Patient } from '@/types';

type DraftRecord = {
  id?: string;
  data: Record<string, any>;
  is_active: boolean;
};

const buildEmptyDraft = (fields: ClinicalModuleField[]): DraftRecord => ({
  data: Object.fromEntries(fields.map(field => [field.key, ''])),
  is_active: true
});

const formatFieldValue = (value: any, type?: string) => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  if (type === 'date') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
  }

  if (type === 'number') {
    return value;
  }

  return value;
};

type DoctorOption = {
  id: string;
  name: string;
  specialty?: string;
};

const ClinicalModulePage: React.FC = () => {
  const navigate = useNavigate();
  const { moduleKey = '' } = useParams();
  const definition = clinicalModuleMap[moduleKey];

  const [records, setRecords] = useState<ClinicalModuleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<DraftRecord | null>(null);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [patientOptions, setPatientOptions] = useState<Patient[]>([]);
  const [doctorOptions, setDoctorOptions] = useState<DoctorOption[]>([]);

  useEffect(() => {
    if (definition) {
      setVisibleColumns([...definition.fields.map(field => field.key), 'is_active', 'id']);
    }
  }, [definition]);

  const fetchRecords = useCallback(async () => {
    if (!definition) {
      setError('Módulo no encontrado.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await clinicalModuleService.getAll(definition.key, searchTerm);
      if (response.success) {
        setRecords(response.data || []);
        setError(null);
      } else {
        setError(response.message || 'No se pudo cargar la información del módulo.');
      }
    } catch (fetchError) {
      console.error(fetchError);
      setError('No se pudo cargar la información del módulo.');
    } finally {
      setLoading(false);
    }
  }, [definition, searchTerm]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    const loadReferenceData = async () => {
      if (!definition) {
        return;
      }

      try {
        const referencesResponse = await clinicalModuleService.getReferences(definition.key);
        setPatientOptions(referencesResponse.data?.patients || []);
        setDoctorOptions((referencesResponse.data?.doctors || []) as DoctorOption[]);
      } catch (referenceError) {
        console.error('Error loading reference data:', referenceError);
      }
    };

    loadReferenceData();
  }, [definition]);

  const filteredRecords = useMemo(() => {
    if (!searchTerm) {
      return records;
    }

    const normalizedSearch = searchTerm.toLowerCase();
    return records.filter(record =>
      JSON.stringify(record.data || {}).toLowerCase().includes(normalizedSearch)
    );
  }, [records, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / limit));
  const paginatedRecords = filteredRecords.slice((page - 1) * limit, page * limit);

  const handleOpenModal = (record?: ClinicalModuleRecord) => {
    if (!definition) {
      return;
    }

    if (record) {
      setCurrentRecord({
        id: record.id,
        data: { ...buildEmptyDraft(definition.fields).data, ...(record.data || {}) },
        is_active: record.is_active
      });
      setIsEditing(true);
    } else {
      setCurrentRecord(buildEmptyDraft(definition.fields));
      setIsEditing(false);
    }

    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setCurrentRecord(null);
    setIsEditing(false);
    setIsModalOpen(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!definition || !currentRecord) {
      return;
    }

    try {
      if (isEditing && currentRecord.id) {
        await clinicalModuleService.update(definition.key, currentRecord.id, currentRecord);
        showSuccess(`${definition.label} actualizado correctamente`);
      } else {
        await clinicalModuleService.create(definition.key, currentRecord);
        showSuccess(`${definition.label} creado correctamente`);
      }

      handleCloseModal();
      fetchRecords();
    } catch (submitError) {
      console.error(submitError);
      showError(`Error al guardar ${definition.label.toLowerCase()}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!definition) {
      return;
    }

    const confirmed = await showConfirm('¿Estás seguro?', 'Esta acción no se puede deshacer.');
    if (!confirmed) {
      return;
    }

    try {
      await clinicalModuleService.delete(definition.key, id);
      showSuccess(`${definition.label} eliminado correctamente`);
      fetchRecords();
    } catch (deleteError) {
      console.error(deleteError);
      showError(`Error al eliminar ${definition.label.toLowerCase()}`);
    }
  };

  const handleExport = async () => {
    if (!definition) {
      return;
    }

    try {
      const dataToExport = filteredRecords.map(record => {
        const row: Record<string, any> = {};
        definition.fields.forEach(field => {
          if (visibleColumns.includes(field.key)) {
            row[field.label] = formatFieldValue(record.data?.[field.key], field.type);
          }
        });
        if (visibleColumns.includes('is_active')) {
          row['Activo'] = record.is_active ? 'Sí' : 'No';
        }
        return row;
      });

      exportToExcel(dataToExport, definition.label.replace(/\s+/g, ''));
    } catch (exportError) {
      console.error(exportError);
      showError('No se pudo exportar la información.');
    }
  };

  const updateDraftField = (fieldKey: string, value: string) => {
    setCurrentRecord(previous => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        data: {
          ...previous.data,
          [fieldKey]: value
        }
      };
    });
  };

  const toggleColumn = (key: string) => {
    setVisibleColumns(previous => (
      previous.includes(key)
        ? previous.filter(column => column !== key)
        : [...previous, key]
    ));
  };

  const getFieldSuggestions = (field: ClinicalModuleField) => {
    if (field.reference === 'patients') {
      return patientOptions.map(patient => ({
        value: patient.fullName,
        detail: [patient.phone, patient.email].filter(Boolean).join(' | ')
      }));
    }

    if (field.reference === 'doctors') {
      return doctorOptions.map(doctor => ({
        value: doctor.name,
        detail: doctor.specialty || ''
      }));
    }

    return [];
  };

  const allColumns = definition ? [
    ...definition.fields.map(field => ({
      key: field.key,
      label: field.label,
      render: (record: ClinicalModuleRecord) => formatFieldValue(record.data?.[field.key], field.type)
    })),
    {
      key: 'is_active',
      label: 'Activo',
      render: (record: ClinicalModuleRecord) => (
        <span className={`badge ${record.is_active ? 'bg-success' : 'bg-danger'}`} style={{
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '0.75rem',
          fontWeight: 600,
          backgroundColor: record.is_active ? '#dcfce7' : '#fee2e2',
          color: record.is_active ? '#166534' : '#991b1b'
        }}>
          {record.is_active ? 'Sí' : 'No'}
        </span>
      )
    },
    {
      key: 'id',
      label: 'Acciones',
      render: (record: ClinicalModuleRecord) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => handleOpenModal(record)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb' }}
            title="Editar"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => handleDelete(record.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
            title="Eliminar"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ] : [];

  const filteredColumns = allColumns.filter(column => visibleColumns.includes(column.key) || column.key === 'id');

  if (!definition) {
    return (
      <Layout>
        <div className={styles.container}>
          <div className="alert alert-danger">Módulo no encontrado.</div>
        </div>
      </Layout>
    );
  }

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
                <h1>{definition.label}</h1>
                <p>{definition.description}</p>
              </div>
            </div>

            <div className={styles.tableCard}>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button
                      className="btn btn-outline"
                      onClick={handleExport}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#107c41', borderColor: '#107c41' }}
                      title="Exportar a Excel"
                    >
                      <FileSpreadsheet size={20} />
                      Excel
                    </button>

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
                          minWidth: 200
                        }}>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: 14 }}>Columnas Visibles</h4>
                          {allColumns.filter(column => column.key !== 'id').map(column => (
                            <label key={column.key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontSize: 13, cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={visibleColumns.includes(column.key)}
                                onChange={() => toggleColumn(column.key)}
                              />
                              {column.label}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ position: 'relative', width: '100%' }}>
                    <Search size={20} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input
                      className="form-input"
                      type="text"
                      placeholder={`Buscar en ${definition.label.toLowerCase()}...`}
                      value={searchTerm}
                      onChange={(event) => {
                        setSearchTerm(event.target.value);
                        setPage(1);
                      }}
                      style={{ width: '100%', paddingLeft: 40, height: '48px', fontSize: '1rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button className={styles.btnAgregar} onClick={() => handleOpenModal()}>
                    <Plus size={16} />
                    Agregar
                  </button>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                <Table columns={filteredColumns} data={paginatedRecords} loading={loading} />

                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            </div>
          </>
        )}

        {isModalOpen && currentRecord && (
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
            <div style={{ marginBottom: '24px', borderBottom: '1px solid #e5e7eb', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#6b7280', marginBottom: '8px', fontFamily: 'system-ui' }}>
                <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => navigate('/dashboard')}>
                  <Home size={14} style={{ marginRight: 4 }} /> Inicio
                </span>
                <span style={{ margin: '0 8px' }}>/</span>
                <span style={{ cursor: 'pointer' }} onClick={handleCloseModal}>{definition.label}</span>
                <span style={{ margin: '0 8px' }}>/</span>
                <span style={{ color: '#111827', fontWeight: 600 }}>{isEditing ? 'Editar' : 'Nuevo'} Registro</span>
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#111827', margin: 0 }}>
                {isEditing ? `Editar ${definition.label}` : `Nuevo ${definition.label}`}
              </h2>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '720px' }}>
              {definition.fields.map(field => (
                <div className="form-group" key={field.key}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>{field.label}</label>
                  {field.type === 'textarea' ? (
                    <textarea
                      className="form-input"
                      value={currentRecord.data?.[field.key] || ''}
                      onChange={(event) => updateDraftField(field.key, event.target.value)}
                      rows={4}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', resize: 'vertical' }}
                    />
                  ) : (
                    <>
                      <input
                        type={field.type || 'text'}
                        list={field.reference ? `${definition.key}-${field.key}-options` : undefined}
                        className="form-input"
                        value={currentRecord.data?.[field.key] || ''}
                        onChange={(event) => updateDraftField(field.key, event.target.value)}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                      />
                      {field.reference && (
                        <datalist id={`${definition.key}-${field.key}-options`}>
                          {getFieldSuggestions(field).map(option => (
                            <option key={`${field.key}-${option.value}-${option.detail}`} value={option.value} label={option.detail} />
                          ))}
                        </datalist>
                      )}
                    </>
                  )}
                </div>
              ))}

              <div className="form-group" style={{ marginTop: 8 }}>
                <label className="flex items-center gap-2 cursor-pointer" style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={currentRecord.is_active}
                    onChange={(event) => setCurrentRecord(previous => previous ? { ...previous, is_active: event.target.checked } : previous)}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span style={{ marginLeft: 8 }}>Registro Activo</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 12, marginTop: 24 }}>
                <button type="submit" className="btn btn-primary">
                  {isEditing ? 'Actualizar' : 'Crear'}
                </button>
                <button type="button" className="btn btn-outline" onClick={handleCloseModal}>
                  Regresar
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ClinicalModulePage;
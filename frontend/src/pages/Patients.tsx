import React, { useEffect, useState, useCallback } from 'react';
import { patientService } from '../services/patientService';
import { Patient } from '@/types';
import styles from './Patients.module.css';

import Table from '../components/Table';
import Modal from '../components/Modal';
import AddPatientModal from '../components/AddPatientModal';
import Pagination from '../components/Pagination';
import { Pencil, Trash2, Plus, Search, FileSpreadsheet } from 'lucide-react';
import { exportToExcel } from '../utils/exportUtils';
import { showSuccess, showError, showConfirm } from '../utils/swal';

const Patients: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filters State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPatients, setTotalPatients] = useState(0);
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      const response = await patientService.getPatients({
        page,
        limit,
        search
      });
      
      setPatients(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalPatients(response.pagination?.total || 0);
      setError(null);
    } catch (err) {
      setError('No se pudo cargar la lista de pacientes.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

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
  };

  const handleSubmit = async (formData: any) => {
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

  const handleExport = async () => {
    try {
      setLoading(true);
      const response = await patientService.getPatients({
        page: 1,
        limit: 10000,
        search
      });
      
      const allPatients = response.data || [];

      const dataToExport = allPatients.map(p => ({
        'Nombre Completo': p.nombre_completo,
        'Correo': p.correo,
        'Teléfono': p.telefono,
        'Antecedentes': p.antecedentes || '-',
        'Fecha Registro': new Date(p.createdAt).toLocaleDateString()
      }));

      exportToExcel(dataToExport, 'Pacientes');
    } catch (err) {
      console.error('Error exporting patients:', err);
      await showError('Error', 'No se pudo exportar los datos.');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'nombre_completo',
      label: 'Nombre Completo',
      render: (p: Patient) => <div style={{ fontWeight: 500 }}>{p.nombre_completo}</div>
    },
    {
      key: 'correo',
      label: 'Correo',
      render: (p: Patient) => p.correo
    },
    {
      key: 'telefono',
      label: 'Teléfono',
      render: (p: Patient) => p.telefono
    },
    {
      key: 'antecedentes',
      label: 'Antecedentes',
      render: (p: Patient) => <div style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.antecedentes || '-'}</div>
    },
    {
      key: 'createdAt',
      label: 'Fecha Registro',
      render: (p: Patient) => new Date(p.createdAt).toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (p: Patient) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn-icon btn-icon-primary" 
            onClick={() => handleOpenModal(p)}
            title="Editar"
          >
            <Pencil size={18} />
          </button>
          <button 
            className="btn-icon btn-icon-danger" 
            onClick={() => handleDelete(p.id)}
            title="Eliminar"
          >
            <Trash2 size={18} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Gestión de Pacientes</h1>
          <p className={styles.subtitle}>Administra los pacientes del sistema</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} style={{ marginRight: '8px' }} />
          Nuevo Paciente
        </button>
      </div>

      <div className={styles.filtersRow}>
        <div className={styles.searchInputGroup}>
          <Search className={styles.searchIcon} size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, correo..." 
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <button className={styles.exportButton} onClick={handleExport}>
          <FileSpreadsheet size={18} />
          Exportar Excel
        </button>
      </div>

      <Table 
        columns={columns} 
        data={patients} 
        loading={loading} 
        emptyMessage="No se encontraron pacientes."
      />

      <Pagination 
        currentPage={page} 
        totalPages={totalPages} 
        onPageChange={setPage}
        totalItems={totalPatients}
        limit={limit}
        onLimitChange={setLimit}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={isEditing ? 'Editar Paciente' : 'Nuevo Paciente'}
      >
        <AddPatientModal
          onSubmit={handleSubmit}
          initialData={currentPatient}
          loading={loading}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
};

export default Patients;

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Ticket, Equipment, User, Patient } from '@/types';
import { ticketService } from '../services/ticketService';
import { equipmentService } from '../services/equipmentService';
import { userService } from '../services/userService';
import { patientService } from '../services/patientService';
import { departmentService, Department } from '../services/departmentService';
import styles from './Tickets.module.css';
import Table from '../components/Table';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { Plus, Eye, Pencil, Play, CheckCircle, FileText, Filter, Columns, ChevronLeft, ChevronRight, Search, Trash2, FileSpreadsheet, ArrowLeft, Home } from 'lucide-react';
import TicketForm from '../components/TicketForm';
import { exportToExcel } from '../utils/exportUtils';
import { useAuth } from '../hooks/useAuth';
import { showSuccess, showError, showConfirm } from '../utils/swal';
import Swal from 'sweetalert2';

const TicketStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    'nuevo': 'new',
    'en_proceso': 'inProgress',
    'cerrado': 'closed',
    'pendiente': 'pending'
  };
  const statusKey = map[status] || status;
  return <span className={`${styles.statusBadge} ${styles[statusKey]}`}>{status.replace('_', ' ')}</span>;
};

const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => (
  <span className={`${styles.priorityBadge} ${styles[priority]}`}>{priority}</span>
);

const TicketsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [services, setServices] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filters State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTickets, setTotalTickets] = useState(0);
  const [filters, setFilters] = useState({ status: '', priority: '', serviceType: '', search: '' });
  const [visibleColumns, setVisibleColumns] = useState<string[]>(['ticketNumber', 'title', 'patient', 'scheduledFor', 'status', 'serviceType', 'assignedTo', 'createdAt', 'actions']);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTicketIds, setSelectedTicketIds] = useState<(string | number)[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const promises: Promise<any>[] = [
        ticketService.getTickets({
          page,
          limit,
          search: filters.search,
          status: filters.status,
          priority: filters.priority,
          serviceType: filters.serviceType
        }),
        equipmentService.getEquipment({ limit: 1000 }),
        departmentService.getAll()
      ];

      // Only fetch users if technician or admin to avoid 403 errors
      const canViewUsers = user?.role === 'admin' || user?.role === 'tecnico';
      const canViewPatients = user?.role === 'admin' || user?.role === 'tecnico' || user?.role === 'technician';
      if (canViewUsers) {
        promises.push(userService.getUsers({ limit: 1000, isActive: 'true' }));
      }
      if (canViewPatients) {
        promises.push(patientService.getPatients({ limit: 1000, isActive: 'true' }));
      }

      const results = await Promise.all(promises);
      
      const ticketsResponse = results[0];
      const equipmentResponse = results[1];
      const servicesResponse = results[2];
      const usersResponse = canViewUsers ? results[3] : { data: [] };
      const patientsResponse = canViewPatients ? results[canViewUsers ? 4 : 3] : { data: [] };
      
      setTickets(ticketsResponse.data || []);
      setTotalPages(ticketsResponse.pagination?.totalPages || 1);
      setTotalTickets(ticketsResponse.pagination?.total || 0);

      setEquipment(equipmentResponse.data || []);
      setServices(servicesResponse.data || []);
      setUsers(usersResponse.data || []);
      setPatients(patientsResponse.data || []);
      setError(null);
    } catch (err) {
      setError('No se pudo cargar los datos. Por favor, intente de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenModal = (ticket: Ticket | null = null) => {
    setCurrentTicket(ticket);
    setIsEditing(!!ticket);
    setIsModalOpen(true);
  };

  const handleOpenDetailsModal = (ticket: Ticket) => {
    setCurrentTicket(ticket);
    setIsDetailsModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsModalOpen(false);
    setIsDetailsModalOpen(false);
    setCurrentTicket(null);
    setIsEditing(false);
    setError(null);
  };

  const handleSubmit = async (data: any) => {
    const backendPayload = {
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: data.status,
      serviceType: data.serviceType,
      patientId: data.patientId || null,
      scheduledFor: data.scheduledFor || null,
      equipmentId: data.equipmentId || null,
      assignedToId: (data.assignedToId && data.assignedToId !== '') ? data.assignedToId : null,
      reportedById: data.reportedById, // Include reportedById
      diagnosis: data.diagnosis,
      solution: data.solution,
      notes: data.notes, // Include notes
      partsUsed: data.partsUsed,
      timeSpent: data.timeSpent ? Number(data.timeSpent) : undefined
    };

    try {
      if (isEditing && currentTicket) {
        await ticketService.updateTicket(currentTicket.id, backendPayload);
        await showSuccess('Éxito', 'Consulta actualizada exitosamente.');
      } else {
        await ticketService.createTicket(backendPayload as any);
        await showSuccess('Éxito', 'Consulta creada exitosamente.');
      }
      fetchData();
      handleCloseModals();
    } catch (err: any) {
      const errorMessage = err.message || 'Ocurrió un error al guardar la consulta.';
      await showError('Error', errorMessage);
      console.error(err);
    }
  };
  
  const handleStatusChange = async (id: string, status: 'nuevo' | 'pendiente' | 'en_proceso' | 'cerrado') => {
    try {
      await ticketService.updateTicket(id, { status } as any);
      fetchData();
      if (currentTicket && currentTicket.id === id) {
        setCurrentTicket({ ...currentTicket, status });
      }
    } catch (err) {
      setError('Error al actualizar el estado.');
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: '¿Eliminar consulta?',
      text: 'Por favor, ingrese una justificación para eliminar esta consulta.',
      input: 'textarea',
      inputPlaceholder: 'Escriba la justificación aquí...',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      inputValidator: (value) => {
        if (!value) {
          return '¡Necesita escribir una justificación!';
        }
      }
    });

    if (result.isConfirmed && result.value) {
      try {
        await ticketService.deleteTicket(id, result.value);
        fetchData();
        await showSuccess('Eliminado', 'Consulta eliminada correctamente.');
      } catch (err) {
        setError('Error al eliminar la consulta.');
        console.error(err);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (await showConfirm('¿Eliminar consultas?', `¿Estás seguro de eliminar ${selectedTicketIds.length} consultas?`)) {
      try {
        setLoading(true);
        await Promise.all(selectedTicketIds.map(id => ticketService.deleteTicket(id.toString())));
        await fetchData();
        setSelectedTicketIds([]);
        await showSuccess('Eliminados', 'Consultas eliminadas correctamente.');
      } catch (err) {
        console.error('Error deleting appointments:', err);
        setError('Error al eliminar algunas consultas. Por favor intente de nuevo.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      // Fetch all tickets matching current filters
      const response = await ticketService.getTickets({
        page: 1,
        limit: 10000,
        search: filters.search,
        status: filters.status,
        priority: filters.priority,
        serviceType: filters.serviceType
      });
      
      const allTickets = response.data || [];

      const dataToExport = allTickets.map(ticket => {
        const row: Record<string, any> = {};
        
        if (visibleColumns.includes('ticketNumber')) row['Consulta'] = ticket.ticketNumber;
        if (visibleColumns.includes('title')) row['Motivo'] = ticket.title;
        if (visibleColumns.includes('patient')) row['Paciente'] = ticket.patient?.fullName || 'N/A';
        if (visibleColumns.includes('scheduledFor')) row['Fecha Programada'] = ticket.scheduledFor ? new Date(ticket.scheduledFor).toLocaleString() : 'No programada';
        if (visibleColumns.includes('equipment')) row['Equipo'] = ticket.equipment ? ticket.equipment.name : 'N/A';
        if (visibleColumns.includes('status')) row['Estado'] = ticket.status;
        if (visibleColumns.includes('priority')) row['Prioridad'] = ticket.priority;
        if (visibleColumns.includes('serviceType')) row['Tipo Consulta'] = ticket.serviceType;
        if (visibleColumns.includes('reportedBy')) row['Registró'] = ticket.reportedBy?.fullName || 'N/A';
        if (visibleColumns.includes('assignedTo')) row['Asignado a'] = ticket.assignedTo?.fullName || 'No asignado';
        if (visibleColumns.includes('createdAt')) row['Creado'] = new Date(ticket.createdAt).toLocaleDateString();
        
        return row;
      });

      exportToExcel(dataToExport, 'Consultas');
    } catch (err) {
      console.error('Error exporting tickets:', err);
      await showError('Error', 'No se pudo exportar los datos.');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePdf = async (ticketId: string) => {
    try {
      const blob = await ticketService.generatePdf(ticketId);
      // Crear un nuevo Blob asegurando el tipo MIME correcto
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ticket-${ticketId}.pdf`);
      // Añadir target="_blank" puede ayudar a evitar bloqueos de descargas en algunos navegadores
      link.setAttribute('target', '_blank'); 
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Liberar el objeto URL después de un breve retraso
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Error generating PDF:', error);
      await showError('Error', 'Error al generar el PDF. Verifique que tenga permisos.');
    }
  };

  const allColumns = [
    {
      key: 'ticketNumber',
      label: 'Consulta',
      render: (ticket: Ticket) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>{ticket.ticketNumber}</span>
          <strong>{ticket.title}</strong>
        </div>
      ),
    },
    {
      key: 'title',
      label: 'Motivo',
      render: (ticket: Ticket) => ticket.title
    },
    {
      key: 'patient',
      label: 'Paciente',
      render: (ticket: Ticket) => ticket.patient?.fullName || 'N/A'
    },
    {
      key: 'scheduledFor',
      label: 'Fecha Programada',
      render: (ticket: Ticket) => ticket.scheduledFor ? new Date(ticket.scheduledFor).toLocaleString() : 'No programada'
    },
    {
      key: 'equipment',
      label: 'Equipo',
      render: (ticket: Ticket) => ticket.equipment ? ticket.equipment.name : 'N/A'
    },
    {
      key: 'status',
      label: 'Estado',
      render: (ticket: Ticket) => ticket.status.replace('_', ' '),
    },
    {
      key: 'priority',
      label: 'Prioridad',
      render: (ticket: Ticket) => ticket.priority,
    },
    {
      key: 'serviceType',
      label: 'Tipo Consulta',
      render: (ticket: Ticket) => ticket.serviceType
    },
    {
      key: 'reportedBy',
      label: 'Registró',
      render: (ticket: Ticket) => <span>{ticket.reportedBy?.fullName || 'N/A'}</span>,
    },
    {
      key: 'assignedTo',
      label: 'Técnico Asignado',
      render: (ticket: Ticket) => {
        return ticket.assignedTo ? (
          <span>{ticket.assignedTo.fullName}</span>
        ) : (
          <span style={{ color: '#bdbdbd', fontStyle: 'italic' }}>No asignado</span>
        );
      },
    },
    {
      key: 'createdAt',
      label: 'Creado',
      render: (ticket: Ticket) => <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>,
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (ticket: Ticket) => {
        const isTechnician = user?.role === 'tecnico';
        const isAssignedToOther = isTechnician && ticket.assignedToId && ticket.assignedToId !== user?.id;
        const isViewOnly = ticket.status === 'cerrado' || isAssignedToOther;

        return (
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            onClick={(e) => { e.stopPropagation(); handleOpenModal(ticket); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: isViewOnly ? '#6b7280' : '#2563eb' }}
            title={isViewOnly ? "Ver Detalles" : "Editar"}
          >
            {isViewOnly ? <Eye size={16} /> : <Pencil size={16} />}
          </button>
          
          {/* Botón PDF solo para admin y técnico, y solo si el ticket está cerrado */}
          {(() => {
            const role = (user?.role || '').toLowerCase();
            const isAuthorized = role === 'admin' || role === 'tecnico' || role === 'technician';
            const isClosed = ticket.status === 'cerrado';
            
            return isAuthorized && isClosed && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleGeneratePdf(ticket.id.toString()); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ea580c' }}
                title="Generar PDF para Firma"
              >
                <FileText size={16} />
              </button>
            );
          })()}

          {/* Botón Eliminar solo para admin */}
          {user?.role === 'admin' && (
            <button 
              onClick={(e) => { e.stopPropagation(); handleDelete(ticket.id.toString()); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
              title="Eliminar"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )
    }
  },
  ];

  const columns = allColumns.filter(col => visibleColumns.includes(col.key));

  const toggleColumn = (key: string) => {
    if (visibleColumns.includes(key)) {
      setVisibleColumns(visibleColumns.filter(c => c !== key));
    } else {
      setVisibleColumns([...visibleColumns, key]);
    }
  };

  return (
    <Layout>
      <div className={styles.container}>
        {!isModalOpen && !isDetailsModalOpen && (
        <>
        <div className={styles.header} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
            <h1>Gestión de Consultas y Citas</h1>
            <p>Seguimiento a las consultas odontológicas y citas programadas.</p>
          </div>
        </div>

        <div style={{ background: 'white', padding: 16, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Filtros y Búsqueda */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, alignItems: 'end' }}>
               <div className="form-group" style={{ marginBottom: 0 }}>
                 <label className="form-label">Estado</label>
                 <select 
                    className="form-select"
                    value={filters.status} 
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  >
                    <option value="">TODOS</option>
                    <option value="nuevo">NUEVO</option>
                    <option value="pendiente">PENDIENTE</option>
                    <option value="en_proceso">EN PROCESO</option>
                    <option value="cerrado">CERRADO</option>
                  </select>
               </div>

               <div className="form-group" style={{ marginBottom: 0 }}>
                 <label className="form-label">Prioridad</label>
                 <select 
                    className="form-select"
                    value={filters.priority} 
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                  >
                    <option value="">TODAS</option>
                    <option value="baja">BAJA</option>
                    <option value="media">MEDIA</option>
                    <option value="alta">ALTA</option>
                    <option value="critica">CRÍTICA</option>
                  </select>
               </div>

               <div className="form-group" style={{ marginBottom: 0 }}>
                 <label className="form-label">Tipo de Consulta</label>
                 <select 
                    className="form-select"
                    value={filters.serviceType} 
                    onChange={(e) => setFilters({ ...filters, serviceType: e.target.value })}
                  >
                    <option value="">TODOS</option>
                    <option value="preventivo">VALORACIÓN</option>
                    <option value="correctivo">TRATAMIENTO</option>
                    <option value="instalacion">PROCEDIMIENTO</option>
                  </select>
               </div>

               <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div className={styles.columnSelectorWrapper} style={{ display: 'flex', gap: 8 }}>
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
                      <div className={styles.columnSelector}>
                        <h3>Columnas Visibles</h3>
                        {allColumns.map(col => (
                          <label key={col.key} className={styles.columnOption}>
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
                    placeholder="Buscar consultas o citas..." 
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    style={{ width: '100%', paddingLeft: 40, height: '48px', fontSize: '1rem' }}
                 />
             </div>
          </div>

          {/* Acciones */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button className={styles.btnAgregar} onClick={() => handleOpenModal()}>
              <Plus size={16} />
              Agendar
            </button>
          </div>

        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.tableWrapper}>
          <Table 
            columns={columns} 
            data={tickets} 
            loading={loading}
            selectable={false}
            selectedIds={selectedTicketIds}
            onSelectionChange={setSelectedTicketIds}
          />
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
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
              <span style={{ cursor: 'pointer' }} onClick={handleCloseModals}>Consultas</span>
              <span style={{ margin: '0 8px' }}>/</span>
              <span style={{ color: '#111827', fontWeight: 600 }}>{isEditing ? 'Editar' : 'Crear'} Consulta</span>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#111827', margin: 0 }}>
              {isEditing ? 'Editar Consulta' : 'Crear Consulta'}
            </h2>
          </div>
          <TicketForm
            onSubmit={handleSubmit}
            loading={loading}
            users={users}
            patients={patients}
            services={services}
            equipment={equipment}
            onCancel={handleCloseModals}
            isEditMode={isEditing}
            initialData={currentTicket ? {
              id: currentTicket.id,
              title: currentTicket.title,
              description: currentTicket.description,
              priority: currentTicket.priority,
              status: currentTicket.status,
              serviceType: currentTicket.serviceType,
              equipmentId: currentTicket.equipmentId,
              assignedToId: currentTicket.assignedToId,
              reportedById: currentTicket.reportedById,
              reportedBy: currentTicket.reportedBy,
              patientId: currentTicket.patientId,
              patient: currentTicket.patient,
              scheduledFor: currentTicket.scheduledFor,
              diagnosis: currentTicket.diagnosis,
              solution: currentTicket.solution,
              notes: currentTicket.notes,
              timeSpent: currentTicket.timeSpent,
              parts: typeof currentTicket.parts === 'string' ? JSON.parse(currentTicket.parts) : (currentTicket.parts || [])
            } : {}}
          />
        </div>
      )}

      {isDetailsModalOpen && currentTicket && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
         <div style={{ marginBottom: '24px', borderBottom: '1px solid #e5e7eb', paddingBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
              <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => navigate('/dashboard')}>
                 <Home size={14} style={{ marginRight: 4 }} /> Inicio
              </span>
              <span style={{ margin: '0 8px' }}>/</span>
              <span style={{ cursor: 'pointer' }} onClick={handleCloseModals}>Consultas</span>
              <span style={{ margin: '0 8px' }}>/</span>
              <span style={{ color: '#111827', fontWeight: 600 }}>{currentTicket.ticketNumber}</span>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#111827', margin: 0 }}>
              Detalles de la Consulta
            </h2>
          </div>
          <div className={styles.detailsContent}>
            <div className={styles.detailsHeader}>
              <div className={styles.ticketInfo}>
                <span className={styles.ticketNumber}>{currentTicket.ticketNumber}</span>
                <h3 className={styles.detailsTitle}>{currentTicket.title}</h3>
              </div>
              <div className={styles.badgeGroup}>
                <TicketStatusBadge status={currentTicket.status} />
                <PriorityBadge priority={currentTicket.priority} />
              </div>
            </div>
            
            <div className={styles.detailsGrid}>
              <div className={styles.detailSection}>
                <h4>Información General</h4>
                <div className={styles.detailItem}>
                  <label>Descripción</label>
                  <p>{currentTicket.description}</p>
                </div>
                <div className={styles.detailItem}>
                  <label>Tipo de Servicio</label>
                  <span>{currentTicket.serviceType}</span>
                </div>
              </div>

              <div className={styles.detailSection}>
                <h4>Personas Involucradas</h4>
                <div className={styles.detailItem}>
                  <label>Reportado por</label>
                  <span>{currentTicket.reportedBy?.fullName || 'N/A'}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>Técnico Asignado</label>
                  <span>{users.find(u => u.id === currentTicket.assignedToId)?.fullName || 'Sin asignar'}</span>
                </div>
              </div>

              <div className={styles.detailSection}>
                <h4>Diagnóstico y Solución</h4>
                <div className={styles.detailItem}>
                  <label>Diagnóstico</label>
                  <p>{currentTicket.diagnosis || 'Pendiente'}</p>
                </div>
                <div className={styles.detailItem}>
                  <label>Solución</label>
                  <p>{currentTicket.solution || 'Pendiente'}</p>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter} style={{ justifyContent: 'space-between', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="button" 
                  className="btn" 
                  style={{ background: '#3b82f6', color: 'white' }}
                  onClick={() => handleStatusChange(currentTicket.id, 'nuevo')}
                  disabled={currentTicket.status === 'nuevo'}
                >
                  Nuevo
                </button>
                <button 
                  type="button" 
                  className="btn" 
                  style={{ background: '#f59e0b', color: 'white' }}
                  onClick={() => handleStatusChange(currentTicket.id, 'pendiente')}
                  disabled={currentTicket.status === 'pendiente'}
                >
                  Pendiente
                </button>
                <button 
                  type="button" 
                  className="btn" 
                  style={{ background: '#3b82f6', color: 'white' }}
                  onClick={() => handleStatusChange(currentTicket.id, 'en_proceso')}
                  disabled={currentTicket.status === 'en_proceso'}
                >
                  Atendiendo
                </button>
                <button 
                  type="button" 
                  className="btn" 
                  style={{ background: '#10b981', color: 'white' }}
                  onClick={() => handleStatusChange(currentTicket.id, 'cerrado')}
                  disabled={currentTicket.status === 'cerrado'}
                >
                  Cerrado
                </button>
              </div>
              <button type="button" className="btn btn-secondary" onClick={handleCloseModals}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </Layout>
  );
};

export default TicketsPage;
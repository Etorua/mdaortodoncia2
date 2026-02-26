import React, { useState, useEffect } from 'react';
import { Download, Filter, FileText, BarChart3, PieChart, TrendingUp, Calendar, Search } from 'lucide-react';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import Table from '@/components/Table';
import { Ticket, User as UserType, Equipment } from '@/types';
import { ticketService } from '@/services/ticketService';
import { userService } from '@/services/userService';
import { equipmentService } from '@/services/equipmentService';
import { showError } from '@/utils/swal';

import styles from './Reports.module.css';

interface ReportFilters {
  dateFrom: string;
  dateTo: string;
  technicianId: string;
  status: string;
  priority: string;
  equipmentId: string;
}

interface ReportStats {
  totalTickets: number;
  closedTickets: number;
  avgResolutionTime: number;
  ticketsByStatus: Record<string, number>;
  ticketsByPriority: Record<string, number>;
  ticketsByTechnician: Record<string, number>;
  equipmentIssues: Array<{ equipment: string; count: number }>;
}

const ReportsPage: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [deletedTickets, setDeletedTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [reportStats, setReportStats] = useState<ReportStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  // const { user } = useAuth();

  const [filters, setFilters] = useState<ReportFilters>({
    dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    technicianId: '',
    status: '',
    priority: '',
    equipmentId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (tickets.length > 0) {
      calculateStats();
    }
  }, [tickets, filters, users, equipment]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ticketsData, usersData, equipmentData, deletedTicketsData] = await Promise.all([
        ticketService.getTickets({ limit: 1000 }),
        userService.getUsers({ limit: 1000, isActive: 'true' }),
        equipmentService.getEquipment({ limit: 1000 }),
        ticketService.getDeletedTickets()
      ]);
      
      setTickets(ticketsData.data);
      setUsers(usersData.data);
      setEquipment(equipmentData.data);
      setDeletedTickets(deletedTicketsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const filteredTickets = filterTickets(tickets);
    
    const stats: ReportStats = {
      totalTickets: filteredTickets.length,
      closedTickets: filteredTickets.filter(t => t.status === 'cerrado').length,
      avgResolutionTime: 0,
      ticketsByStatus: {},
      ticketsByPriority: {},
      ticketsByTechnician: {},
      equipmentIssues: []
    };

    // Calcular tiempo promedio de resolución
    const closedTickets = filteredTickets.filter(t => t.status === 'cerrado' && t.closedAt);
    if (closedTickets.length > 0) {
      const totalTime = closedTickets.reduce((acc, ticket) => {
        if (ticket.closedAt) {
          const resolutionTime = (new Date(ticket.closedAt).getTime() - new Date(ticket.createdAt).getTime()) / (1000 * 60 * 60);
          return acc + resolutionTime;
        }
        return acc;
      }, 0);
      stats.avgResolutionTime = Math.round(totalTime / closedTickets.length * 100) / 100;
    }

    // Agrupar por estado
    filteredTickets.forEach(ticket => {
      stats.ticketsByStatus[ticket.status] = (stats.ticketsByStatus[ticket.status] || 0) + 1;
    });

    // Agrupar por prioridad
    filteredTickets.forEach(ticket => {
      stats.ticketsByPriority[ticket.priority] = (stats.ticketsByPriority[ticket.priority] || 0) + 1;
    });

    // Agrupar por técnico
    filteredTickets.forEach(ticket => {
      if (ticket.assignedToId) {
        const tech = users.find(u => u.id === ticket.assignedToId);
        const techName = tech ? tech.fullName : 'Usuario no encontrado';
        stats.ticketsByTechnician[techName] = (stats.ticketsByTechnician[techName] || 0) + 1;
      }
    });

    // Equipos con más problemas
    const equipmentCount: Record<string, number> = {};
    filteredTickets.forEach(ticket => {
      if (ticket.equipmentId) {
        const eq = equipment.find(e => e.id === ticket.equipmentId);
        const equipmentName = eq ? eq.name : 'Equipo no encontrado';
        equipmentCount[equipmentName] = (equipmentCount[equipmentName] || 0) + 1;
      }
    });

    stats.equipmentIssues = Object.entries(equipmentCount)
      .map(([equipment, count]) => ({ equipment, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setReportStats(stats);
  };

  const filterTickets = (ticketList: Ticket[]): Ticket[] => {
    return ticketList.filter(ticket => {
      const ticketDate = new Date(ticket.createdAt);
      const fromDate = new Date(filters.dateFrom);
      const toDate = new Date(filters.dateTo);
      
      if (ticketDate < fromDate || ticketDate > toDate) return false;
      if (filters.technicianId && ticket.assignedToId !== filters.technicianId) return false;
      if (filters.status && ticket.status !== filters.status) return false;
      if (filters.priority && ticket.priority !== filters.priority) return false;
      if (filters.equipmentId && ticket.equipmentId !== filters.equipmentId) return false;
      
      return true;
    });
  };

  const generateFullReport = async () => {
    setGenerating(true);
    try {
      const filteredTickets = filterTickets(tickets);
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Reporte General de Tickets</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #333; }
            .subtitle { color: #666; margin-top: 5px; }
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 30px 0; }
            .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; }
            .stat-value { font-size: 2em; font-weight: bold; color: #007bff; }
            .stat-label { color: #666; margin-top: 5px; }
            .section { margin: 30px 0; }
            .section-title { background: #f5f5f5; padding: 10px; font-weight: bold; border-left: 4px solid #007bff; }
            .chart-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .filters { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">🦷 CONSULTORIO DENTAL "SONRISAS"</div>
            <div class="subtitle">Gestión Integral de Mantenimiento</div>
            <div class="subtitle">Reporte General de Tickets - ${new Date().toLocaleDateString('es-ES')}</div>
          </div>

          <div class="filters">
            <strong>Filtros aplicados:</strong><br>
            Período: ${new Date(filters.dateFrom).toLocaleDateString('es-ES')} - ${new Date(filters.dateTo).toLocaleDateString('es-ES')}<br>
            ${filters.status ? `Estado: ${filters.status} | ` : ''}
            ${filters.priority ? `Prioridad: ${filters.priority} | ` : ''}
            Total de tickets: ${filteredTickets.length}
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">${reportStats?.totalTickets || 0}</div>
              <div class="stat-label">Total de Tickets</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${reportStats?.closedTickets || 0}</div>
              <div class="stat-label">Tickets Cerrados</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${reportStats?.avgResolutionTime || 0}h</div>
              <div class="stat-label">Tiempo Promedio</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${Math.round(((reportStats?.closedTickets || 0) / (reportStats?.totalTickets || 1)) * 100)}%</div>
              <div class="stat-label">Tasa de Resolución</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Tickets por Estado</div>
            ${Object.entries(reportStats?.ticketsByStatus || {}).map(([status, count]) => 
              `<div class="chart-item">
                <span>${getStatusLabel(status)}</span>
                <span><strong>${count}</strong></span>
              </div>`
            ).join('')}
          </div>

          <div class="section">
            <div class="section-title">Tickets por Prioridad</div>
            ${Object.entries(reportStats?.ticketsByPriority || {}).map(([priority, count]) => 
              `<div class="chart-item">
                <span>${getPriorityLabel(priority)}</span>
                <span><strong>${count}</strong></span>
              </div>`
            ).join('')}
          </div>

          <div class="section">
            <div class="section-title">Tickets por Técnico</div>
            ${Object.entries(reportStats?.ticketsByTechnician || {}).map(([tech, count]) => 
              `<div class="chart-item">
                <span>${tech}</span>
                <span><strong>${count}</strong></span>
              </div>`
            ).join('')}
          </div>

          <div class="section">
            <div class="section-title">Equipos con Más Incidencias</div>
            ${(reportStats?.equipmentIssues || []).map(({ equipment, count }) => 
              `<div class="chart-item">
                <span>${equipment}</span>
                <span><strong>${count}</strong></span>
              </div>`
            ).join('')}
          </div>

          <div style="margin-top: 50px; text-align: center; color: #666; font-size: 12px;">
            Reporte generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}
          </div>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        setTimeout(() => printWindow.close(), 1000);
      }
      
    } catch (error) {
      console.error('Error generando reporte:', error);
      await showError('Error al generar el reporte');
    } finally {
      setGenerating(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      nuevo: 'Nuevo',
      en_proceso: 'En Proceso',
      cerrado: 'Cerrado'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getPriorityLabel = (priority: string) => {
    const labels = {
      baja: 'Baja',
      media: 'Media',
      alta: 'Alta',
      critica: 'Crítica'
    };
    return labels[priority as keyof typeof labels] || priority;
  };

  const technicians = users.filter(u => u.role === 'tecnico' || u.role === 'admin');

  const filteredDeletedTickets = deletedTickets.filter(dt => 
    (dt.ticket_number?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (dt.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (dt.justification?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (dt.deletedBy?.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const columns = [
    { key: 'ticket_number', label: 'Ticket', render: (row: any) => row.ticket_number },
    { key: 'title', label: 'Título', render: (row: any) => row.title },
    { key: 'justification', label: 'Justificación', render: (row: any) => row.justification },
    { key: 'deletedBy', label: 'Eliminado Por', render: (row: any) => row.deletedBy?.fullName || 'N/A' },
    { key: 'deleted_at', label: 'Fecha Eliminación', render: (row: any) => new Date(row.deleted_at).toLocaleDateString() + ' ' + new Date(row.deleted_at).toLocaleTimeString() }
  ];

  if (loading) {
    return (
      <Layout>
        <div className={styles.container}>
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Cargando datos...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Reportes y Estadísticas</h1>
            <p>Análisis del rendimiento del sistema de mantenimiento</p>
          </div>
          <div className={styles.headerActions}>
            <button 
              className="btn btn-outline"
              onClick={() => setShowFiltersModal(true)}
            >
              <Filter size={18} />
              Filtros
            </button>
            <button 
              className="btn btn-primary"
              onClick={generateFullReport}
              disabled={generating}
            >
              <Download size={18} />
              {generating ? 'Generando...' : 'Exportar PDF'}
            </button>
          </div>
        </div>

        {reportStats && (
          <>
            <div className={styles.statsSection}>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <FileText size={24} />
                  </div>
                  <div className={styles.statContent}>
                    <h3>{reportStats.totalTickets}</h3>
                    <p>Total Tickets</p>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={`${styles.statIcon} ${styles.closed}`}>
                    <TrendingUp size={24} />
                  </div>
                  <div className={styles.statContent}>
                    <h3>{reportStats.closedTickets}</h3>
                    <p>Cerrados</p>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={`${styles.statIcon} ${styles.time}`}>
                    <Calendar size={24} />
                  </div>
                  <div className={styles.statContent}>
                    <h3>{reportStats.avgResolutionTime}h</h3>
                    <p>Tiempo Promedio</p>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={`${styles.statIcon} ${styles.rate}`}>
                    <BarChart3 size={24} />
                  </div>
                  <div className={styles.statContent}>
                    <h3>{Math.round((reportStats.closedTickets / (reportStats.totalTickets || 1)) * 100)}%</h3>
                    <p>Tasa Resolución</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.chartsGrid}>
              <div className={styles.chartCard}>
                <h3>Tickets por Estado</h3>
                <div className={styles.chartContent}>
                  {Object.entries(reportStats.ticketsByStatus).map(([status, count]) => (
                    <div key={status} className={styles.chartRow}>
                      <span className={styles.chartLabel}>{getStatusLabel(status)}</span>
                      <div className={styles.chartBar}>
                        <div 
                          className={`${styles.chartFill} ${styles[status]}`} 
                          style={{ width: `${(count / reportStats.totalTickets) * 100}%` }}
                        />
                      </div>
                      <span className={styles.chartValue}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.chartCard}>
                <h3>Tickets por Prioridad</h3>
                <div className={styles.chartContent}>
                  {Object.entries(reportStats.ticketsByPriority).map(([priority, count]) => (
                    <div key={priority} className={styles.chartRow}>
                      <span className={styles.chartLabel}>{getPriorityLabel(priority)}</span>
                      <div className={styles.chartBar}>
                        <div 
                          className={`${styles.chartFill} ${styles[priority]}`} 
                          style={{ width: `${(count / reportStats.totalTickets) * 100}%` }}
                        />
                      </div>
                      <span className={styles.chartValue}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        <div className={styles.header} style={{ marginTop: '2rem' }}>
          <div>
            <h1>Historial de Eliminación</h1>
            <p>Registro de tickets eliminados y auditoría</p>
          </div>
        </div>

        <div style={{ background: 'white', padding: 16, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
             <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
               <div style={{ position: 'relative', flex: 1 }}>
                   <Search size={20} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                   <input 
                      className="form-input"
                      type="text" 
                      placeholder="Buscar en historial..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ width: '100%', paddingLeft: 40, height: '48px', fontSize: '1rem' }}
                   />
               </div>
             </div>
          </div>
        </div>

        <div className={styles.tableContainer}>
          <Table
            data={filteredDeletedTickets}
            columns={columns}
            loading={loading}
            emptyMessage="No hay tickets eliminados"
            selectable={false}
          />
        </div>
      </div>

      <Modal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        title="Filtrar Reporte"
      >
        <div className={styles.filtersForm}>
          <div className={styles.formGrid}>
            <div className="form-group">
              <label>Desde</label>
              <input 
                type="date" 
                className="form-input"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Hasta</label>
              <input 
                type="date" 
                className="form-input"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Técnico</label>
            <select 
              className="form-input"
              value={filters.technicianId}
              onChange={(e) => setFilters({ ...filters, technicianId: e.target.value })}
            >
              <option value="">TODOS LOS TÉCNICOS</option>
              {technicians.map(tech => (
                <option key={tech.id} value={tech.id}>{tech.fullName.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGrid}>
            <div className="form-group">
              <label>Estado</label>
              <select 
                className="form-input"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">TODOS LOS ESTADOS</option>
                <option value="nuevo">NUEVO</option>
                <option value="en_proceso">EN PROCESO</option>
                <option value="cerrado">CERRADO</option>
              </select>
            </div>
            <div className="form-group">
              <label>Prioridad</label>
              <select 
                className="form-input"
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              >
                <option value="">TODAS LAS PRIORIDADES</option>
                <option value="baja">BAJA</option>
                <option value="media">MEDIA</option>
                <option value="alta">ALTA</option>
                <option value="critica">CRÍTICA</option>
              </select>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button className="btn btn-outline" onClick={() => {
              setFilters({
                dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
                dateTo: new Date().toISOString().split('T')[0],
                technicianId: '',
                status: '',
                priority: '',
                equipmentId: ''
              });
            }}>
              Limpiar
            </button>
            <button className="btn btn-primary" onClick={() => setShowFiltersModal(false)}>
              Aplicar Filtros
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default ReportsPage;
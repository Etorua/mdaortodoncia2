import { Ticket, Equipment, User, Patient, ClinicalModuleRecord } from '../models/index.js';
import { Op } from 'sequelize';

const dashboardController = {
  async getStats(ctx) {
    try {
      const user = ctx.state.user || {};
      const role = ((user.rol || user.role) || '').toString().toLowerCase().trim();
      const isRestricted = ['usuario', 'user', 'inventario'].includes(role);

      // Mostrar por defecto estadísticas de todo el sistema.
      // Si en el futuro se desea limitar a tickets reportados por el usuario,
      // se puede activar la siguiente línea para aplicar el filtro:
      // const where = isRestricted ? { reported_by_id: user.id } : {};
      const where = {};

      const countClinicalRecords = moduleKey => ClinicalModuleRecord.count({
        where: {
          module_key: moduleKey,
          is_active: true
        }
      });

      const [
        totalTickets,
        openTickets,
        pendingTickets,
        inProgressTickets,
        closedTickets,
        totalEquipment,
        operationalEquipment,
        equipmentInRepair,
        totalUsers,
        activeUsers,
        totalPatients,
        activePatients,
        totalDoctors,
        totalAppointments,
        totalTreatments,
        totalPrescriptions,
        totalPendingBalances,
        totalFinancialReports,
        totalClinicalHistories,
        totalOdontograms,
        totalConsents
      ] = await Promise.all([
        Ticket.count({ where }),
        Ticket.count({ where: { ...where, status: 'nuevo' } }),
        Ticket.count({ where: { ...where, status: 'pendiente' } }),
        Ticket.count({ where: { ...where, status: 'en_proceso' } }),
        Ticket.count({ where: { ...where, status: 'cerrado' } }),
        Equipment.count(),
        Equipment.count({ where: { status: 'operativo' } }),
        Equipment.count({ where: { status: 'maintenance' } }),
        User.count(),
        User.count({ where: { activo: true } }),
        Patient.count(),
        Patient.count({ where: { activo: true } }),
        countClinicalRecords('doctores'),
        countClinicalRecords('agenda-citas'),
        countClinicalRecords('tratamientos'),
        countClinicalRecords('recetas-medicas'),
        countClinicalRecords('pacientes-adeudos'),
        countClinicalRecords('reportes-financieros'),
        countClinicalRecords('historial-clinico'),
        countClinicalRecords('historial-odontograma'),
        countClinicalRecords('consentimiento-informado')
      ]);

      let recentActivity = [];
      try {
        const moduleLabels = {
          'doctores': 'Doctor',
          'historial-clinico': 'Historial clínico',
          'consentimiento-informado': 'Consentimiento',
          'justificantes': 'Justificante',
          'tratamientos': 'Tratamiento',
          'historial-odontograma': 'Odontograma',
          'agenda-citas': 'Cita',
          'centros-medicos': 'Centro médico',
          'reportes-financieros': 'Movimiento financiero',
          'pacientes-adeudos': 'Adeudo',
          'recetas-medicas': 'Receta'
        };

        const recentClinicalRecords = await ClinicalModuleRecord.findAll({
          where: { is_active: true },
          limit: 6,
          order: [['created_at', 'DESC']]
        });

        recentActivity = recentClinicalRecords.map(record => {
          const data = record.data || {};
          const summary =
            data.nombrePaciente ||
            data.paciente ||
            data.nombre ||
            data.tratamiento ||
            data.concepto ||
            data.procedimiento ||
            'Registro actualizado';

          return {
            id: record.id,
            moduleKey: record.module_key,
            moduleLabel: moduleLabels[record.module_key] || record.module_key,
            summary,
            createdAt: record.created_at || record.createdAt
          };
        });
      } catch (err) {
        console.error('Error fetching recent clinical activity for dashboard:', err);
        recentActivity = [];
      }

      ctx.body = {
        success: true,
        data: {
          totalPatients,
          activePatients,
          totalDoctors,
          totalAppointments,
          totalTreatments,
          totalPrescriptions,
          totalPendingBalances,
          totalFinancialReports,
          totalClinicalHistories,
          totalOdontograms,
          totalConsents,
          totalTickets,
          openTickets,
          pendingTickets,
          inProgressTickets,
          closedTickets,
          totalEquipment,
          operationalEquipment,
          equipmentInRepair,
          totalUsers,
          activeUsers,
          recentActivity
        }
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      ctx.status = 500;
      // Intentar extraer detalles del error de Sequelize
      const details = {};
      try {
        details.message = error.message;
        details.original = error.original && (error.original.message || error.original.detail || String(error.original));
        details.parent = error.parent && (error.parent.message || error.parent.detail || String(error.parent));
        details.sql = error.sql || error.sqlQuery || null;
      } catch (e) {}

      // No exponer detalles internos en la respuesta en ningún caso aquí
      ctx.body = {
        success: false,
        message: 'Error al obtener estadísticas del dashboard'
      };
    }
  }
};

export default dashboardController;

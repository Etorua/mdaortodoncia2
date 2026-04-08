import { ClinicalModuleRecord, Patient } from '../models/index.js';

const ALLOWED_MODULE_KEYS = new Set([
  'doctores',
  'historial-clinico',
  'consentimiento-informado',
  'justificantes',
  'tratamientos',
  'historial-odontograma',
  'agenda-citas',
  'centros-medicos',
  'reportes-financieros',
  'pacientes-adeudos',
  'recetas-medicas'
]);

function normalizeModuleKey(moduleKey) {
  return (moduleKey || '').toString().trim().toLowerCase();
}

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function sanitizeData(data) {
  if (!isPlainObject(data)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      typeof value === 'string' ? value.trim() : value
    ])
  );
}

class ClinicalModuleController {
  async getReferences(ctx) {
    try {
      const moduleKey = normalizeModuleKey(ctx.params.moduleKey);

      if (!ALLOWED_MODULE_KEYS.has(moduleKey)) {
        ctx.status = 404;
        ctx.body = { success: false, message: 'Módulo no encontrado' };
        return;
      }

      const [patients, doctors] = await Promise.all([
        Patient.findAll({
          where: { activo: true },
          order: [['nombre_completo', 'ASC']]
        }),
        ClinicalModuleRecord.findAll({
          where: { module_key: 'doctores', is_active: true },
          order: [['updated_at', 'DESC']]
        })
      ]);

      ctx.body = {
        success: true,
        data: {
          patients: patients.map(patient => patient.toPublicJSON()),
          doctors: doctors.map(record => ({
            id: record.id,
            name: record.data?.nombre || '',
            specialty: record.data?.especialidad || ''
          })).filter(doctor => doctor.name)
        }
      };
    } catch (error) {
      console.error('Error al obtener referencias del módulo clínico:', error);
      ctx.status = 500;
      ctx.body = { success: false, message: 'Error al obtener referencias del módulo' };
    }
  }

  async getAll(ctx) {
    try {
      const moduleKey = normalizeModuleKey(ctx.params.moduleKey);
      const search = (ctx.query.search || '').toString().trim().toLowerCase();

      if (!ALLOWED_MODULE_KEYS.has(moduleKey)) {
        ctx.status = 404;
        ctx.body = { success: false, message: 'Módulo no encontrado' };
        return;
      }

      const records = await ClinicalModuleRecord.findAll({
        where: { module_key: moduleKey },
        order: [['updated_at', 'DESC'], ['created_at', 'DESC']]
      });

      const filteredRecords = search
        ? records.filter(record => JSON.stringify(record.data || {}).toLowerCase().includes(search))
        : records;

      ctx.body = {
        success: true,
        data: filteredRecords
      };
    } catch (error) {
      console.error('Error al obtener registros del módulo clínico:', error);
      ctx.status = 500;
      ctx.body = { success: false, message: 'Error al obtener los registros del módulo' };
    }
  }

  async getById(ctx) {
    try {
      const moduleKey = normalizeModuleKey(ctx.params.moduleKey);
      const { id } = ctx.params;

      const record = await ClinicalModuleRecord.findOne({
        where: {
          id,
          module_key: moduleKey
        }
      });

      if (!record) {
        ctx.status = 404;
        ctx.body = { success: false, message: 'Registro no encontrado' };
        return;
      }

      ctx.body = { success: true, data: record };
    } catch (error) {
      console.error('Error al obtener registro del módulo clínico:', error);
      ctx.status = 500;
      ctx.body = { success: false, message: 'Error al obtener el registro' };
    }
  }

  async create(ctx) {
    try {
      const moduleKey = normalizeModuleKey(ctx.params.moduleKey);
      const { data, is_active } = ctx.request.body || {};

      if (!ALLOWED_MODULE_KEYS.has(moduleKey)) {
        ctx.status = 404;
        ctx.body = { success: false, message: 'Módulo no encontrado' };
        return;
      }

      const sanitizedData = sanitizeData(data);

      const record = await ClinicalModuleRecord.create({
        module_key: moduleKey,
        data: sanitizedData,
        is_active: is_active !== undefined ? !!is_active : true
      });

      ctx.status = 201;
      ctx.body = { success: true, data: record };
    } catch (error) {
      console.error('Error al crear registro del módulo clínico:', error);
      ctx.status = 500;
      ctx.body = { success: false, message: 'Error al crear el registro' };
    }
  }

  async update(ctx) {
    try {
      const moduleKey = normalizeModuleKey(ctx.params.moduleKey);
      const { id } = ctx.params;
      const { data, is_active } = ctx.request.body || {};

      const record = await ClinicalModuleRecord.findOne({
        where: {
          id,
          module_key: moduleKey
        }
      });

      if (!record) {
        ctx.status = 404;
        ctx.body = { success: false, message: 'Registro no encontrado' };
        return;
      }

      await record.update({
        data: data !== undefined ? sanitizeData(data) : record.data,
        is_active: is_active !== undefined ? !!is_active : record.is_active
      });

      ctx.body = { success: true, data: record };
    } catch (error) {
      console.error('Error al actualizar registro del módulo clínico:', error);
      ctx.status = 500;
      ctx.body = { success: false, message: 'Error al actualizar el registro' };
    }
  }

  async delete(ctx) {
    try {
      const moduleKey = normalizeModuleKey(ctx.params.moduleKey);
      const { id } = ctx.params;

      const deleted = await ClinicalModuleRecord.destroy({
        where: {
          id,
          module_key: moduleKey
        }
      });

      if (!deleted) {
        ctx.status = 404;
        ctx.body = { success: false, message: 'Registro no encontrado' };
        return;
      }

      ctx.body = { success: true, message: 'Registro eliminado correctamente' };
    } catch (error) {
      console.error('Error al eliminar registro del módulo clínico:', error);
      ctx.status = 500;
      ctx.body = { success: false, message: 'Error al eliminar el registro' };
    }
  }
}

export default new ClinicalModuleController();
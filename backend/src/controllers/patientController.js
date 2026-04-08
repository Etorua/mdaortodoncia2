import { Patient } from '../models/index.js';
import { Op } from 'sequelize';

class PatientController {
  constructor() {
    this.getAllPatients = this.getAllPatients.bind(this);
    this.getPatientById = this.getPatientById.bind(this);
    this.createPatient = this.createPatient.bind(this);
    this.updatePatient = this.updatePatient.bind(this);
    this.deletePatient = this.deletePatient.bind(this);
  }

  async getAllPatients(ctx) {
    try {
      const { page = 1, limit = 10, search = '', isActive = '' } = ctx.query;
      const parsedPage = parseInt(page, 10);
      const parsedLimit = parseInt(limit, 10);
      const offset = (parsedPage - 1) * parsedLimit;
      const where = {};

      if (search) {
        where[Op.or] = [
          { nombre_completo: { [Op.iLike]: `%${search}%` } },
          { correo: { [Op.iLike]: `%${search}%` } },
          { telefono: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (isActive !== '') {
        where.activo = isActive === 'true';
      }

      const { count, rows } = await Patient.findAndCountAll({
        where,
        limit: parsedLimit,
        offset,
        order: [['nombre_completo', 'ASC']]
      });

      ctx.status = 200;
      ctx.body = {
        success: true,
        data: rows.map(patient => patient.toPublicJSON()),
        pagination: {
          total: count,
          page: parsedPage,
          limit: parsedLimit,
          totalPages: Math.ceil(count / parsedLimit)
        }
      };
    } catch (error) {
      console.error('Error al obtener pacientes:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: 'Error al obtener la lista de pacientes'
      };
    }
  }

  async getPatientById(ctx) {
    try {
      const { id } = ctx.params;
      const patient = await Patient.findByPk(id);

      if (!patient) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          message: 'Paciente no encontrado'
        };
        return;
      }

      ctx.status = 200;
      ctx.body = {
        success: true,
        data: patient.toPublicJSON()
      };
    } catch (error) {
      console.error('Error al obtener paciente:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: 'Error al obtener el paciente'
      };
    }
  }

  async createPatient(ctx) {
    try {
      const { nombre_completo, correo, telefono, direccion, fecha_nacimiento, genero, antecedentes } = ctx.request.body;

      if (!nombre_completo) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: 'El nombre completo es obligatorio'
        };
        return;
      }

      if (correo) {
        const existingPatient = await Patient.findOne({ where: { correo } });
        if (existingPatient) {
          ctx.status = 409;
          ctx.body = {
            success: false,
            message: 'El correo electrónico ya está registrado'
          };
          return;
        }
      }

      const newPatient = await Patient.create({
        nombre_completo,
        correo,
        telefono,
        direccion,
        fecha_nacimiento,
        genero,
        antecedentes,
        activo: true
      });

      ctx.status = 201;
      ctx.body = {
        success: true,
        message: 'Paciente registrado exitosamente',
        data: newPatient.toPublicJSON()
      };
    } catch (error) {
      console.error('Error al crear paciente:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: 'Error al registrar el paciente'
      };
    }
  }

  async updatePatient(ctx) {
    try {
      const { id } = ctx.params;
      const { nombre_completo, correo, telefono, direccion, fecha_nacimiento, genero, antecedentes, activo } = ctx.request.body;
      const patient = await Patient.findByPk(id);

      if (!patient) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          message: 'Paciente no encontrado'
        };
        return;
      }

      if (correo && correo !== patient.correo) {
        const existingPatient = await Patient.findOne({ where: { correo } });
        if (existingPatient) {
          ctx.status = 409;
          ctx.body = {
            success: false,
            message: 'El correo electrónico ya está ocupado por otro paciente'
          };
          return;
        }
      }

      await patient.update({
        nombre_completo,
        correo,
        telefono,
        direccion,
        fecha_nacimiento,
        genero,
        antecedentes,
        activo: activo === undefined ? patient.activo : activo
      });

      ctx.status = 200;
      ctx.body = {
        success: true,
        message: 'Paciente actualizado exitosamente',
        data: patient.toPublicJSON()
      };
    } catch (error) {
      console.error('Error al actualizar paciente:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: 'Error al actualizar el paciente'
      };
    }
  }

  async deletePatient(ctx) {
    try {
      const { id } = ctx.params;
      const patient = await Patient.findByPk(id);

      if (!patient) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          message: 'Paciente no encontrado'
        };
        return;
      }

      await patient.update({ activo: false });

      ctx.status = 200;
      ctx.body = {
        success: true,
        message: 'Paciente desactivado exitosamente'
      };
    } catch (error) {
      console.error('Error al eliminar paciente:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: 'Error al eliminar el paciente'
      };
    }
  }
}

export default new PatientController();

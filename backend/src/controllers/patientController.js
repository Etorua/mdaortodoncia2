import { db } from '../models/index.js';
import { Op } from 'sequelize';

// Asegúrate de importar el modelo Patient si no está en index.js aún
// Pero como Sequelize carga dinámicamente, estará disponible como db.Patient después de registrarlo
const Patient = db.Patient;

export const patientController = {
  // Obtener todos los pacientes
  getAll: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '', isActive } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      
      if (search) {
        where[Op.or] = [
          { nombre_completo: { [Op.iLike]: `%${search}%` } },
          { correo: { [Op.iLike]: `%${search}%` } },
          { telefono: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (isActive !== undefined) {
        where.activo = isActive === 'true';
      }

      const { count, rows } = await Patient.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['nombre_completo', 'ASC']]
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          totalPages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error('Error al obtener pacientes:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener la lista de pacientes'
      });
    }
  },

  // Obtener paciente por ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const patient = await Patient.findByPk(id);

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Paciente no encontrado'
        });
      }

      res.json({
        success: true,
        data: patient
      });
    } catch (error) {
      console.error('Error al obtener paciente:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener el paciente'
      });
    }
  },

  // Crear paciente
  create: async (req, res) => {
    try {
      const { nombre_completo, correo, telefono, direccion, fecha_nacimiento, genero, antecedentes } = req.body;

      // Validar correo único si se proporciona
      if (correo) {
        const existingPatient = await Patient.findOne({ where: { correo } });
        if (existingPatient) {
          return res.status(400).json({
            success: false,
            message: 'El correo electrónico ya está registrado'
          });
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

      res.status(201).json({
        success: true,
        message: 'Paciente registrado exitosamente',
        data: newPatient
      });
    } catch (error) {
      console.error('Error al crear paciente:', error);
      res.status(500).json({
        success: false,
        message: 'Error al registrar el paciente'
      });
    }
  },

  // Actualizar paciente
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre_completo, correo, telefono, direccion, fecha_nacimiento, genero, antecedentes, activo } = req.body;

      const patient = await Patient.findByPk(id);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Paciente no encontrado'
        });
      }

      // Validar correo único si cambia
      if (correo && correo !== patient.correo) {
        const existingPatient = await Patient.findOne({ where: { correo } });
        if (existingPatient) {
          return res.status(400).json({
            success: false,
            message: 'El correo electrónico ya está ocupado por otro paciente'
          });
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
        activo
      });

      res.json({
        success: true,
        message: 'Paciente actualizado exitosamente',
        data: patient
      });
    } catch (error) {
      console.error('Error al actualizar paciente:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar el paciente'
      });
    }
  },

  // Eliminar paciente (soft delete o lógico)
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const patient = await Patient.findByPk(id);

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Paciente no encontrado'
        });
      }

      // Se puede optar por borrado lógico (isActive = false) o físico
      // Aquí haremos borrado físico para simplificar, o lógico si prefieres
      // Vamos con lógico:
      await patient.update({ activo: false });

      res.json({
        success: true,
        message: 'Paciente desactivado exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar paciente:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar el paciente'
      });
    }
  }
};

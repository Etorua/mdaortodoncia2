import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Patient extends Model {
  static associate(models) {
    Patient.hasMany(models.Ticket, {
      foreignKey: 'patient_id',
      as: 'appointments'
    });
  }

  toPublicJSON() {
    const data = this.dataValues;
    const {
      id,
      nombre_completo,
      correo,
      telefono,
      direccion,
      fecha_nacimiento,
      genero,
      antecedentes,
      activo,
      createdAt,
      updatedAt,
      created_at,
      updated_at,
      ...rest
    } = data;

    return {
      id,
      fullName: nombre_completo,
      email: correo,
      phone: telefono,
      address: direccion,
      birthDate: fecha_nacimiento,
      gender: genero,
      medicalHistory: antecedentes,
      isActive: activo,
      createdAt: createdAt || (created_at ? new Date(created_at).toISOString() : undefined),
      updatedAt: updatedAt || (updated_at ? new Date(updated_at).toISOString() : undefined),
      ...rest
    };
  }
}

Patient.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nombre_completo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  correo: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: true
  },
  direccion: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fecha_nacimiento: {
    type: DataTypes.DATE,
    allowNull: true
  },
  genero: {
    type: DataTypes.STRING,
    allowNull: true
  },
  antecedentes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  sequelize,
  modelName: 'Patient',
  tableName: 'patients',
  underscored: true,
  timestamps: true
});

export default Patient;

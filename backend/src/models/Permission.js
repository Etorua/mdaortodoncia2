import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Permission extends Model {
  // Asociaciones estáticas
  static associate(models) {
    // Un permiso puede tener muchas asignaciones de usuario
    Permission.hasMany(models.UserPermission, {
      foreignKey: 'permission_id',
      as: 'userPermissions'
    });
  }
}

// Definir el modelo Permission
Permission.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  module: {
    type: DataTypes.ENUM(
      'dashboard', 
      'users', 
      'equipment', 
      'tickets', 
      'reports', 
      'profile', 
      'permissions',
      'supplies',
      'departments',
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
    ),
    allowNull: false
  },
  action: {
    type: DataTypes.ENUM(
      'view', 
      'create', 
      'edit', 
      'delete', 
      'export', 
      'assign'
    ),
    allowNull: false
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  sequelize,
  modelName: 'Permission',
  tableName: 'permissions',
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['module', 'action']
    },
    {
      fields: ['module']
    },
    {
      fields: ['action']
    },
    {
      fields: ['is_active']
    }
  ]
});

export default Permission;
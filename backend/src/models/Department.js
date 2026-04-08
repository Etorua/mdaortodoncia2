import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Department extends Model {
  static associate(models) {
    Department.hasMany(models.User, {
      foreignKey: 'department_id',
      as: 'users'
    });
  }
}

Department.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  display_name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  sequelize,
  modelName: 'Department',
  tableName: 'departments',
  underscored: true,
  timestamps: true
});

export default Department;

import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class ClinicalModuleRecord extends Model {}

ClinicalModuleRecord.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  module_key: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  data: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  sequelize,
  modelName: 'ClinicalModuleRecord',
  tableName: 'clinical_module_records',
  underscored: true,
  indexes: [
    {
      fields: ['module_key']
    },
    {
      fields: ['is_active']
    }
  ]
});

export default ClinicalModuleRecord;
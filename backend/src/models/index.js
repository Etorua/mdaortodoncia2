import { sequelize } from '../config/database.js';
import User from './User.js';
import Equipment from './Equipment.js';
import Ticket from './Ticket.js';
import Permission from './Permission.js';
import UserPermission from './UserPermission.js';
import TicketComment from './TicketComment.js';
import InventoryMovement from './InventoryMovement.js';
import DeletedTicket from './DeletedTicket.js';
import ReadNotification from './ReadNotification.js';
import Department from './Department.js';
import Insumo from './Insumo.js';
import InsumosUsuario from './InsumosUsuario.js';
import Activity from './Activity.js';
import ActivityParticipant from './ActivityParticipant.js';
import ActivityComment from './ActivityComment.js';
import permissionService from '../services/permissionService.js';
import Patient from './Patient.js';

// Objeto que contiene todos los modelos
const models = {
  User,
  Equipment,
  Ticket,
  Permission,
  UserPermission,
  TicketComment,
  InventoryMovement,
  DeletedTicket,
  ReadNotification,
  Department,
  Insumo,
  InsumosUsuario,
  Activity,
  ActivityParticipant,
  ActivityComment,
  Patient
};

// Configurar asociaciones
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Hook: afterCreate en User para asegurar asignación de permisos por defecto
try {
  if (models.User && typeof models.User.addHook === 'function') {
    models.User.addHook('afterCreate', async (user, options) => {
      try {
        const grantedById = user.id;
        await permissionService.assignDefaultPermissions(user, user.rol || 'usuario', grantedById, { transaction: options.transaction });
      } catch (e) {
        console.error('Error en afterCreate hook asignando permisos por defecto:', e);
      }
    });
  }
} catch (e) {
  console.error('No se pudo registrar hook afterCreate para User:', e);
}

// Exportar modelos y sequelize
export {
  sequelize,
  User,
  Equipment,
  Ticket,
  Permission,
  UserPermission,
  TicketComment,
  InventoryMovement,
  DeletedTicket,
  ReadNotification,
  Department,
  Insumo,
  InsumosUsuario,
  Activity,
  ActivityParticipant,
  ActivityComment,
  Patient
};

export default models;
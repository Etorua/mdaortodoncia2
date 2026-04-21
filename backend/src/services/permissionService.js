import { sequelize } from '../config/database.js';
import Permission from '../models/Permission.js';
import UserPermission from '../models/UserPermission.js';

// Servicio para asignar permisos por rol de forma reutilizable y transaccional
export async function assignDefaultPermissions(user, role, grantedById, options = {}) {
  const transactionProvided = !!options.transaction;
  const t = options.transaction || await sequelize.transaction();

  try {
    const normalizedRole = (role || '')
      .toString()
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const rolePermissions = {
      'admin': 'ALL',
      'doctor': [
        { module: 'dashboard', actions: ['view'] },
        { module: 'profile', actions: ['view', 'edit'] },
        { module: 'tickets', actions: ['view', 'create', 'edit'] },
        { module: 'patients', actions: ['view', 'create', 'edit'] },
        { module: 'historial-clinico', actions: ['view', 'create', 'edit'] },
        { module: 'consentimiento-informado', actions: ['view', 'create', 'edit'] },
        { module: 'justificantes', actions: ['view', 'create', 'edit'] },
        { module: 'tratamientos', actions: ['view', 'create', 'edit'] },
        { module: 'historial-odontograma', actions: ['view', 'create', 'edit'] },
        { module: 'agenda-citas', actions: ['view', 'create', 'edit'] },
        { module: 'recetas-medicas', actions: ['view', 'create', 'edit'] }
      ],
      'asistente': [
        { module: 'dashboard', actions: ['view'] },
        { module: 'profile', actions: ['view', 'edit'] },
        { module: 'tickets', actions: ['view', 'create', 'edit'] },
        { module: 'patients', actions: ['view', 'create', 'edit'] },
        { module: 'agenda-citas', actions: ['view', 'create', 'edit'] },
        { module: 'historial-clinico', actions: ['view'] },
        { module: 'consentimiento-informado', actions: ['view'] },
        { module: 'justificantes', actions: ['view', 'create'] },
        { module: 'tratamientos', actions: ['view'] },
        { module: 'historial-odontograma', actions: ['view'] },
        { module: 'recetas-medicas', actions: ['view'] }
      ],
      'recepcion': [
        { module: 'dashboard', actions: ['view'] },
        { module: 'profile', actions: ['view', 'edit'] },
        { module: 'tickets', actions: ['view', 'create', 'edit'] },
        { module: 'patients', actions: ['view', 'create', 'edit'] },
        { module: 'agenda-citas', actions: ['view', 'create', 'edit'] },
        { module: 'pacientes-adeudos', actions: ['view', 'edit'] }
      ],
      'tecnico': [
        { module: 'dashboard', actions: ['view'] },
        { module: 'profile', actions: ['view', 'edit'] },
        { module: 'tickets', actions: ['view', 'create', 'edit'] },
        { module: 'equipment', actions: ['view', 'create', 'edit'] },
        { module: 'supplies', actions: ['view', 'create', 'edit'] },
        { module: 'users', actions: ['view'] },
        { module: 'reports', actions: ['view', 'export'] }
      ],
      'inventario': [
        { module: 'dashboard', actions: ['view'] },
        { module: 'profile', actions: ['view', 'edit'] },
        { module: 'equipment', actions: ['view', 'create', 'edit', 'delete'] },
        { module: 'supplies', actions: ['view', 'create', 'edit', 'delete'] },
        { module: 'tickets', actions: ['view'] }
      ],
      'usuario': [
        { module: 'dashboard', actions: ['view'] },
        { module: 'profile', actions: ['view', 'edit'] },
        { module: 'tickets', actions: ['view', 'create', 'edit'] },
        { module: 'patients', actions: ['view', 'create', 'edit'] },
        { module: 'agenda-citas', actions: ['view', 'create', 'edit'] },
        { module: 'pacientes-adeudos', actions: ['view', 'edit'] }
      ],
      'user': [
        { module: 'dashboard', actions: ['view'] },
        { module: 'profile', actions: ['view', 'edit'] },
        { module: 'tickets', actions: ['view', 'create', 'edit'] },
        { module: 'patients', actions: ['view', 'create', 'edit'] },
        { module: 'agenda-citas', actions: ['view', 'create', 'edit'] },
        { module: 'pacientes-adeudos', actions: ['view', 'edit'] }
      ]
    };

    const permissionsToAssign = rolePermissions[normalizedRole] || rolePermissions['usuario'];

    const aliasGroups = [
      ['patients', 'pacientes'],
      ['supplies', 'insumos'],
      ['users', 'usuarios'],
      ['equipment', 'equipos'],
      ['tickets']
    ];

    const moduleAliases = {};
    aliasGroups.forEach(group => group.forEach(n => moduleAliases[n] = group));

    const allPermissions = await Permission.findAll({ transaction: t });

    let assignedCount = 0;

    if (permissionsToAssign === 'ALL') {
      for (const perm of allPermissions) {
        const [up, created] = await UserPermission.findOrCreate({
          where: { user_id: user.id, permission_id: perm.id },
          defaults: { granted_by_id: grantedById, is_active: true },
          transaction: t
        });
        if (created) assignedCount++;
      }
    } else {
      const permissionsToGrant = [];
      for (const p of permissionsToAssign) {
        const aliases = moduleAliases[p.module] || [p.module];
        for (const perm of allPermissions) {
          if (aliases.includes(perm.module) && p.actions.includes(perm.action)) {
            permissionsToGrant.push(perm);
          }
        }
      }

      const uniquePermissions = Array.from(new Map(permissionsToGrant.map(r => [r.id, r])).values());

      for (const perm of uniquePermissions) {
        const [up, created] = await UserPermission.findOrCreate({
          where: { user_id: user.id, permission_id: perm.id },
          defaults: { granted_by_id: grantedById, is_active: true },
          transaction: t
        });
        if (created) assignedCount++;
      }
    }

    if (!transactionProvided) await t.commit();
    console.log(`Asignados ${assignedCount} permisos a usuario ${user.usuario || user.id} para rol ${normalizedRole}`);
    return assignedCount;
  } catch (error) {
    if (!transactionProvided) await t.rollback();
    console.error('Error en assignDefaultPermissions:', error);
    throw error;
  }
}

export default { assignDefaultPermissions };

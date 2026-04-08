import { Ticket, User, Equipment, TicketComment, sequelize, InventoryMovement, DeletedTicket, Department, Patient } from '../models/index.js';
import Insumo from '../models/Insumo.js';
import { Op } from 'sequelize';

// Helper para gestionar el inventario de insumos
async function updateInventory(oldPartsInput, newPartsInput, userId = null, ticketId = null) {
  console.log('--- updateInventory ---');
  console.log('Old Parts Input:', oldPartsInput);
  console.log('New Parts Input:', newPartsInput);

  try {
    let oldParts = [];
    let newParts = [];

    // Parse oldParts
    if (typeof oldPartsInput === 'string') {
      try {
        // Handle potential double serialization or empty strings
        if (oldPartsInput.trim() === '') {
            oldParts = [];
        } else {
            const parsed = JSON.parse(oldPartsInput);
            // If double serialized (string inside string), parse again
            oldParts = typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
        }
      } catch (e) { console.error('Error parsing old parts:', e); }
    } else if (Array.isArray(oldPartsInput)) {
      oldParts = oldPartsInput;
    }

    // Parse newParts
    if (typeof newPartsInput === 'string') {
      try {
         // Handle potential double serialization or empty strings
         if (newPartsInput.trim() === '') {
            newParts = [];
        } else {
            const parsed = JSON.parse(newPartsInput);
            newParts = typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
        }
      } catch (e) { console.error('Error parsing new parts:', e); }
    } else if (Array.isArray(newPartsInput)) {
      newParts = newPartsInput;
    }

    console.log('Parsed Old Parts:', oldParts);
    console.log('Parsed New Parts:', newParts);

    // Mapa para consolidar cambios por nombre de insumo
    const changes = {};

    // Restar lo que había antes (es como si devolviéramos todo al inventario temporalmente)
    if (Array.isArray(oldParts)) {
        oldParts.forEach(p => {
        if (p.nombre) {
            const name = p.nombre.trim().toLowerCase();
            changes[name] = (changes[name] || 0) + Number(p.cantidad || 0);
        }
        });
    }

    // Sumar lo nuevo (es lo que vamos a consumir finalmente)
    if (Array.isArray(newParts)) {
        newParts.forEach(p => {
        if (p.nombre) {
            const name = p.nombre.trim().toLowerCase();
            changes[name] = (changes[name] || 0) - Number(p.cantidad || 0);
        }
        });
    }

    console.log('Calculated Changes:', changes);

    // Aplicar cambios
    for (const [nombre, diff] of Object.entries(changes)) {
      if (diff === 0) continue;

      console.log(`Processing change for ${nombre}: ${diff}`);

      // Búsqueda insensible a mayúsculas/minúsculas para mayor robustez
      const insumo = await Insumo.findOne({ 
        where: sequelize.where(
          sequelize.fn('LOWER', sequelize.col('nombre')), 
          sequelize.fn('LOWER', nombre) // nombre is already lowercased from the loop key
        )
      });

      if (insumo) {
        console.log(`Found Insumo: ${insumo.nombre}, Current Qty: ${insumo.cantidad}`);
        const nuevaCantidad = insumo.cantidad + diff;
        const updates = { cantidad: nuevaCantidad };
        
        // Si diff es negativo, es una salida (uso en ticket)
        if (diff < 0) {
          updates.last_exit = new Date();
        } 
        // Si diff es positivo, es una entrada (devolución)
        else if (diff > 0) {
          updates.last_entry = new Date();
        }

        // Opcional: Validar que no sea negativo si estamos restando
        if (nuevaCantidad < 0) {
          console.warn(`Advertencia: Inventario insuficiente para ${nombre}. Stock actual: ${insumo.cantidad}, Requerido: ${Math.abs(diff)}`);
        }
        await insumo.update(updates);
        console.log(`Updated Insumo ${insumo.nombre} to Qty: ${nuevaCantidad}`);

        // Registrar movimiento en historial
        try {
          await InventoryMovement.create({
            insumo_id: insumo.id,
            user_id: userId,
            quantity: diff, // diff es negativo para salidas, positivo para entradas
            type: 'TICKET',
            reference_id: ticketId ? String(ticketId) : null,
            description: diff < 0 ? 'Uso en Ticket' : 'Devolución de Ticket'
          });
        } catch (logError) {
          console.error('Error logging inventory movement:', logError);
        }

      } else {
          console.log(`Insumo not found for name: ${nombre}`);
      }
    }
  } catch (error) {
    console.error('Error updating inventory:', error);
  }
}

const ticketController = {
  async getAllTickets(ctx) {
    try {
      const { page = 1, limit = 10, search, status, priority, serviceType } = ctx.query;
      const offset = (page - 1) * limit;
      
      const where = {};
      
      if (search) {
        where[Op.or] = [
          { ticket_number: { [Op.iLike]: `%${search}%` } },
          { title: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
          { diagnosis: { [Op.iLike]: `%${search}%` } },
          { solution: { [Op.iLike]: `%${search}%` } },
          { parts: { [Op.iLike]: `%${search}%` } },
          // Status, Priority, Service Type
          sequelize.where(sequelize.cast(sequelize.col('Ticket.status'), 'text'), { [Op.iLike]: `%${search}%` }),
          sequelize.where(sequelize.cast(sequelize.col('Ticket.priority'), 'text'), { [Op.iLike]: `%${search}%` }),
          sequelize.where(sequelize.cast(sequelize.col('Ticket.service_type'), 'text'), { [Op.iLike]: `%${search}%` }),
          // Reported By
          { '$reportedBy.nombre_completo$': { [Op.iLike]: `%${search}%` } },
          { '$reportedBy.usuario$': { [Op.iLike]: `%${search}%` } },
          { '$reportedBy.correo$': { [Op.iLike]: `%${search}%` } },
          // Assigned To
          { '$assignedTo.nombre_completo$': { [Op.iLike]: `%${search}%` } },
          { '$assignedTo.usuario$': { [Op.iLike]: `%${search}%` } },
          { '$assignedTo.correo$': { [Op.iLike]: `%${search}%` } },
          { '$patient.nombre_completo$': { [Op.iLike]: `%${search}%` } },
          { '$patient.correo$': { [Op.iLike]: `%${search}%` } },
          { '$patient.telefono$': { [Op.iLike]: `%${search}%` } },
          // Equipment
          { '$equipment.name$': { [Op.iLike]: `%${search}%` } },
          { '$equipment.serial_number$': { [Op.iLike]: `%${search}%` } },
          { '$equipment.inventory_number$': { [Op.iLike]: `%${search}%` } }
        ];
      }
      
      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (serviceType) where.service_type = serviceType;

      // Filter by user role: standard users and inventory only see their own tickets
      const user = ctx.state.user;
      const role = (user.rol || user.role || '').toLowerCase().trim();
      
      // Roles restringidos: usuario, user, inventario
      if (['usuario', 'user', 'inventario'].includes(role)) {
        where.reported_by_id = user.id;
      }

      const { count, rows } = await Ticket.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'reportedBy',
            attributes: ['id', 'nombre_completo', 'correo'],
            include: [
              { model: Department, as: 'department', attributes: ['display_name'] }
            ]
          },
          {
            model: User,
            as: 'assignedTo',
            attributes: ['id', 'nombre_completo', 'correo']
          },
          {
            model: Patient,
            as: 'patient',
            attributes: ['id', 'nombre_completo', 'correo', 'telefono']
          },
          {
            model: Equipment,
            as: 'equipment',
            attributes: ['id', 'name', 'serial_number', 'inventory_number']
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });

      ctx.body = { 
        success: true, 
        data: rows.map(t => (typeof t.toPublicJSON === 'function' ? t.toPublicJSON() : t.dataValues)),
        pagination: {
          total: count,
          page: parseInt(page),
          totalPages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      console.error('Error getting tickets:', error);
      ctx.status = 500;
      ctx.body = { success: false, message: 'Error al obtener tickets' };
    }
  },
  async getTicketById(ctx) {
    const ticket = await Ticket.findByPk(ctx.params.id, {
      include: [
        { 
          model: User, 
          as: 'reportedBy', 
          attributes: ['id', 'nombre_completo', 'correo'],
          include: [{ model: Department, as: 'department', attributes: ['display_name'] }]
        },
        { model: User, as: 'assignedTo', attributes: ['id', 'nombre_completo', 'correo'] },
        { model: Patient, as: 'patient', attributes: ['id', 'nombre_completo', 'correo', 'telefono'] },
        { model: Equipment, as: 'equipment', attributes: ['id', 'name', 'serial_number', 'inventory_number'] }
      ]
    });
    if (ticket) {
      // Check permissions
      const user = ctx.state.user;
      const role = (user.rol || user.role || '').toLowerCase().trim();
      
      // If restricted role, ensure they own the ticket
      if (['usuario', 'user', 'inventario'].includes(role)) {
        if (ticket.reported_by_id !== user.id) {
          ctx.status = 403;
          ctx.body = { success: false, message: 'Acceso denegado' };
          return;
        }
      }

      ctx.body = { success: true, data: typeof ticket.toPublicJSON === 'function' ? ticket.toPublicJSON() : ticket.dataValues };
    } else {
      ctx.status = 404;
      ctx.body = { success: false, message: 'Ticket no encontrado' };
    }
  },

  async createTicket(ctx) {
    try {
      console.log('Creating ticket with body:', JSON.stringify(ctx.request.body, null, 2));
      const {
        title,
        description,
        priority,
        serviceType,
        equipmentId,
        assignedToId,
        diagnosis,
        solution,
        timeSpent,
        partsUsed,
        insumosUsados, // Nuevo campo alternativo: [{ insumoId, cantidad }]
        reportedById, // Nuevo campo: ID del usuario que reporta (solo admin)
        patientId,
        scheduledFor
      } = ctx.request.body;

        // Normalización helper: quitar acentos, pasar a minúsculas y convertir espacios a guiones bajos
        const normalize = (s) => {
          if (typeof s !== 'string') return s;
          try {
            let out = s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            out = out.replace(/[^a-z0-9\s_]/g, '');
            out = out.trim().replace(/\s+/g, '_');
            return out;
          } catch (e) {
            return s;
          }
        };

      // Aceptar campo alternativo `insumosUsados` si viene desde el frontend
      let effectiveParts = partsUsed || insumosUsados;
      // Si viene como string, intentar parsear '[]' u otros JSON
      if (typeof effectiveParts === 'string') {
        try {
          effectiveParts = effectiveParts.trim() === '' ? [] : JSON.parse(effectiveParts);
        } catch (e) {
          // si no es JSON válido, dejar como array vacío para evitar fallos
          console.warn('partsUsed no es JSON válido, usando arreglo vacío', effectiveParts);
          effectiveParts = [];
        }
      }

      // Validar campos obligatorios (si faltan, intentar valores por defecto para evitar 400)
      if (!title || !description) {
        console.error('Ticket validation failed - missing fields', {
          title: !!title,
          description: !!description,
          priority: !!priority,
          serviceType: !!serviceType,
          rawBody: ctx.request.body
        });
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: 'Faltan campos obligatorios'
        };
        return;
      }

      // Si priority o serviceType faltan, aplicar defaults tolerantes
      const defaultPriority = 'sin_clasificar';
      const defaultServiceType = 'correctivo';
      const priorityValue = priority || defaultPriority;
      const serviceTypeValue = serviceType || defaultServiceType;

      // Validar valores permitidos para enums para evitar errores posteriores
      const allowedPriorities = ['sin_clasificar', 'baja', 'media', 'alta', 'critica'];
      const allowedServiceTypes = ['preventivo', 'correctivo', 'instalacion'];

      const normalizedPriority = normalize(priorityValue);
      const normalizedServiceType = normalize(serviceTypeValue);

      console.log('Normalized enums', { priority: normalizedPriority, serviceType: normalizedServiceType });

      if (!allowedPriorities.includes(normalizedPriority)) {
        console.error('Invalid priority value', { got: normalizedPriority, allowed: allowedPriorities });
        ctx.status = 400;
        ctx.body = { success: false, message: `Priority inválida. Valores permitidos: ${allowedPriorities.join(', ')}` };
        return;
      }

      if (!allowedServiceTypes.includes(normalizedServiceType)) {
        console.error('Invalid serviceType value', { got: normalizedServiceType, allowed: allowedServiceTypes });
        ctx.status = 400;
        ctx.body = { success: false, message: `ServiceType inválido. Valores permitidos: ${allowedServiceTypes.join(', ')}` };
        return;
      }

      const ticketNumber = await Ticket.generateTicketNumber();
      
      // Determinar quién reporta el ticket
      let finalReportedById = ctx.state.user.id;
      const userRole = (ctx.state.user.rol || ctx.state.user.role || '').toLowerCase().trim();
      
      if (userRole === 'admin' && reportedById) {
        finalReportedById = reportedById;
      }

        // Usar valores normalizados al guardar en la base para evitar discrepancias

        // Normalizar arrays para evitar strings tipo '[]'
        let safeParts = effectiveParts;
        if (typeof safeParts === 'string') {
          try {
            safeParts = safeParts.trim() === '' ? [] : JSON.parse(safeParts);
          } catch (e) { safeParts = []; }
        }
        let safeAttachments = [];
        if (ctx.request.body.attachments) {
          if (typeof ctx.request.body.attachments === 'string') {
            try {
              safeAttachments = ctx.request.body.attachments.trim() === '' ? [] : JSON.parse(ctx.request.body.attachments);
            } catch (e) { safeAttachments = []; }
          } else if (Array.isArray(ctx.request.body.attachments)) {
            safeAttachments = ctx.request.body.attachments;
          }
        }
        let safeTags = [];
        if (ctx.request.body.tags) {
          if (typeof ctx.request.body.tags === 'string') {
            try {
              safeTags = ctx.request.body.tags.trim() === '' ? [] : JSON.parse(ctx.request.body.tags);
            } catch (e) { safeTags = []; }
          } else if (Array.isArray(ctx.request.body.tags)) {
            safeTags = ctx.request.body.tags;
          }
        }

        // Defensive normalization: ensure final values are arrays and well-formed
        if (!Array.isArray(safeParts)) safeParts = [];
        if (!Array.isArray(safeAttachments)) safeAttachments = [];
        if (!Array.isArray(safeTags)) safeTags = [];

        // Normalize part items to objects with expected keys
        safeParts = safeParts.map(p => {
          if (!p || typeof p !== 'object') return null;
          return {
            insumoId: p.insumoId || p.id || p.insumo_id || null,
            nombre: p.nombre || p.name || null,
            cantidad: Number(p.cantidad) || Number(p.cant) || 0
          };
        }).filter(Boolean);

        // Log types and values for easier debugging (will appear in backend logs)
        console.log('Final arrays before Ticket.create', {
          partsType: typeof safeParts,
          parts: safeParts,
          attachmentsType: typeof safeAttachments,
          attachments: safeAttachments,
          tagsType: typeof safeTags,
          tags: safeTags
        });

        const payloadForCreate = {
          ticket_number: ticketNumber,
          title,
          description,
          priority: normalizedPriority,
          service_type: normalizedServiceType,
          equipment_id: equipmentId || null,
          assigned_to_id: assignedToId || null,
          reported_by_id: finalReportedById,
          patient_id: patientId || null,
          status: 'nuevo',
          diagnosis,
          solution,
          scheduled_for: scheduledFor || null,
          actual_hours: timeSpent,
          parts: safeParts || [],
          attachments: safeAttachments,
          tags: safeTags
        };

        console.log('Creating Ticket with payload:', JSON.stringify(payloadForCreate, null, 2));

        const ticket = await Ticket.create(payloadForCreate);

      // Procesar descuento de inventario para partes usadas (capturar errores internamente)
      if (effectiveParts) {
        try {
          await updateInventory(null, effectiveParts, finalReportedById, ticket.id);
        } catch (invError) {
          console.error('Error en updateInventory durante creación de ticket:', invError);
          // No fallar la creación del ticket por errores de inventario, pero avisar
        }
      }

      const ticketWithRelations = await Ticket.findByPk(ticket.id, {
        include: [
          { 
            model: User, 
            as: 'reportedBy', 
            attributes: ['id', 'nombre_completo', 'correo'],
            include: [{ model: Department, as: 'department', attributes: ['display_name'] }]
          },
          { 
            model: User, 
            as: 'assignedTo', 
            attributes: ['id', 'nombre_completo', 'correo'] 
          },
          {
            model: Patient,
            as: 'patient',
            attributes: ['id', 'nombre_completo', 'correo', 'telefono']
          },
          { 
            model: Equipment, 
            as: 'equipment', 
            attributes: ['id', 'name', 'serial_number', 'inventory_number'] 
          }
        ]
      });

      ctx.status = 201;
      ctx.body = {
        success: true,
        message: 'Ticket creado exitosamente',
        data: ticketWithRelations.toPublicJSON ? ticketWithRelations.toPublicJSON() : ticketWithRelations
      };

    } catch (error) {
      console.error('--- DETAILED TICKET CREATION ERROR ---');
      console.error('Full Error Object:', error);
      console.error('--- END DETAILED TICKET CREATION ERROR ---');
      try {
        console.error('Request body at error time:', JSON.stringify(ctx.request.body, null, 2));
      } catch (e) {
        console.error('Could not stringify request body:', e);
      }
      ctx.status = 500;
      ctx.body = { success: false, message: 'Error al crear ticket', error: error.message };
    }
  },

  async updateTicket(ctx) {
    try {
      const { id } = ctx.params;
      const {
        title,
        description,
        priority,
        status,
        serviceType,
        equipmentId,
        assignedToId,
        diagnosis,
        solution,
        timeSpent,
        partsUsed,
        attachments,
        tags,
        reportedById,
        notes,
        patientId,
        scheduledFor
      } = ctx.request.body;

      const ticket = await Ticket.findByPk(id);
      if (!ticket) {
        ctx.status = 404;
        ctx.body = { success: false, message: 'Ticket no encontrado' };
        return;
      }

      // Check permissions
      const user = ctx.state.user;
      const role = (user.rol || user.role || '').toLowerCase().trim();
      
      // If restricted role, ensure they own the ticket
      if (['usuario', 'user', 'inventario'].includes(role)) {
        if (ticket.reported_by_id !== user.id) {
          ctx.status = 403;
          ctx.body = { success: false, message: 'Acceso denegado' };
          return;
        }
      }

      const updates = {};
      if (title) updates.title = title;
      if (description) updates.description = description;
      if (priority) updates.priority = priority;
      if (status) updates.status = status;
      if (serviceType) updates.service_type = serviceType;
      if (equipmentId) updates.equipment_id = equipmentId;
      if (assignedToId) updates.assigned_to_id = assignedToId;
      if (diagnosis) updates.diagnosis = diagnosis;
      if (solution) updates.solution = solution;
      if (timeSpent) updates.actual_hours = timeSpent;
      
      if (notes !== undefined) updates.notes = notes;
      
      // Permitir cambiar el usuario que reporta si es admin
      if (role === 'admin' && reportedById) {
        updates.reported_by_id = reportedById;
      }

      if (patientId !== undefined) updates.patient_id = patientId || null;
      if (scheduledFor !== undefined) updates.scheduled_for = scheduledFor || null;

      if (partsUsed !== undefined) {
        updates.parts = partsUsed;
      }

      if (attachments !== undefined) {
        updates.attachments = attachments;
      }

      if (tags !== undefined) {
        updates.tags = tags;
      }

      if (status === 'resuelto' && ticket.status !== 'resuelto') {
        updates.resolved_at = new Date();
      }

      // Actualizar inventario si cambiaron las partes
      // Eliminamos la comprobación estricta (partsUsed !== ticket.parts) para evitar problemas con formatos de string/JSON
      if (partsUsed !== undefined) {
        await updateInventory(ticket.parts, partsUsed, user.id, ticket.id);
      }

      await ticket.update(updates);

      const updatedTicket = await Ticket.findByPk(id, {
        include: [
          { 
            model: User, 
            as: 'reportedBy', 
            attributes: ['id', 'nombre_completo', 'correo'],
            include: [{ model: Department, as: 'department', attributes: ['display_name'] }]
          },
          { model: User, as: 'assignedTo', attributes: ['id', 'nombre_completo', 'correo'] },
          { model: Patient, as: 'patient', attributes: ['id', 'nombre_completo', 'correo', 'telefono'] },
          { model: Equipment, as: 'equipment', attributes: ['id', 'name', 'serial_number'] }
        ]
      });

      ctx.body = {
        success: true,
        message: 'Ticket actualizado exitosamente',
        data: updatedTicket.toPublicJSON ? updatedTicket.toPublicJSON() : updatedTicket
      };

    } catch (error) {
      console.error('Error updating ticket:', error);
      ctx.status = 500;
      ctx.body = { success: false, message: 'Error al actualizar ticket' };
    }
  },

  async getDeletedTickets(ctx) {
    try {
      const deletedTickets = await DeletedTicket.findAll({
        include: [
          { model: User, as: 'deletedBy', attributes: ['id', ['nombre_completo', 'fullName']] }
        ],
        order: [['deleted_at', 'DESC']]
      });
      ctx.body = { success: true, data: deletedTickets };
    } catch (error) {
      console.error('Error getting deleted tickets:', error);
      ctx.status = 500;
      ctx.body = { success: false, message: 'Error al obtener tickets eliminados' };
    }
  },

  async deleteTicket(ctx) {
    try {
      const { id } = ctx.params;
      const { justification } = ctx.request.body;

      if (!justification) {
        ctx.status = 400;
        ctx.body = { success: false, message: 'Se requiere una justificación para eliminar el ticket.' };
        return;
      }

      const ticket = await Ticket.findByPk(id);
      
      if (!ticket) {
        ctx.status = 404;
        ctx.body = { success: false, message: 'Ticket no encontrado' };
        return;
      }

      // Check permissions
      const user = ctx.state.user;
      const role = (user.rol || user.role || '').toLowerCase().trim();
      
      // If restricted role, ensure they own the ticket
      if (['usuario', 'user', 'inventario'].includes(role)) {
        if (ticket.reported_by_id !== user.id) {
          ctx.status = 403;
          ctx.body = { success: false, message: 'Acceso denegado' };
          return;
        }
      }

      // Guardar en histórico de eliminados
      await DeletedTicket.create({
        ticket_number: ticket.ticket_number,
        title: ticket.title,
        description: ticket.description,
        justification: justification,
        deleted_by_id: user.id,
        original_created_at: ticket.createdAt
      });

      // Eliminar comentarios asociados antes de eliminar el ticket
      await TicketComment.destroy({
        where: { ticket_id: id }
      });

      await ticket.destroy();

      ctx.body = { success: true, message: 'Ticket eliminado exitosamente' };
    } catch (error) {
      console.error('Error deleting ticket:', error);
      ctx.status = 500;
      ctx.body = { success: false, message: 'Error al eliminar ticket' };
    }
  },

  async getPatientAppointments(ctx) {
    try {
      const { email = '', phone = '' } = ctx.query;

      if (!email || !phone) {
        ctx.status = 400;
        ctx.body = { success: false, message: 'Correo y teléfono son requeridos' };
        return;
      }

      const patient = await Patient.findOne({
        where: {
          correo: { [Op.iLike]: email.trim() },
          telefono: { [Op.iLike]: phone.trim() }
        }
      });

      if (!patient) {
        ctx.body = { success: true, data: [] };
        return;
      }

      const appointments = await Ticket.findAll({
        where: { patient_id: patient.id },
        include: [
          { model: Patient, as: 'patient', attributes: ['id', 'nombre_completo', 'correo', 'telefono'] },
          { model: User, as: 'assignedTo', attributes: ['id', 'nombre_completo', 'correo'] }
        ],
        order: [['scheduled_for', 'ASC'], ['createdAt', 'DESC']]
      });

      ctx.body = {
        success: true,
        data: appointments.map(appointment => appointment.toPublicJSON())
      };
    } catch (error) {
      console.error('Error getting patient appointments:', error);
      ctx.status = 500;
      ctx.body = { success: false, message: 'Error al consultar citas' };
    }
  },

  async createPatientAppointment(ctx) {
    try {
      const {
        fullName,
        email,
        phone,
        description,
        scheduledFor,
        title
      } = ctx.request.body;

      if (!fullName || !email || !phone || !scheduledFor) {
        ctx.status = 400;
        ctx.body = { success: false, message: 'Nombre, correo, teléfono y fecha son requeridos' };
        return;
      }

      let patient = await Patient.findOne({
        where: {
          [Op.or]: [
            { correo: email.trim().toLowerCase() },
            { telefono: phone.trim() }
          ]
        }
      });

      if (!patient) {
        patient = await Patient.create({
          nombre_completo: fullName.trim(),
          correo: email.trim().toLowerCase(),
          telefono: phone.trim(),
          activo: true
        });
      } else {
        await patient.update({
          nombre_completo: fullName.trim(),
          correo: email.trim().toLowerCase(),
          telefono: phone.trim()
        });
      }

      const adminUser = await User.findOne({
        where: {
          rol: { [Op.iLike]: 'admin' },
          activo: true
        },
        order: [['createdAt', 'ASC']]
      });

      if (!adminUser) {
        ctx.status = 500;
        ctx.body = { success: false, message: 'No hay usuario administrador disponible para registrar la cita' };
        return;
      }

      const appointment = await Ticket.create({
        ticket_number: await Ticket.generateTicketNumber(),
        title: title || 'Consulta dental',
        description: description || 'Solicitud de cita desde portal de pacientes',
        priority: 'media',
        service_type: 'preventivo',
        reported_by_id: adminUser.id,
        patient_id: patient.id,
        scheduled_for: scheduledFor,
        status: 'pendiente'
      });

      const appointmentWithRelations = await Ticket.findByPk(appointment.id, {
        include: [
          { model: Patient, as: 'patient', attributes: ['id', 'nombre_completo', 'correo', 'telefono'] },
          { model: User, as: 'assignedTo', attributes: ['id', 'nombre_completo', 'correo'] }
        ]
      });

      ctx.status = 201;
      ctx.body = {
        success: true,
        message: 'Cita solicitada exitosamente',
        data: appointmentWithRelations.toPublicJSON()
      };
    } catch (error) {
      console.error('Error creating patient appointment:', error);
      ctx.status = 500;
      ctx.body = { success: false, message: 'Error al solicitar la cita' };
    }
  }
};

export default ticketController;

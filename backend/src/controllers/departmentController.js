import { Department } from '../models/index.js';

class DepartmentController {
  async getAll(ctx) {
    try {
      const departments = await Department.findAll({ 
        order: [['display_name', 'ASC']] 
      });
      ctx.status = 200;
      ctx.body = { success: true, data: departments };
    } catch (error) {
      console.error('Error getting departments:', error);
      ctx.status = 500;
      ctx.body = { success: false, message: 'Error al obtener departamentos' };
    }
  }

  async getById(ctx) {
    try {
      const { id } = ctx.params;
      const department = await Department.findByPk(id);
      
      if (!department) {
        ctx.status = 404;
        ctx.body = { success: false, message: 'Departamento no encontrado' };
        return;
      }

      ctx.status = 200;
      ctx.body = { success: true, data: department };
    } catch (error) {
      console.error('Error getting department by id:', error);
      ctx.status = 500;
      ctx.body = { success: false, message: 'Error al obtener el departamento' };
    }
  }

  async create(ctx) {
    try {
      const { display_name, description, price, is_active } = ctx.request.body;
      
      if (!display_name) {
        ctx.status = 400;
        ctx.body = { success: false, message: 'El nombre del departamento es requerido' };
        return;
      }

      const department = await Department.create({
        display_name,
        description: description || null,
        price: price !== undefined && price !== '' ? Number(price) : null,
        is_active: is_active !== undefined ? is_active : true
      });

      ctx.status = 201;
      ctx.body = { success: true, data: department };
    } catch (error) {
      console.error('Error creating department:', error);
      ctx.status = 500;
      ctx.body = { success: false, message: 'Error al crear el departamento' };
    }
  }

  async update(ctx) {
    try {
      const { id } = ctx.params;
      const { display_name, description, price, is_active } = ctx.request.body;
      
      const department = await Department.findByPk(id);
      
      if (!department) {
        ctx.status = 404;
        ctx.body = { success: false, message: 'Departamento no encontrado' };
        return;
      }

      await department.update({
        display_name: display_name || department.display_name,
        description: description !== undefined ? description : department.description,
        price: price !== undefined ? (price === '' ? null : Number(price)) : department.price,
        is_active: is_active !== undefined ? is_active : department.is_active
      });

      ctx.status = 200;
      ctx.body = { success: true, data: department };
    } catch (error) {
      console.error('Error updating department:', error);
      ctx.status = 500;
      ctx.body = { success: false, message: 'Error al actualizar el departamento' };
    }
  }

  async delete(ctx) {
    try {
      const { id } = ctx.params;
      const department = await Department.findByPk(id);
      
      if (!department) {
        ctx.status = 404;
        ctx.body = { success: false, message: 'Departamento no encontrado' };
        return;
      }

      // Check if department is in use (optional, but good practice)
      // For now, just delete it
      await department.destroy();

      ctx.status = 200;
      ctx.body = { success: true, message: 'Departamento eliminado correctamente' };
    } catch (error) {
      console.error('Error deleting department:', error);
      ctx.status = 500;
      ctx.body = { success: false, message: 'Error al eliminar el departamento' };
    }
  }
}

export default new DepartmentController();

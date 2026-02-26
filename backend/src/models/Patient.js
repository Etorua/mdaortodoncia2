import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Patient extends Model {
  // Aquí podemos agregar métodos específicos para pacientes si se necesitan
}

Patient.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  // Cambiamos 'usuario' por 'expediente' o algo similar, pero mantenemos compatibilidad por ahora
  // Usaremos la estructura básica de usuario pero adaptada
  nombre_completo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  correo: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true // Correo puede ser opcional pero único si existe
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
  timestamps: true,
});

export default Patient;
      username: usuario,
      email: correo,
      fullName: nombre_completo,
      employeeNumber: numero_empleado,
      role: unifiedRole,
      department: String(departmentName || 'Sin Departamento'),
      departmentId: department_id,
      isActive: activo,
      createdAt: createdAt || (created_at ? new Date(created_at).toISOString() : undefined),
      updatedAt: updatedAt || (updated_at ? new Date(updated_at).toISOString() : undefined),
      permissions: userPermissions,
      permissionCount: userPermissions.length,
      ...rest
    };
  }

  // Asociaciones estáticas (definidas arriba)
}

// Definir el modelo
User.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  numero_empleado: {
    type: DataTypes.STRING(20),
    allowNull: true, // Cambiado a true para hacerlo opcional
    unique: true,
    validate: {
      // La validación notEmpty se elimina o se maneja en la lógica de negocio si es necesario
    }
  },
  usuario: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [3, 50]
    }
  },
  correo: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  contrasena: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [6, 255]
    }
  },
  dependencia: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  departamento: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  rol: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  cargo: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  department_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'departments',
      key: 'id'
    }
  },
  area: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  creado_por: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  nombre_completo: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  ultimo_acceso: {
    type: DataTypes.DATE,
    allowNull: true
  },
  foto_perfil: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
    hooks: {
      beforeCreate: async (user) => {
        if (user.rol) {
          user.rol = user.rol.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        }
        if (user.correo) {
          user.correo = user.correo.toLowerCase().trim();
        }
        if (user.contrasena) {
          await user.setContrasena(user.contrasena);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('rol') && user.rol) {
          user.rol = user.rol.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        }
        if (user.changed('correo') && user.correo) {
          user.correo = user.correo.toLowerCase().trim();
        }
        if (user.changed('contrasena')) {
          await user.setContrasena(user.contrasena);
        }
      }
    },
    indexes: [
    {
      unique: true,
      fields: ['usuario']
    },
    {
      unique: true,
      fields: ['correo']
    },
    {
      unique: true,
      fields: ['numero_empleado']
    },
    {
      fields: ['rol']
    },
    {
      fields: ['dependencia']
    },
    {
      fields: ['activo']
    }
  ]
});

export default User;
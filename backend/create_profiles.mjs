import { User, ClinicalModuleRecord, sequelize } from './src/models/index.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

async function createProfiles() {
  console.log('--- Creando perfiles de usuario para MDA ORTODONCIA ---');
  try {
    const usersToCreate = [
      {
        nombre_completo: 'Dra. Maria de los Angeles Lopez Galaz',
        correo: 'orto.angeles@gmail.com',
        contrasena: 'angeles123',
        rol: 'doctor',
        usuario: 'dra_angeles'
      },
      {
        nombre_completo: 'Esthefania Galaz',
        correo: 'esthefania.g@gmail.com',
        contrasena: 'Esthefania123',
        rol: 'usuario', // Rol para recepcionista/asistente
        usuario: 'esthefania_g'
      },
      {
        nombre_completo: 'Erick Francisco Torua Campa',
        correo: 'eftcampa@gmail.com',
        contrasena: 'Erick123',
        rol: 'admin',
        usuario: 'erick_admin'
      }
    ];

    for (const userData of usersToCreate) {
      // Verificar si ya existe
      const existing = await User.findOne({ where: { correo: userData.correo } });
      
      if (!existing) {
        const hashedPassword = await bcrypt.hash(userData.contrasena, 10);
        // Generar un número de empleado aleatorio para cumplir con la restricción de No Nulo
        const numEmpleado = 'EMP-' + Math.floor(1000 + Math.random() * 9000);
        
        await User.create({
          id: uuidv4(),
          numero_empleado: numEmpleado,
          nombre_completo: userData.nombre_completo,
          correo: userData.correo,
          contrasena: hashedPassword,
          rol: userData.rol,
          usuario: userData.usuario,
          activo: true
        });
        console.log(`Usuario creado: ${userData.nombre_completo} (${userData.rol})`);
      } else {
        console.log(`El usuario ${userData.correo} ya existe.`);
      }
    }

    // Crear registro en el módulo de Doctores para la Dra. Angeles
    const doctorRecord = await ClinicalModuleRecord.findOne({ 
      where: { module_key: 'doctores' } 
    });
    
    // Verificamos por nombre dentro del JSONB si es posible, o simplemente creamos si no hay doctores
    if (!doctorRecord) {
      await ClinicalModuleRecord.create({
        id: uuidv4(),
        module_key: 'doctores',
        data: {
          nombre: 'Dra. Maria de los Angeles Lopez Galaz',
          especialidad: 'Ortodoncia',
          cedulaProf: '12486920',
          usuarioSistema: 'orto.angeles@gmail.com'
        },
        is_active: true
      });
      console.log('Registro de Doctora creado en el módulo clínico.');
    }

    console.log('--- Proceso de creación de perfiles completado ---');
    process.exit(0);
  } catch (error) {
    console.error('Error al crear perfiles:', error);
    process.exit(1);
  }
}

createProfiles();

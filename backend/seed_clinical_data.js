import { sequelize } from './src/config/database.js';
import ClinicalModuleRecord from './src/models/ClinicalModuleRecord.js';
import Patient from './src/models/Patient.js';

async function seedClinicalData() {
  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida correctamente.');

    // 1. Crear Pacientes
    console.log('Creando pacientes...');
    const patients = await Patient.bulkCreate([
      {
        nombre_completo: 'Juan Pérez García',
        correo: 'juan.perez.test@example.com',
        telefono: '5551234567',
        direccion: 'Calle Falsa 123, CDMX',
        genero: 'Masculino',
        activo: true
      },
      {
        nombre_completo: 'María López Hernández',
        correo: 'maria.lopez.test@example.com',
        telefono: '5559876543',
        direccion: 'Av. Siempre Viva 742, CDMX',
        genero: 'Femenino',
        activo: true
      }
    ], { ignoreDuplicates: true });

    const [p1, p2] = await Patient.findAll({
        where: {
            correo: ['juan.perez.test@example.com', 'maria.lopez.test@example.com']
        }
    });

    console.log(`Pacientes listos: ${p1.nombre_completo}, ${p2.nombre_completo}`);

    // 2. Crear Tratamientos (module_key: 'tratamientos')
    console.log('Creando tratamientos...');
    await ClinicalModuleRecord.bulkCreate([
      {
        module_key: 'tratamientos',
        data: {
          tratamiento: 'Limpieza Dental Profunda',
          descripcion: 'Limpieza con ultrasonido y pulido coronario.',
          costoBase: 800
        }
      },
      {
        module_key: 'tratamientos',
        data: {
          tratamiento: 'Ortodoncia Metálica',
          descripcion: 'Tratamiento correctivo con brackets metálicos MDA.',
          costoBase: 15000
        }
      }
    ]);

    // 3. Crear Historial Clínico (module_key: 'historial-clinico')
    console.log('Creando historial clínico...');
    await ClinicalModuleRecord.bulkCreate([
      {
        module_key: 'historial-clinico',
        data: {
          fechaRegistro: '2026-04-20',
          nombrePaciente: p1.id,
          fechaNacimiento: '1990-05-15',
          edad: 35,
          estadoCivil: 'Soltero',
          ocupacion: 'Ingeniero',
          direccion: 'Calle Falsa 123',
          telefono: '5551234567',
          motivoConsulta: 'Dolor en muela del juicio',
          osteoporosis: false,
          fiebreReumatica: false,
          artritis: false,
          hemofilia: false,
          asma: false,
          vih: false,
          epilepsia: false,
          hepatitis: false,
          cancer: false,
          presionAltaBaja: false,
          diabetes: false,
          alergias: 'Ninguna',
          medicamentoActual: 'Ninguno'
        }
      },
      {
        module_key: 'historial-clinico',
        data: {
          fechaRegistro: '2026-04-20',
          nombrePaciente: p2.id,
          fechaNacimiento: '1988-10-25',
          edad: 37,
          estadoCivil: 'Casada',
          ocupacion: 'Doctora',
          direccion: 'Av. Siempre Viva 742',
          telefono: '5559876543',
          motivoConsulta: 'Revisión anual',
          osteoporosis: false,
          fiebreReumatica: false,
          artritis: false,
          hemofilia: false,
          asma: true,
          vih: false,
          epilepsia: false,
          hepatitis: false,
          cancer: false,
          presionAltaBaja: true,
          diabetes: false,
          alergias: 'Polen',
          medicamentoActual: 'Salbutamol'
        }
      }
    ]);

    // 4. Crear Historial Odontograma (module_key: 'historial-odontograma')
    console.log('Creando odontogramas...');
    await ClinicalModuleRecord.bulkCreate([
      {
        module_key: 'historial-odontograma',
        data: {
          paciente: p1.id,
          fechaRegistro: '2026-04-20',
          detalleOdontograma: 'Caries en pieza 16 y 17. Necesita resinas.'
        }
      },
      {
        module_key: 'historial-odontograma',
        data: {
          paciente: p2.id,
          fechaRegistro: '2026-04-20',
          detalleOdontograma: 'Todo en orden, ligera placa bacteriana en inferiores.'
        }
      }
    ]);

    // 5. Crear Recetas (module_key: 'recetas-medicas')
    // Nota: El usuario pidió 'recetas', pero el clinicalModuleDefinitions usa 'recetas-medicas' como key.
    console.log('Creando recetas...');
    await ClinicalModuleRecord.bulkCreate([
      {
        module_key: 'recetas-medicas',
        data: {
          fecha: '2026-04-20',
          nombrePaciente: p1.id,
          doctor: 'Dr. Armando Casas',
          diagnostico: 'Infección dental leve',
          medicamentos: 'Amoxicilina 500mg cada 8 horas por 7 días.',
          indicaciones: 'Tomar con alimentos.'
        }
      },
      {
        module_key: 'recetas-medicas',
        data: {
          fecha: '2026-04-20',
          nombrePaciente: p2.id,
          doctor: 'Dra. Elsa Pato',
          diagnostico: 'Inflamación de encías',
          medicamentos: 'Ibuprofeno 400mg cada 12 horas por 3 días.',
          indicaciones: 'Realizar enjuagues con clorhexidina.'
        }
      }
    ]);

    // 6. Crear Evolución Ortodoncia (module_key: 'evolucion-pagos' o similar)
    // El usuario pidió 'evolucion-ortodoncia', verificando en definitions: 'evolucion-pagos' parece ser el que tiene "Nota de Evolución".
    console.log('Creando evolución y pagos...');
    await ClinicalModuleRecord.bulkCreate([
      {
        module_key: 'evolucion-pagos',
        data: {
          nombrePaciente: p1.id,
          aparatologia: 'Brackets Metálicos',
          fechaCita: '2026-04-20',
          notaEvolucion: 'Cambio de arcos superiores, ajuste de ligas.',
          abono: 500,
          saldo: 14500,
          cargoExtra: 'Ninguno'
        }
      },
      {
        module_key: 'evolucion-pagos',
        data: {
          nombrePaciente: p2.id,
          aparatologia: 'Invisalign',
          fechaCita: '2026-04-20',
          notaEvolucion: 'Entrega de nuevos alineadores (etapa 4 de 20).',
          abono: 2000,
          saldo: 35000,
          cargoExtra: 'Reposición de atache'
        }
      }
    ]);

    console.log('¡Todos los datos de ejemplo han sido insertados exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('Error al insertar datos de ejemplo:', error);
    process.exit(1);
  }
}

seedClinicalData();

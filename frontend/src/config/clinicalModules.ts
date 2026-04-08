import type { PermissionModule } from '@/types';

export type ClinicalFieldType = 'text' | 'textarea' | 'date' | 'time' | 'number' | 'email';
export type ClinicalFieldReference = 'patients' | 'doctors';

export interface ClinicalModuleField {
  key: string;
  label: string;
  type?: ClinicalFieldType;
  reference?: ClinicalFieldReference;
}

export interface ClinicalModuleDefinition {
  key: string;
  path: string;
  label: string;
  description: string;
  permissionModule: PermissionModule;
  fields: ClinicalModuleField[];
}

export const clinicalModuleDefinitions: ClinicalModuleDefinition[] = [
  {
    key: 'doctores',
    path: '/modulos/doctores',
    label: 'Doctores',
    description: 'Administra el catálogo de doctores del consultorio.',
    permissionModule: 'doctores',
    fields: [
      { key: 'idDentista', label: 'ID_Dentista' },
      { key: 'nombre', label: 'Nombre' },
      { key: 'especialidad', label: 'Especialidad' },
      { key: 'cedulaProf', label: 'Cédula_Prof' },
      { key: 'usuarioSistema', label: 'Usuario_Sistema' }
    ]
  },
  {
    key: 'historial-clinico',
    path: '/modulos/historial-clinico',
    label: 'Historial Clínico',
    description: 'Registra la información clínica general de los pacientes.',
    permissionModule: 'historial-clinico',
    fields: [
      { key: 'nombrePaciente', label: 'Nombre del Paciente', reference: 'patients' },
      { key: 'edad', label: 'Edad', type: 'number' },
      { key: 'sexo', label: 'Sexo' },
      { key: 'nacionalidad', label: 'Nacionalidad' },
      { key: 'escolaridad', label: 'Escolaridad' },
      { key: 'estadoCivil', label: 'Estado civil' },
      { key: 'domicilio', label: 'Domicilio', type: 'textarea' },
      { key: 'lugarOrigen', label: 'Lugar de Origen' },
      { key: 'habitosHigiene', label: 'Habitos de higiene', type: 'textarea' },
      { key: 'alcoholismo', label: 'Alcoholismo' },
      { key: 'tabaquismo', label: 'Tabaquismo' }
    ]
  },
  {
    key: 'consentimiento-informado',
    path: '/modulos/consentimiento-informado',
    label: 'Consetimiento Informado',
    description: 'Documenta consentimientos y aceptación de riesgos del paciente.',
    permissionModule: 'consentimiento-informado',
    fields: [
      { key: 'fecha', label: 'Fecha', type: 'date' },
      { key: 'nombrePaciente', label: 'Nombre del Paciente', reference: 'patients' },
      { key: 'procedimiento', label: 'Procedimiento' },
      { key: 'odontologo', label: 'Odontólogo', reference: 'doctors' },
      { key: 'riesgosExplicados', label: 'Riesgos Explicados', type: 'textarea' },
      { key: 'tratamiento', label: 'Tratamiento' },
      { key: 'descripcion', label: 'Descripción', type: 'textarea' },
      { key: 'riesgosComunes', label: 'Riesgos Comunes', type: 'textarea' },
      { key: 'alternativas', label: 'Alternativas', type: 'textarea' },
      { key: 'firmo', label: '¿Firmó?' },
      { key: 'linkPdfFoto', label: 'Link al PDF/Foto' }
    ]
  },
  {
    key: 'justificantes',
    path: '/modulos/justificantes',
    label: 'Justificante',
    description: 'Genera y administra justificantes emitidos por el consultorio.',
    permissionModule: 'justificantes',
    fields: [
      { key: 'nombreConsultorioDental', label: 'Nombre de consultorio dental' },
      { key: 'logotipo', label: 'Logotipo' },
      { key: 'nombreDoctor', label: 'Nombre del doctor', reference: 'doctors' },
      { key: 'cedulaProfesional', label: 'Cedula Profesional' },
      { key: 'horaAtencion', label: 'Hora de atencion', type: 'time' },
      { key: 'motivo', label: 'Motivo', type: 'textarea' },
      { key: 'recomendacionReposo', label: 'Recomendacion de reposo', type: 'textarea' },
      { key: 'fechaReincorporacion', label: 'Fecha reincorporacion', type: 'date' },
      { key: 'lugarExpedicion', label: 'Lugar de expedicion' },
      { key: 'firma', label: 'Firma' }
    ]
  },
  {
    key: 'tratamientos',
    path: '/modulos/tratamientos',
    label: 'Tratamientos',
    description: 'Mantiene el catálogo clínico de tratamientos disponibles.',
    permissionModule: 'tratamientos',
    fields: [
      { key: 'tratamiento', label: 'Tratamiento' },
      { key: 'descripcion', label: 'Descripción', type: 'textarea' },
      { key: 'riesgosEspecificos', label: 'Riesgos Específicos', type: 'textarea' },
      { key: 'alternativas', label: 'Alternativas', type: 'textarea' }
    ]
  },
  {
    key: 'historial-odontograma',
    path: '/modulos/historial-odontograma',
    label: 'Historial Odontograma',
    description: 'Conserva anotaciones de odontograma siguiendo el estilo actual del sistema.',
    permissionModule: 'historial-odontograma',
    fields: [
      { key: 'paciente', label: 'Paciente', reference: 'patients' },
      { key: 'fechaRegistro', label: 'Fecha de Registro', type: 'date' },
      { key: 'detalleOdontograma', label: 'Detalle Odontograma', type: 'textarea' }
    ]
  },
  {
    key: 'agenda-citas',
    path: '/modulos/agenda-citas',
    label: 'Agenda de Citas',
    description: 'Administra la agenda operativa de citas del consultorio.',
    permissionModule: 'agenda-citas',
    fields: [
      { key: 'hora', label: 'Hora', type: 'time' },
      { key: 'paciente', label: 'Paciente', reference: 'patients' },
      { key: 'telefono', label: 'Teléfono' },
      { key: 'tratamiento', label: 'Tratamiento' },
      { key: 'doctorEspecialista', label: 'Doctor/Especialista', reference: 'doctors' },
      { key: 'estado', label: 'Estado' },
      { key: 'observaciones', label: 'Observaciones', type: 'textarea' },
      { key: 'pacienteSeguimiento', label: 'Paciente', reference: 'patients' },
      { key: 'ultimaCita', label: 'Última Cita', type: 'date' },
      { key: 'motivo', label: 'Motivo', type: 'textarea' },
      { key: 'proximaCita', label: 'Próxima Cita', type: 'date' },
      { key: 'notas', label: 'Notas', type: 'textarea' }
    ]
  },
  {
    key: 'centros-medicos',
    path: '/modulos/centros-medicos',
    label: 'Centro Medicos',
    description: 'Registra sedes o consultorios vinculados a la operación clínica.',
    permissionModule: 'centros-medicos',
    fields: [
      { key: 'direccionConsultorioDental', label: 'Direccion del Consultorio dental', type: 'textarea' }
    ]
  },
  {
    key: 'reportes-financieros',
    path: '/modulos/reportes-financieros',
    label: 'Reportes Financieros',
    description: 'Controla movimientos y reportes financieros del consultorio.',
    permissionModule: 'reportes-financieros',
    fields: [
      { key: 'fecha', label: 'Fecha', type: 'date' },
      { key: 'concepto', label: 'Concepto' },
      { key: 'categoria', label: 'Categoría' },
      { key: 'ingreso', label: 'Ingreso (+)', type: 'number' },
      { key: 'egreso', label: 'Egreso (-)', type: 'number' },
      { key: 'metodoPago', label: 'Método de Pago' }
    ]
  },
  {
    key: 'pacientes-adeudos',
    path: '/modulos/pacientes-adeudos',
    label: 'Pacientes con Adeudos',
    description: 'Da seguimiento a saldos pendientes por paciente.',
    permissionModule: 'pacientes-adeudos',
    fields: [
      { key: 'nombrePaciente', label: 'Nombre del Paciente', reference: 'patients' },
      { key: 'tratamientoTotal', label: 'Tratamiento Total', type: 'number' },
      { key: 'pagadoFecha', label: 'Pagado a la fecha', type: 'number' },
      { key: 'saldoPendiente', label: 'Saldo Pendiente', type: 'number' },
      { key: 'ultimoPago', label: 'Último Pago', type: 'date' }
    ]
  },
  {
    key: 'recetas-medicas',
    path: '/modulos/recetas-medicas',
    label: 'Recetas Medicas',
    description: 'Gestiona las recetas médicas generadas para pacientes.',
    permissionModule: 'recetas-medicas',
    fields: [
      { key: 'nombrePaciente', label: 'Nombre del Paciente', reference: 'patients' },
      { key: 'tratamiento', label: 'Tratamiento' },
      { key: 'recomendacionReposo', label: 'Recomendacion de reposo', type: 'textarea' },
      { key: 'medicamentos', label: 'Medicamentos', type: 'textarea' },
      { key: 'horarioTomaMedicamentos', label: 'Horario de toma de medicamentos', type: 'textarea' }
    ]
  }
];

export const clinicalModuleMap = Object.fromEntries(
  clinicalModuleDefinitions.map(definition => [definition.key, definition])
) as Record<string, ClinicalModuleDefinition>;
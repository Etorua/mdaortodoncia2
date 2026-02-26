const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function run() {
  try {
    await client.connect();
    console.log('Conectado a la base de datos.');

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.patients
      (
          id uuid NOT NULL DEFAULT gen_random_uuid(),
          nombre_completo character varying(255) COLLATE pg_catalog."default" NOT NULL,
          correo character varying(255) COLLATE pg_catalog."default",
          telefono character varying(255) COLLATE pg_catalog."default",
          direccion character varying(255) COLLATE pg_catalog."default",
          fecha_nacimiento timestamp with time zone,
          genero character varying(255) COLLATE pg_catalog."default",
          antecedentes text COLLATE pg_catalog."default",
          activo boolean DEFAULT true,
          created_at timestamp with time zone NOT NULL,
          updated_at timestamp with time zone NOT NULL,
          CONSTRAINT patients_pkey PRIMARY KEY (id),
          CONSTRAINT patients_correo_key UNIQUE (correo)
      );
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS patients_nombre_completo_idx
          ON public.patients USING btree
          (nombre_completo COLLATE pg_catalog."default" ASC NULLS LAST);
    `);

    console.log('Tabla patients creada manualmente con éxito.');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();

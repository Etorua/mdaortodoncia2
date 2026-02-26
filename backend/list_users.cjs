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
    
    // Buscar usuarios admin
    const res = await client.query("SELECT id, usuario, correo, rol, 'Hasheada (oculta)' as contrasena FROM users WHERE rol = 'admin' OR rol = 'Admin' LIMIT 5");
    
    if (res.rows.length === 0) {
        console.log('No se encontraron usuarios administradores. Buscando cualquier usuario...');
        const resAny = await client.query("SELECT id, usuario, correo, rol FROM users LIMIT 5");
        console.table(resAny.rows);
    } else {
        console.log('Usuarios Admin encontrados:');
        console.table(res.rows);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();

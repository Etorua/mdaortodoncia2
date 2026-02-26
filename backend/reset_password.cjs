const { Client } = require('pg');
const bcrypt = require('bcryptjs');
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

    const newPassword = 'admin'; // Contraseña súper simple
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const email = 'admin@sedesson.gob.mx';

    const res = await client.query(
      "UPDATE users SET contrasena = $1 WHERE correo = $2 RETURNING id, usuario, correo",
      [hashedPassword, email]
    );

    if (res.rowCount > 0) {
      console.log(`\n✅ Contraseña actualizada correctamente para ${email}`);
      console.log(`🔑 Nueva contraseña: ${newPassword}`);
    } else {
      console.log(`❌ No se encontró el usuario ${email}`);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();

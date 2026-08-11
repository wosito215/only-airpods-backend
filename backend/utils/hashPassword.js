// Genera el hash bcrypt de tu contraseña de admin para guardarlo en .env
// como ADMIN_PASSWORD_HASH (reemplaza a ADMIN_PASSWORD en texto plano).
//
// Uso:
//   node utils/hashPassword.js "onlyairpods2211"
//
// Copia el resultado y pégalo en tu .env local y en las variables de
// entorno de Render como: ADMIN_PASSWORD_HASH=<resultado>
// Luego puedes borrar la variable ADMIN_PASSWORD.

const bcrypt = require('bcryptjs');

const plainPassword = process.argv[2];

if (!plainPassword) {
    console.log('Uso: node utils/hashPassword.js "onlyairpods2211"');
    process.exit(1);
}

const hash = bcrypt.hashSync(plainPassword, 10);
console.log('\nAgrega esto a tu .env (y a Render):');
console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);

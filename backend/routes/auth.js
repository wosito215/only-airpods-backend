const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Límite de intentos de login: máx 8 intentos cada 15 min por IP.
// Evita que alguien intente adivinar la contraseña por fuerza bruta.
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 8,
    message: { message: 'Demasiados intentos. Intenta de nuevo en unos minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// POST /api/auth/login
// Body: { "password": "..." }
// Compara contra ADMIN_PASSWORD_HASH (bcrypt) del .env y devuelve un JWT si coincide.
router.post('/login', loginLimiter, async (req, res) => {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ message: 'Debes enviar la contraseña.' });
    }

    if (!process.env.ADMIN_PASSWORD_HASH) {
        console.error('Falta ADMIN_PASSWORD_HASH en las variables de entorno.');
        return res.status(500).json({ message: 'El servidor no tiene configurada la contraseña de admin.' });
    }

    const isValid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);

    if (!isValid) {
        return res.status(401).json({ message: 'Contraseña incorrecta.' });
    }

    const token = jwt.sign(
        { role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({ token });
});

module.exports = router;

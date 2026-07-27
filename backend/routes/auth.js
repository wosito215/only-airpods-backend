const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

// POST /api/auth/login
// Body: { "password": "..." }
// Compara contra ADMIN_PASSWORD del .env y devuelve un JWT si coincide.
router.post('/login', (req, res) => {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ message: 'Debes enviar la contraseña.' });
    }

    if (password !== process.env.ADMIN_PASSWORD) {
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

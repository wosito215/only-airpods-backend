const jwt = require('jsonwebtoken');

// Protege rutas: exige un header "Authorization: Bearer <token>" válido.
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ message: 'No autorizado. Falta el token.' });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = payload;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido o expirado.' });
    }
}

module.exports = requireAuth;

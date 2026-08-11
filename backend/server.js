require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const productRoutes = require('./routes/products');
const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const orderRoutes = require('./routes/orders');

const app = express();

// --- Middlewares ---
// Límite alto porque las imágenes de producto se suben como archivo y viajan
// codificadas en base64 dentro del JSON (hasta 4 por producto).
app.use(express.json({ limit: '20mb' }));

// CORS restringido: solo el dominio de tu frontend puede llamar a la API.
// FRONTEND_URL admite varios orígenes separados por coma, ej:
// "https://onlyairpods.vercel.app,http://localhost:5500"
const allowedOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Permite herramientas sin origin (Postman, curl) y los orígenes listados.
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Origen no permitido por CORS.'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// --- Rutas ---
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'API de ONLY.AIRPODS funcionando 🚀' });
});

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);

// --- Manejo de rutas no encontradas ---
app.use((req, res) => {
    res.status(404).json({ message: 'Ruta no encontrada.' });
});

// --- Manejo de errores (incluye body demasiado grande, JSON mal formado, etc.) ---
app.use((error, req, res, next) => {
    if (error.type === 'entity.too.large') {
        return res.status(413).json({ message: 'Las imágenes son demasiado pesadas. Intenta con fotos más livianas.' });
    }
    console.error(error);
    res.status(error.status || 500).json({ message: error.message || 'Error interno del servidor.' });
});

// --- Arranque ---
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
});
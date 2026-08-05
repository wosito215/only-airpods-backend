require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const productRoutes = require('./routes/products');
const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');

const app = express();

// --- Middlewares ---
// Límite alto porque las imágenes de producto se suben como archivo y viajan
// codificadas en base64 dentro del JSON (hasta 4 por producto).
app.use(express.json({ limit: '20mb' }));

// CORS abierto para evitar cualquier bloqueo con Vercel
app.use(cors({
    origin: '*', // Permite peticiones desde cualquier origen (Vercel, localhost, etc.)
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
require('dotenv').config();

const express = require('express');
const cors = require('cors');
app.use(cors());
const connectDB = require('./config/db');

const productRoutes = require('./routes/products');
const authRoutes = require('./routes/auth');

const app = express();

// --- Middlewares ---
app.use(express.json());

// CORS: en producción, restringe a la URL real de tu frontend (Vercel/GitHub Pages)
const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:5500', 'http://127.0.0.1:5500'].filter(Boolean);
app.use(cors({
    origin: function (origin, callback) {
        // Permite peticiones sin "origin" (ej. Postman) y las de la whitelist
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Bloqueado por CORS: ' + origin));
        }
    }
}));

// --- Rutas ---
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'API de ONLY.AIRPODS funcionando 🚀' });
});

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);

// --- Manejo de rutas no encontradas ---
app.use((req, res) => {
    res.status(404).json({ message: 'Ruta no encontrada.' });
});

// --- Arranque ---
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
});

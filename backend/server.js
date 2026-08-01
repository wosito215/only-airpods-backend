require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const productRoutes = require('./routes/products');
const authRoutes = require('./routes/auth');

const app = express();

// --- Middlewares ---
app.use(express.json());

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

// --- Manejo de rutas no encontradas ---
app.use((req, res) => {
    res.status(404).json({ message: 'Ruta no encontrada.' });
});

// --- Arranque ---
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
});
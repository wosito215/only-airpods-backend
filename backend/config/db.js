const mongoose = require('mongoose');

async function connectDB() {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        console.error('❌ Falta la variable de entorno MONGODB_URI. Revisa tu archivo .env');
        process.exit(1);
    }

    try {
        await mongoose.connect(uri);
        console.log('✅ Conectado a MongoDB Atlas');
    } catch (error) {
        console.error('❌ Error al conectar con MongoDB:', error.message);
        process.exit(1);
    }
}

module.exports = connectDB;

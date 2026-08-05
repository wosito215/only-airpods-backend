// Ejecuta esto UNA VEZ con: npm run seed
// Migra los 3 productos que ya tenías en productsDB (main.js) a MongoDB.
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Product = require('./models/Product');
const Category = require('./models/Category');

const initialCategories = [
    { id: 'airpods', name: 'AirPods', order: 0 },
    { id: 'cases', name: 'Cases', order: 1 },
    { id: 'otros', name: 'Otros', order: 2 },
];

const initialProducts = [
    {
        id: 'airpods-pro-2',
        name: 'AirPods Pro 2',
        price: 249000,
        desc: 'Cancelación de ruido activa hasta 2 veces mejor.',
        box: ['AirPods Pro', 'Estuche MagSafe', 'Cable USB-C'],
        category: 'airpods',
        stock: 15,
    },
    {
        id: 'airpods-3',
        name: 'AirPods 3ra Gen',
        price: 195000,
        desc: 'Diseño anatómico con ecualización adaptativa.',
        box: ['AirPods', 'Estuche Lightning', 'Cable USB-C'],
        category: 'airpods',
        stock: 20,
    },
    {
        id: 'case-transparente',
        name: 'Case MagSafe Transparente',
        price: 45000,
        desc: 'Compatible 100% con carga MagSafe.',
        box: ['Funda', 'Mosquetón'],
        category: 'cases',
        stock: 30,
    },
];

async function seed() {
    await connectDB();

    for (const category of initialCategories) {
        await Category.findOneAndUpdate(
            { id: category.id },
            category,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        console.log(`✅ Categoría lista: ${category.name}`);
    }

    for (const product of initialProducts) {
        await Product.findOneAndUpdate(
            { id: product.id },
            product,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        console.log(`✅ Producto listo: ${product.name}`);
    }

    console.log('🎉 Seed completado.');
    await mongoose.connection.close();
    process.exit(0);
}

seed().catch((error) => {
    console.error('❌ Error en el seed:', error);
    process.exit(1);
});

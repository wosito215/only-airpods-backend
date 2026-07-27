const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        // "id" es el slug que ya usa tu frontend (ej: 'airpods-pro-2')
        // Se usa en vez del _id de Mongo para no tener que tocar tu HTML/JS existente.
        id: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        desc: {
            type: String,
            default: '',
        },
        box: {
            type: [String],
            default: [],
        },
        category: {
            type: String,
            enum: ['airpods', 'cases', 'otros'],
            default: 'otros',
        },
        stock: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },
        image: {
            type: String, // URL de la imagen (opcional, mientras tanto se usa el placeholder)
            default: '',
        },
        active: {
            type: Boolean,
            default: true, // permite "ocultar" un producto sin borrarlo
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);

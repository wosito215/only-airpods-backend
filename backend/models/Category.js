const mongoose = require('mongoose');

// Categorías dinámicas (ej: airpods, cases, camaras...).
// "id" es el slug que se guarda en Product.category.
const categorySchema = new mongoose.Schema(
    {
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
        order: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);

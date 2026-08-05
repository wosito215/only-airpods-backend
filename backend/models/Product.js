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
        // Ya no es un enum fijo: las categorías se administran dinámicamente
        // desde el panel (modelo Category). Aquí solo guardamos el "id" (slug)
        // de la categoría a la que pertenece el producto.
        category: {
            type: String,
            trim: true,
            lowercase: true,
            default: 'otros',
        },
        stock: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },
        // Imágenes subidas como archivo (se guardan como Data URL base64,
        // ya redimensionadas/comprimidas desde el navegador antes de enviarse).
        // images[0] es siempre la foto principal que se ve en el catálogo.
        images: {
            type: [String],
            default: [],
            validate: {
                validator: (arr) => Array.isArray(arr) && arr.length <= 4,
                message: 'Un producto admite máximo 4 imágenes.',
            },
        },
        // Se muestra en la sección "Destacados" de la pantalla principal.
        featured: {
            type: Boolean,
            default: false,
        },
        active: {
            type: Boolean,
            default: true, // permite "ocultar" un producto sin borrarlo
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);

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
                validator: (arr) => {
                    if (!Array.isArray(arr) || arr.length > 4) return false;
                    // Cada imagen debe ser un Data URL de imagen real (jpg/png/webp)
                    // y no pesar más de ~3MB ya codificada, para no inflar la base de datos.
                    const validPattern = /^data:image\/(jpeg|jpg|png|webp);base64,/;
                    const MAX_LENGTH = 4 * 1024 * 1024; // ~3MB en bytes reales
                    return arr.every(
                        (img) => typeof img === 'string' && validPattern.test(img) && img.length <= MAX_LENGTH
                    );
                },
                message: 'Cada imagen debe ser JPG/PNG/WEBP válida y pesar menos de ~3MB (máximo 4 imágenes).',
            },
        },
        // Marca si este producto tiene variantes de color (ej: un case que
        // viene en varios colores). Si es true, "colors" trae las opciones.
        hasColors: {
            type: Boolean,
            default: false,
        },
        // Cada color: nombre (ej "Azul"), código hex (para el circulito de
        // color) y su propia foto (Data URL base64, igual que "images").
        // Así un solo producto cubre todos sus colores, en vez de crear
        // un producto repetido por cada color.
        colors: {
            type: [
                {
                    name: { type: String, trim: true },
                    hex: { type: String, trim: true },
                    image: { type: String },
                },
            ],
            default: [],
            validate: {
                validator: (arr) => {
                    if (!Array.isArray(arr) || arr.length > 8) return false;
                    const hexPattern = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
                    const imgPattern = /^data:image\/(jpeg|jpg|png|webp);base64,/;
                    const MAX_LENGTH = 4 * 1024 * 1024; // ~3MB en bytes reales
                    return arr.every(
                        (c) =>
                            c &&
                            typeof c.name === 'string' && c.name.trim().length > 0 &&
                            typeof c.hex === 'string' && hexPattern.test(c.hex) &&
                            typeof c.image === 'string' && imgPattern.test(c.image) && c.image.length <= MAX_LENGTH
                    );
                },
                message: 'Cada color necesita nombre, código de color (#RRGGBB) y una foto JPG/PNG/WEBP válida de menos de ~3MB (máximo 8 colores).',
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

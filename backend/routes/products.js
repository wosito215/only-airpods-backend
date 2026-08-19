const express = require('express');
const Product = require('../models/Product');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// ---------- RUTAS PÚBLICAS (las usa el frontend/main.js) ----------

// GET /api/products -> lista los productos activos
// ?all=true (uso interno del admin) también trae los inactivos
// ?page=1&limit=20 -> paginación (opcional; si no se envían, se comporta igual que antes)
router.get('/', async (req, res) => {
    try {
        const filter = req.query.all === 'true' ? {} : { active: true };

        // Sin page/limit -> se mantiene el comportamiento original (trae todo).
        if (!req.query.page && !req.query.limit) {
            const products = await Product.find(filter).sort({ createdAt: -1 });
            return res.json(products);
        }

        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
        const skip = (page - 1) * limit;

        const [products, total] = await Promise.all([
            Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Product.countDocuments(filter),
        ]);

        res.json({
            products,
            page,
            totalPages: Math.ceil(total / limit),
            totalProducts: total,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los productos.', error: error.message });
    }
});

// GET /api/products/:id -> un producto puntual (por su slug, ej. 'airpods-pro-2')
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findOne({ id: req.params.id, active: true });
        if (!product) return res.status(404).json({ message: 'Producto no encontrado.' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el producto.', error: error.message });
    }
});

// ---------- RUTAS PROTEGIDAS (las usa admin.js, requieren JWT) ----------

// POST /api/products -> crear producto nuevo
router.post('/', requireAuth, async (req, res) => {
    try {
        const { id, name, price, desc, box, category, stock, images, featured, hasColors, colors } = req.body;

        if (!id || !name || price === undefined || stock === undefined) {
            return res.status(400).json({ message: 'Faltan campos obligatorios: id, name, price, stock.' });
        }

        if (images && Array.isArray(images) && images.length > 4) {
            return res.status(400).json({ message: 'Un producto admite máximo 4 imágenes.' });
        }

        if (colors && Array.isArray(colors) && colors.length > 8) {
            return res.status(400).json({ message: 'Un producto admite máximo 8 colores.' });
        }

        const exists = await Product.findOne({ id: id.toLowerCase().trim() });
        if (exists) {
            return res.status(409).json({ message: `Ya existe un producto con el id "${id}".` });
        }

        const product = await Product.create({
            id, name, price, desc, box, category, stock,
            images: images || [],
            featured: !!featured,
            hasColors: !!hasColors,
            colors: colors || [],
        });
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error al crear el producto.', error: error.message });
    }
});

// PUT /api/products/:id -> actualizar precio, stock, nombre, etc.
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const updates = req.body;

        if (updates.images && Array.isArray(updates.images) && updates.images.length > 4) {
            return res.status(400).json({ message: 'Un producto admite máximo 4 imágenes.' });
        }

        if (updates.colors && Array.isArray(updates.colors) && updates.colors.length > 8) {
            return res.status(400).json({ message: 'Un producto admite máximo 8 colores.' });
        }

        const product = await Product.findOneAndUpdate(
            { id: req.params.id },
            updates,
            { new: true, runValidators: true }
        );

        if (!product) return res.status(404).json({ message: 'Producto no encontrado.' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el producto.', error: error.message });
    }
});

// DELETE /api/products/:id -> eliminar producto definitivamente
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const product = await Product.findOneAndDelete({ id: req.params.id });
        if (!product) return res.status(404).json({ message: 'Producto no encontrado.' });
        res.json({ message: 'Producto eliminado correctamente.', id: product.id });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el producto.', error: error.message });
    }
});

module.exports = router;

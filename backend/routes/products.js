const express = require('express');
const Product = require('../models/Product');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// ---------- RUTAS PÚBLICAS (las usa el frontend/main.js) ----------

// GET /api/products -> lista todos los productos activos
router.get('/', async (req, res) => {
    try {
        const products = await Product.find({ active: true }).sort({ createdAt: -1 });
        res.json(products);
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
        const { id, name, price, desc, box, category, stock, image } = req.body;

        if (!id || !name || price === undefined || stock === undefined) {
            return res.status(400).json({ message: 'Faltan campos obligatorios: id, name, price, stock.' });
        }

        const exists = await Product.findOne({ id: id.toLowerCase().trim() });
        if (exists) {
            return res.status(409).json({ message: `Ya existe un producto con el id "${id}".` });
        }

        const product = await Product.create({ id, name, price, desc, box, category, stock, image });
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error al crear el producto.', error: error.message });
    }
});

// PUT /api/products/:id -> actualizar precio, stock, nombre, etc.
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const updates = req.body;
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

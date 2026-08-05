const express = require('express');
const Category = require('../models/Category');
const Product = require('../models/Product');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// Convierte "Cámaras y Accesorios" -> "camaras-y-accesorios"
function slugify(text) {
    return text
        .toString()
        .trim()
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita tildes
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// ---------- PÚBLICA ----------

// GET /api/categories -> lista todas, ordenadas
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find().sort({ order: 1, name: 1 });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las categorías.', error: error.message });
    }
});

// ---------- PROTEGIDAS ----------

// POST /api/categories -> crear categoría nueva
router.post('/', requireAuth, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'El nombre de la categoría es obligatorio.' });
        }

        const id = slugify(name);
        if (!id) {
            return res.status(400).json({ message: 'Nombre de categoría no válido.' });
        }

        const exists = await Category.findOne({ id });
        if (exists) {
            return res.status(409).json({ message: `Ya existe una categoría "${exists.name}".` });
        }

        const count = await Category.countDocuments();
        const category = await Category.create({ id, name: name.trim(), order: count });
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ message: 'Error al crear la categoría.', error: error.message });
    }
});

// PUT /api/categories/:id -> renombrar categoría (mantiene el mismo id/slug)
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'El nombre de la categoría es obligatorio.' });
        }

        const category = await Category.findOneAndUpdate(
            { id: req.params.id },
            { name: name.trim() },
            { new: true }
        );

        if (!category) return res.status(404).json({ message: 'Categoría no encontrada.' });
        res.json(category);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar la categoría.', error: error.message });
    }
});

// DELETE /api/categories/:id -> elimina, pero solo si ningún producto la usa
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const inUse = await Product.countDocuments({ category: req.params.id });
        if (inUse > 0) {
            return res.status(409).json({
                message: `No puedes eliminar esta categoría: ${inUse} producto(s) todavía la usan. Cámbialos de categoría primero.`,
            });
        }

        const category = await Category.findOneAndDelete({ id: req.params.id });
        if (!category) return res.status(404).json({ message: 'Categoría no encontrada.' });
        res.json({ message: 'Categoría eliminada correctamente.', id: category.id });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar la categoría.', error: error.message });
    }
});

module.exports = router;

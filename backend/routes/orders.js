const express = require('express');
const Order = require('../models/Order');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// ---------- RUTA PÚBLICA ----------

// POST /api/orders -> el frontend la llama justo antes de abrir WhatsApp,
// para dejar registro del pedido (no requiere login).
router.post('/', async (req, res) => {
    try {
        const { items, total, customerName, customerPhone, notes } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'El pedido debe tener al menos un producto.' });
        }
        if (total === undefined) {
            return res.status(400).json({ message: 'Falta el total del pedido.' });
        }

        const order = await Order.create({ items, total, customerName, customerPhone, notes });
        res.status(201).json(order);
    } catch (error) {
        res.status(500).json({ message: 'Error al registrar el pedido.', error: error.message });
    }
});

// ---------- RUTAS PROTEGIDAS (panel de admin) ----------

// GET /api/orders -> historial de pedidos, más recientes primero.
// ?status=pendiente para filtrar por estado.
router.get('/', requireAuth, async (req, res) => {
    try {
        const filter = req.query.status ? { status: req.query.status } : {};
        const orders = await Order.find(filter).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los pedidos.', error: error.message });
    }
});

// PUT /api/orders/:id -> actualizar estado de un pedido (ej: "confirmado", "enviado")
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const { status, notes } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { ...(status && { status }), ...(notes !== undefined && { notes }) },
            { new: true, runValidators: true }
        );
        if (!order) return res.status(404).json({ message: 'Pedido no encontrado.' });
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el pedido.', error: error.message });
    }
});

module.exports = router;

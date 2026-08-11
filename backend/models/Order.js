const mongoose = require('mongoose');

// Guarda cada pedido que se envía por WhatsApp, para tener historial de
// ventas y poder hacer seguimiento (aunque el pago/coordinación siga
// pasando por WhatsApp).
const orderItemSchema = new mongoose.Schema(
    {
        productId: { type: String, required: true }, // slug del producto
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        items: {
            type: [orderItemSchema],
            required: true,
            validate: {
                validator: (arr) => Array.isArray(arr) && arr.length > 0,
                message: 'El pedido debe tener al menos un producto.',
            },
        },
        total: { type: Number, required: true, min: 0 },
        customerName: { type: String, trim: true, default: '' },
        customerPhone: { type: String, trim: true, default: '' },
        status: {
            type: String,
            enum: ['pendiente', 'confirmado', 'enviado', 'entregado', 'cancelado'],
            default: 'pendiente',
        },
        notes: { type: String, default: '' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);

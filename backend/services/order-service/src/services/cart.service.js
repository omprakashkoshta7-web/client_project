const Cart = require('../models/cart.model');

const getCart = async (userId) => {
    let cart = await Cart.findOne({ userId });
    if (!cart) cart = await Cart.create({ userId, items: [] });
    return cart;
};

const addToCart = async (userId, item) => {
    try {
        console.log('[cart.service] addToCart called with userId:', userId);
        console.log('[cart.service] item data:', JSON.stringify(item, null, 2));

        let cart = await Cart.findOne({ userId });
        if (!cart) cart = new Cart({ userId, items: [] });

        // Check if same product+config already in cart
        const existingIdx = cart.items.findIndex((i) => {
            if (item.printConfigId) return i.printConfigId === item.printConfigId;
            if (item.businessPrintConfigId)
                return i.businessPrintConfigId === item.businessPrintConfigId;
            if (item.designId) return i.designId === item.designId && i.productId === item.productId;
            return i.productId === item.productId && i.variantId === item.variantId;
        });

        if (existingIdx >= 0) {
            // Update quantity
            cart.items[existingIdx].quantity += item.quantity || 1;
            cart.items[existingIdx].totalPrice =
                cart.items[existingIdx].unitPrice * cart.items[existingIdx].quantity;
        } else {
            cart.items.push(item);
        }

        console.log('[cart.service] Saving cart with', cart.items.length, 'items');
        await cart.save();
        console.log('[cart.service] Cart saved successfully');
        return cart;
    } catch (error) {
        console.error('[cart.service] Error in addToCart:', error);
        console.error('[cart.service] Error name:', error.name);
        console.error('[cart.service] Error message:', error.message);
        if (error.errors) {
            console.error('[cart.service] Validation errors:', JSON.stringify(error.errors, null, 2));
        }
        throw error;
    }
};

const removeFromCart = async (userId, itemId) => {
    const cart = await Cart.findOne({ userId });
    if (!cart) return null;
    cart.items = cart.items.filter((i) => i._id.toString() !== itemId);
    await cart.save();
    return cart;
};

const updateCartItem = async (userId, itemId, quantity) => {
    const cart = await Cart.findOne({ userId });
    if (!cart) {
        const err = new Error('Cart not found');
        err.statusCode = 404;
        throw err;
    }
    const item = cart.items.find((i) => i._id.toString() === itemId);
    if (!item) {
        const err = new Error('Item not found in cart');
        err.statusCode = 404;
        throw err;
    }
    item.quantity = quantity;
    item.totalPrice = item.unitPrice * quantity;
    await cart.save();
    return cart;
};

const clearCart = async (userId) => {
    return Cart.findOneAndUpdate({ userId }, { items: [], subtotal: 0 }, { new: true });
};

module.exports = { getCart, addToCart, removeFromCart, updateCartItem, clearCart };

const express = require('express');
const router = express.Router();
const dbSingleton = require('../dbSingleton');

const db = dbSingleton.getConnection();

router.get('/', (req, res, next) => {
    const { limit } = req.query;

    if (limit && isNaN(limit)) {
        return res.status(400).json({ error: 'Parameter "limit" must be a number' });
    }

    const query = limit
        ? 'SELECT * FROM products LIMIT ?'
        : 'SELECT * FROM products';

    const params = limit ? [parseInt(limit, 10)] : [];

    db.query(query, params, (err, results) => {
        if (err) {
            return next(err);
        }

        res.json(results);
    });
});


// API for creating an order
router.post('/orders', (req, res) => {
    const { user_id, items } = req.body;

    if (!user_id || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Invalid request payload' });
    }

    // Check the existence of each product
    const productIds = items.map(item => item.product_id);
    const checkProductsQuery = 'SELECT id FROM products WHERE id IN (?)';

    db.query(checkProductsQuery, [productIds], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to check products' });
        }

        const existingProductIds = result.map(product => product.id);
        const invalidProductIds = productIds.filter(id => !existingProductIds.includes(id));

        if (invalidProductIds.length > 0) {
            return res.status(400).json({
                error: `Invalid product IDs: ${invalidProductIds.join(', ')}`,
            });
        }

        // Start the transaction
        db.beginTransaction((err) => {
            if (err) return res.status(500).json({ error: 'Transaction error' });

            // Insert the order
            const orderQuery = 'INSERT INTO orders (user_id) VALUES (?)';
            db.query(orderQuery, [user_id], (err, result) => {
                if (err) {
                    db.rollback(() => res.status(500).json({ error: 'Order creation failed' }));
                    return;
                }

                const orderId = result.insertId;

                // Generate data for inserting products
                const orderItems = items.map((item) => [orderId, item.product_id, item.quantity]);
                const itemsQuery = `
    INSERT INTO order_items (order_id, product_id, quantity)
    VALUES?
    `;

                db.query(itemsQuery, [orderItems], (err) => {
                    if (err) {
                        db.rollback(() => res.status(500).json({ error: 'Order items creation failed' }));
                        return;
                    }

                    // Complete the transaction
                    db.commit((err) => {
                        if (err) {
                            db.rollback(() => res.status(500).json({ error: 'Transaction commit failed' }));
                            return;
                        }

                        res.status(201).json({ message: 'Order created successfully', orderId });
                    });
                });
            });
        });
    });
});

router.get('/:id', (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM products WHERE id = ?';
    db.query(query, [id], (err, results) => {
        if (err) {
            res.status(500).send(err);
            return;
        }
        res.json(results);
    });
});

router.post('/', (req, res) => {
    const { name, price } = req.body;
    const query = 'INSERT INTO products (name, price) VALUES (?, ?)';
    db.query(query, [name, price], (err, results) => {
        if (err) {
            res.status(500).send(err);
            return;
        }
        res.json({ message: 'Product added!', id: results.insertId });
    });
});
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { name, price } = req.body;
    const query = 'UPDATE products SET name = ?, price = ? WHERE id = ?';
    db.query(query, [name, email, id], (err, results) => {
        if (err) {
            res.status(500).send(err);
            return;
        }
        res.json({ message: 'Product updated!' });
    });
});
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM products WHERE id = ?';
    db.query(query, [id], (err, results) => {
        if (err) {
            res.status(500).send(err);
            return;
        }
        res.json({ message: 'Product deleted!' });
    });
});

module.exports = router; 
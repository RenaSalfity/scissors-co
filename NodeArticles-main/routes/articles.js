const express = require('express');
const router = express.Router();
const dbSingleton = require('../dbSingleton');

// Execute a query to the database
const db = dbSingleton.getConnection();

router.get('/', (req, res) => {
    const query = 'SELECT * FROM articles';
    db.query(query, (err, results) => {
        if (err) {
            res.status(500).send(err);
            return;
        }
        res.json(results);
    });
});

router.post('/', (req, res) => {
    const { title, content, author } = req.body;
    const query = 'INSERT INTO articles  (title, content, author) VALUES (?, ?, ?)';
    db.query(query, [title, content, author], (err, results) => {
        if (err) {
            res.status(500).send(err);
            return;
        }
        res.json({ message: 'article added!', id: results.insertId });
    });
});
router.put('/:id', (req, res) => {
const { id } = req.params;
const { title, content, author } = req.body;
const query = 'UPDATE articles SET title = ?, content = ?, author = ? WHERE id = ?';
db.query(query, [title, content, author, id], (err, results) => {
    if (err) {
    res.status(500).send(err);
    return;
    }
    res.json({ message: 'article updated!' });
});
});
router.delete('/:id', (req, res) => {
const { id } = req.params;
const query = 'DELETE FROM articles WHERE id = ?';
db.query(query, [id], (err, results) => {
    if (err) {
    res.status(500).send(err);
    return;
    }
    res.json({ message: 'article deleted!' });
});
});
module.exports = router; 

// pojazdyService.js
const db = require("./dbContext");
const { buildQuery } = require("./queryBuilder");

function getPojazdy(req, res) {
    const { sql, params } = buildQuery("Pojazdy", req.query);

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
}

function getDistinct(req, res) {
    const column = req.params.column;
    const sql = `SELECT DISTINCT ${column} AS value FROM Pojazdy WHERE ${column} IS NOT NULL ORDER BY value`;

    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(r => r.value));
    });
}

module.exports = { getPojazdy, getDistinct };

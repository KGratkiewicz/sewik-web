// uczestnicyService.js
const db = require("./dbContext");
const { buildQuery, buildCountQuery } = require("./queryBuilder");

function getUczestnicy(req, res) {
    const tableName = "Osoby"; // jeśli u Ciebie tabela nazywa się inaczej (np. Osoba) – zmień tu nazwę

    const { sql: countSql, params: countParams } = buildCountQuery(tableName, req.query);

    db.get(countSql, countParams, (errCount, countRow) => {
        if (errCount) return res.status(500).json({ error: errCount.message });

        const total = countRow ? countRow.total : 0;
        const { sql, params } = buildQuery(tableName, req.query);

        db.all(sql, params, (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });

            const page = parseInt(req.query.page || "1", 10);
            let pageSize = parseInt(req.query.pageSize || "100", 10);
            if (isNaN(pageSize) || pageSize < 1) pageSize = 100;
            if (pageSize > 100) pageSize = 100;

            const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

            res.json({
                rows,
                total,
                page,
                pageSize,
                totalPages
            });
        });
    });
}
function getDistinctUczestnicy(req, res) {
    const tableName = "Osoby";
    const col = req.params.col;

    if (!col) {
        return res.status(400).json({ error: "Missing column name" });
    }

    const allowedCols = [
        "PLEC",
        "SOBY_KOD",
        "SSRU_KOD",
        "SUSU_KOD",
        "SRUZ_KOD",
        "STUC_KOD",
        "MIEJSCE_W_POJ"
    ];

    if (!allowedCols.includes(col)) {
        return res.json([]);
    }

    const sql = `SELECT DISTINCT ${col} AS value FROM ${tableName} WHERE ${col} IS NOT NULL ORDER BY value`;

    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        const values = rows.map(r => r.value);
        res.json(values);
    });
}

module.exports = { getUczestnicy, getDistinctUczestnicy };


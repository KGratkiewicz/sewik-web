// pojazdyService.js
const db = require("./dbContext");
const { buildQuery, buildCountQuery } = require("./queryBuilder");

function getPojazdy(req, res) {
    const tableName = "Pojazdy";

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

function getDistinctPojazdy(req, res) {
    const tableName = "Pojazdy";
    const col = req.params.col;   // <--- KLUCZOWA ZMIANA

    if (!col) {
        return res.status(400).json({ error: "Missing column name" });
    }

    const allowedCols = [
        "RODZAJ_POJAZDU",
        "MARKA",
        "SPSU_KOD",
        "SPSU_TABK_TYPE"
    ];

    if (!allowedCols.includes(col)) {
        return res.json([]);
    }

    const sql = `SELECT DISTINCT ${col} AS value
                 FROM ${tableName}
                 WHERE ${col} IS NOT NULL
                 ORDER BY value`;

    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        const values = rows.map(r => r.value);
        res.json(values);
    });
}


module.exports = { getPojazdy, getDistinctPojazdy };


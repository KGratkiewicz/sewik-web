// queryBuilder.js

const NUMERIC_RANGE_COLUMNS = new Set([
    "ROK",
    "KM_HM",
    "PREDKOSC_DOPUSZCZALNA",
    "LICZBA_POJAZDOW",
    "LICZBA_UCZESTNIKOW"
]);


function buildFilters(query) {
    const params = [];
    const whereParts = [];

    // FILTRY "IN" (checkboxy)
    if (query.filters) {
        try {
            const filters = JSON.parse(query.filters); // { col: [values...] }
            Object.keys(filters).forEach(col => {
                const values = filters[col];
                if (!Array.isArray(values) || values.length === 0) return;
                const placeholders = values.map(() => "?").join(",");
                values.forEach(v => params.push(v));
                whereParts.push(`${col} IN (${placeholders})`);
            });
        } catch (e) {
            console.error("Niepoprawny JSON w filters:", e);
        }
    }

    // FILTRY TEKSTOWE (wyszukiwarka, case-insensitive)
    if (query.search) {
        try {
            const search = JSON.parse(query.search); // { col: "fraza", ... }
            Object.keys(search).forEach(col => {
                const term = (search[col] || "").toString().trim();
                if (!term) return;
                whereParts.push(`LOWER(${col}) LIKE ?`);
                params.push(`%${term.toLowerCase()}%`);
            });
        } catch (e) {
            console.error("Niepoprawny JSON w search:", e);
        }
    }

    // FILTRY ZAKRESOWE (OD–DO) + opcja "WYŚWIETLAJ GDY BRAK DANYCH"
    if (query.range) {
        try {
            const range = JSON.parse(query.range); // { col: { from,to,includeNull } }
            Object.keys(range).forEach(col => {
                const cfg = range[col] || {};
                const from = (cfg.from || "").toString().trim();
                const to = (cfg.to || "").toString().trim();
                const includeNull = !!cfg.includeNull;

                const localConds = [];
                let exprCol = col;

                if (NUMERIC_RANGE_COLUMNS.has(col)) {
                    exprCol = `CAST(${col} AS REAL)`;
                }

                if (from) {
                    localConds.push(`${exprCol} >= ?`);
                    params.push(from);
                }
                if (to) {
                    localConds.push(`${exprCol} <= ?`);
                    params.push(to);
                }

                let cond = null;
                if (localConds.length > 0) {
                    cond = "(" + localConds.join(" AND ");
                    if (includeNull) {
                        cond += ` OR ${col} IS NULL OR ${col} = ''`;
                    }
                    cond += ")";
                } else if (includeNull) {
                    cond = `(${col} IS NULL OR ${col} = '')`;
                }

                if (cond) whereParts.push(cond);
            });
        } catch (e) {
            console.error("Niepoprawny JSON w range:", e);
        }
    }

    const whereSql = whereParts.length > 0 ? " WHERE " + whereParts.join(" AND ") : "";
    return { whereSql, params };
}

function buildQuery(tableName, query) {
    let sql = `SELECT * FROM ${tableName}`;
    const { whereSql, params } = buildFilters(query);
    sql += whereSql;

    // SORTOWANIE
    if (query.sort) {
        try {
            const sortList = JSON.parse(query.sort); // [{column,dir}, ...]
            const orderSql = sortList
                .filter(s => s.column && s.dir)
                .map(s => `${s.column} ${s.dir.toUpperCase()}`)
                .join(", ");
            if (orderSql) {
                sql += " ORDER BY " + orderSql;
            }
        } catch (e) {
            console.error("Niepoprawny JSON w sort:", e);
        }
    }

    // PAGINACJA – z możliwością zmiany pageSize (max 100)
    const page = parseInt(query.page || "1", 10);
    let pageSize = parseInt(query.pageSize || "100", 10);
    if (isNaN(pageSize) || pageSize < 1) pageSize = 100;
    if (pageSize > 100) pageSize = 100;

    const offset = (isNaN(page) || page < 1 ? 0 : (page - 1) * pageSize);

    sql += ` LIMIT ${pageSize} OFFSET ${offset}`;

    return { sql, params };
}

function buildCountQuery(tableName, query) {
    let sql = `SELECT COUNT(*) as total FROM ${tableName}`;
    const { whereSql, params } = buildFilters(query);
    sql += whereSql;
    return { sql, params };
}

module.exports = { buildQuery, buildCountQuery };

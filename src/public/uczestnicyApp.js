let currentPage = 1;
let currentFilters = {};
let currentSort = [];

async function loadDistinctFilters() {
    const plec = await fetch("/uczestnicy/distinct/PLEC").then(r => r.json());
    const soby = await fetch("/uczestnicy/distinct/SOBY_KOD").then(r => r.json());

    fillSelect("filterPlec", plec);
    fillSelect("filterSoby", soby);
}

function fillSelect(id, values) {
    const sel = document.getElementById(id);
    sel.innerHTML = "";
    values.forEach(v => {
        if (!v) return;
        const opt = document.createElement("option");
        opt.value = v;
        opt.textContent = v;
        sel.appendChild(opt);
    });
}

async function loadData() {
    const params = new URLSearchParams();
    params.append("page", currentPage);

    if (Object.keys(currentFilters).length > 0) {
        params.append("filters", JSON.stringify(currentFilters));
    }

    if (currentSort.length > 0) {
        params.append("sort", JSON.stringify(currentSort));
    }

    const data = await fetch(`/uczestnicy?${params}`).then(r => r.json());

    const tbody = document.querySelector("#results tbody");
    tbody.innerHTML = "";

    data.forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${row.ID_OSOBY_XML || ""}</td>
            <td>${row.ZSZD_ID || ""}</td>
            <td>${row.PLEC || ""}</td>
            <td>${row.DATA_UR || ""}</td>
            <td>${row.SOBY_KOD || ""}</td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById("pageInfo").textContent = `Strona ${currentPage}`;
}

document.getElementById("filterBtn").onclick = () => {
    currentFilters = {};

    const plec = [...document.getElementById("filterPlec").selectedOptions].map(o => o.value);
    const soby = [...document.getElementById("filterSoby").selectedOptions].map(o => o.value);

    if (plec.length > 0) currentFilters.PLEC = plec;
    if (soby.length > 0) currentFilters.SOBY_KOD = soby;

    currentPage = 1;
    loadData();
};

document.getElementById("sortBtn").onclick = () => {
    currentSort = [];

    const s1 = document.getElementById("sort1").value;
    if (s1) currentSort.push({ column: s1, dir: document.getElementById("sort1dir").value });

    const s2 = document.getElementById("sort2").value;
    if (s2) currentSort.push({ column: s2, dir: document.getElementById("sort2dir").value });

    loadData();
};

document.getElementById("prevPage").onclick = () => {
    if (currentPage > 1) {
        currentPage--;
        loadData();
    }
};

document.getElementById("nextPage").onclick = () => {
    currentPage++;
    loadData();
};

loadDistinctFilters().then(loadData);

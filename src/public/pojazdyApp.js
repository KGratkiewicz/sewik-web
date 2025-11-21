let currentPage = 1;
let currentFilters = {};
let currentSort = [];

async function loadDistinctFilters() {
    const rodzaj = await fetch("/pojazdy/distinct/RODZAJ_POJAZDU").then(r => r.json());
    const marka = await fetch("/pojazdy/distinct/MARKA").then(r => r.json());

    fillSelect("filterRodzaj", rodzaj);
    fillSelect("filterMarka", marka);
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

    const data = await fetch(`/pojazdy?${params}`).then(r => r.json());

    const tbody = document.querySelector("#results tbody");
    tbody.innerHTML = "";

    data.forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${row.ID_POJAZDU_XML || ""}</td>
            <td>${row.ZSZD_ID || ""}</td>
            <td>${row.NR_POJAZDU || ""}</td>
            <td>${row.RODZAJ_POJAZDU || ""}</td>
            <td>${row.MARKA || ""}</td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById("pageInfo").textContent = `Strona ${currentPage}`;
}

document.getElementById("filterBtn").onclick = () => {
    currentFilters = {};

    const rodzaj = [...document.getElementById("filterRodzaj").selectedOptions].map(o => o.value);
    const marka = [...document.getElementById("filterMarka").selectedOptions].map(o => o.value);

    if (rodzaj.length > 0) currentFilters.RODZAJ_POJAZDU = rodzaj;
    if (marka.length > 0) currentFilters.MARKA = marka;

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

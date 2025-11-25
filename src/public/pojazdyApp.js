// public/pojazdyApp.js – analogiczne filtry jak w zdarzeniach

let currentPageP = 1;
let currentPageSizeP = 100;

let currentFiltersP = {};        // IN (checkboxy) – zastosowane
let pendingFiltersP = {};

let currentSearchFiltersP = {};  // LIKE – zastosowane
let pendingSearchFiltersP = {};

let currentRangeFiltersP = {};   // zakresy – zastosowane
let pendingRangeFiltersP = {};

let sortStateP = [];             // [{column, dir}]
let allColumnsP = [];
let visibleColumnsP = new Set();
const distinctCacheP = {};
let totalPagesP = 0;
let totalRecordsP = 0;

// KONTEKST – filtr po ZSZD_ID z parametru zdarzenieId
let contextFiltersP = {};

// ----- KONFIG KOLUMN DLA POJAZDÓW -----
// (dopasuj do swoich nazw – to jest startowa propozycja)

const SEARCH_ONLY_COLUMNS_P = new Set([
  "ID",
  "ZSZD_ID",
  "NR_POJAZDU"
]);

const RANGE_DATE_COLUMNS_P = new Set([
  "DataUtworzenia",
  "DataMod"
]);

const RANGE_NUMERIC_COLUMNS_P = new Set([
  "NR_POJAZDU"
]);

const RANGE_COLUMNS_P = new Set([
  ...RANGE_DATE_COLUMNS_P,
  ...RANGE_NUMERIC_COLUMNS_P
]);

const VALUE_FILTER_COLUMNS_P = new Set([
  "RODZAJ_POJAZDU",
  "MARKA",
  "SPSU_KOD",
  "SPSU_TABK_TYPE"
]);

function deepCopyP(obj) {
  return JSON.parse(JSON.stringify(obj || {}));
}

function initContextP() {
  const params = new URLSearchParams(window.location.search);
  const zdId = params.get("zdarzenieId");
  const info = document.getElementById("activeContextInfo");
  if (zdId) {
    contextFiltersP.ZSZD_ID = [zdId];
    pendingFiltersP.ZSZD_ID = [zdId];
    currentFiltersP.ZSZD_ID = [zdId];
    if (info) {
      info.textContent = `Pokazuję pojazdy powiązane ze zdarzeniem ID = ${zdId} (ZSZD_ID = ${zdId}).`;
    }
  } else {
    if (info) {
      info.textContent = "Brak aktywnego filtra po zdarzeniu. Wyświetlam wszystkie pojazdy (stronicowane).";
    }
  }
}

function buildQueryParamsP() {
  const params = new URLSearchParams();
  params.append("page", currentPageP.toString());
  params.append("pageSize", currentPageSizeP.toString());

  const effectiveFilters = deepCopyP(currentFiltersP);
  // zawsze dokładamy kontekst (jeśli jest)
  Object.keys(contextFiltersP).forEach(col => {
    effectiveFilters[col] = contextFiltersP[col];
  });

  if (Object.keys(effectiveFilters).length > 0) {
    params.append("filters", JSON.stringify(effectiveFilters));
  }
  if (Object.keys(currentSearchFiltersP).length > 0) {
    params.append("search", JSON.stringify(currentSearchFiltersP));
  }
  if (Object.keys(currentRangeFiltersP).length > 0) {
    params.append("range", JSON.stringify(currentRangeFiltersP));
  }
  if (sortStateP.length > 0) {
    params.append("sort", JSON.stringify(sortStateP));
  }
  return params;
}

async function loadDataP() {
  const requestedPage = currentPageP;
  const params = buildQueryParamsP();
  const res = await fetch(`/pojazdy?${params.toString()}`);
  const payload = await res.json();

  if (!payload || !Array.isArray(payload.rows)) {
    renderTableP([], []);
    document.getElementById("bottomPageInfo").textContent = "Brak danych";
    return;
  }

  const rows = payload.rows;
  totalRecordsP = payload.total || 0;
  currentPageP = payload.page || 1;
  currentPageSizeP = payload.pageSize || currentPageSizeP;
  totalPagesP = payload.totalPages || 0;

  if (requestedPage > 1 && rows.length === 0) {
    currentPageP = Math.max(1, requestedPage - 1);
  }

  if (rows.length === 0) {
    renderTableP([], []);
  } else {
    if (allColumnsP.length === 0) {
      allColumnsP = Object.keys(rows[0]);
      visibleColumnsP = new Set(allColumnsP);
      renderColumnControlsP();
      renderFilterControlsP();
      attachGlobalHandlersP();
    }
    renderTableP(allColumnsP, rows);
    applyColumnVisibilityP();
    updateSortUIP();
  }

  updatePaginationUIP();
  updateActiveFiltersSummaryP();
}

function renderTableP(columns, rows) {
  const theadRow = document.getElementById("header-row");
  const tbody = document.getElementById("body-rows");

  theadRow.innerHTML = "";
  tbody.innerHTML = "";

  columns.forEach(col => {
    const th = document.createElement("th");
    th.dataset.col = col;
    th.classList.add("sortable");
    th.innerHTML = `<span class="col-label">${col}</span> <span class="sort-arrow"></span>`;
    th.addEventListener("click", () => onHeaderClickP(col));
    theadRow.appendChild(th);
  });

  rows.forEach(row => {
    const tr = document.createElement("tr");
    columns.forEach(col => {
      const td = document.createElement("td");
      td.dataset.col = col;
      const value = row[col];
      td.textContent = value == null ? "" : mapCode(col, value);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

// widoczne kolumny

function renderColumnControlsP() {
  const container = document.getElementById("columnControls");
  container.innerHTML = "";
  allColumnsP.forEach(col => {
    const label = document.createElement("label");
    label.classList.add("col-toggle");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = visibleColumnsP.has(col);
    checkbox.dataset.col = col;
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) visibleColumnsP.add(col);
      else visibleColumnsP.delete(col);
      applyColumnVisibilityP();
    });
    label.appendChild(checkbox);
    label.append(" " + col);
    container.appendChild(label);
  });
}

function applyColumnVisibilityP() {
  const table = document.getElementById("results");
  allColumnsP.forEach(col => {
    const visible = visibleColumnsP.has(col);
    table.querySelectorAll(`[data-col="${col}"]`).forEach(el => {
      el.style.display = visible ? "" : "none";
    });
  });
}

// sortowanie

function onHeaderClickP(col) {
  let entry = sortStateP.find(s => s.column === col);
  if (!entry) {
    entry = { column: col, dir: "ASC" };
    sortStateP.push(entry);
  } else if (entry.dir === "ASC") {
    entry.dir = "DESC";
  } else {
    sortStateP = sortStateP.filter(s => s.column !== col);
  }

  if (entry && sortStateP.includes(entry)) {
    sortStateP = sortStateP.filter(s => s !== entry);
    sortStateP.push(entry);
  }

  currentPageP = 1;
  loadDataP();
}

function updateSortUIP() {
  const headerRow = document.getElementById("header-row");
  headerRow.querySelectorAll("th").forEach(th => {
    const col = th.dataset.col;
    const arrowSpan = th.querySelector(".sort-arrow");
    const entry = sortStateP.find(s => s.column === col);
    if (!entry) arrowSpan.textContent = "";
    else arrowSpan.textContent = entry.dir === "ASC" ? "↑" : "↓";
  });
}

// filtry

function renderFilterControlsP() {
  const container = document.getElementById("filterControls");
  container.innerHTML = "";

  const rangeGroup = document.createElement("div");
  rangeGroup.classList.add("filter-group");
  const rangeTitle = document.createElement("h3");
  rangeTitle.textContent = "Filtry zakresowe (OD–DO) + brak danych";
  rangeGroup.appendChild(rangeTitle);

  const searchGroup = document.createElement("div");
  searchGroup.classList.add("filter-group");
  const searchTitle = document.createElement("h3");
  searchTitle.textContent = "Filtry tekstowe (wyszukiwarka)";
  searchGroup.appendChild(searchTitle);

  const valueGroup = document.createElement("div");
  valueGroup.classList.add("filter-group");
  const valueTitle = document.createElement("h3");
  valueTitle.textContent = "Filtry wartościowe (lista + checkboxy)";
  valueGroup.appendChild(valueTitle);

  // zakresy – liczbowe
  const numericRangeCols = allColumnsP.filter(c => RANGE_NUMERIC_COLUMNS_P.has(c));
  const dateRangeCols = allColumnsP.filter(c => RANGE_DATE_COLUMNS_P.has(c));

  function addRangeFilter(col, type) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("filter-range-item");

    const label = document.createElement("div");
    label.classList.add("range-label");
    label.textContent = col;
    wrapper.appendChild(label);

    const inputsRow = document.createElement("div");
    inputsRow.classList.add("range-input-row");

    const fromInput = document.createElement("input");
    const toInput = document.createElement("input");

    if (type === "number") {
      fromInput.type = "number";
      toInput.type = "number";
    } else if (type === "date") {
      fromInput.type = "date";
      toInput.type = "date";
    }

    fromInput.placeholder = "od";
    toInput.placeholder = "do";
    fromInput.classList.add("range-input");
    toInput.classList.add("range-input");

    const existing = pendingRangeFiltersP[col] || {};
    if (existing.from) fromInput.value = existing.from;
    if (existing.to)   toInput.value = existing.to;

    const nullLabel = document.createElement("label");
    nullLabel.classList.add("range-null-label");
    const nullCb = document.createElement("input");
    nullCb.type = "checkbox";
    nullCb.checked = !!existing.includeNull;
    nullLabel.appendChild(nullCb);
    nullLabel.append(" Wyświetlaj gdy brak danych");

    function updateRange() {
      const from = fromInput.value.trim();
      const to = toInput.value.trim();
      const includeNull = nullCb.checked;
      if (!from && !to && !includeNull) {
        delete pendingRangeFiltersP[col];
      } else {
        pendingRangeFiltersP[col] = { from, to, includeNull };
      }
    }

    fromInput.addEventListener("change", updateRange);
    toInput.addEventListener("change", updateRange);
    nullCb.addEventListener("change", updateRange);

    inputsRow.appendChild(fromInput);
    inputsRow.appendChild(document.createTextNode("–"));
    inputsRow.appendChild(toInput);
    inputsRow.appendChild(nullLabel);

    wrapper.appendChild(inputsRow);
    rangeGroup.appendChild(wrapper);
  }

  numericRangeCols.forEach(col => addRangeFilter(col, "number"));
  dateRangeCols.forEach(col => addRangeFilter(col, "date"));

  // tekstowe wyszukiwarki
  allColumnsP.forEach(col => {
    if (!SEARCH_ONLY_COLUMNS_P.has(col)) return;
    const wrapper = document.createElement("div");
    wrapper.classList.add("filter-text-item");

    const label = document.createElement("label");
    label.textContent = col;
    label.classList.add("filter-text-label");

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "wpisz fragment...";
    input.classList.add("filter-text-input");
    input.dataset.col = col;
    input.value = pendingSearchFiltersP[col] || "";

    input.addEventListener("change", () => {
      const term = input.value.trim();
      if (term) pendingSearchFiltersP[col] = term;
      else delete pendingSearchFiltersP[col];
    });

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    searchGroup.appendChild(wrapper);
  });

  // wartościowe checkboxy
  allColumnsP.forEach(col => {
    if (!VALUE_FILTER_COLUMNS_P.has(col)) return;

    const wrapper = document.createElement("div");
    wrapper.classList.add("filter-column");

    const toggleLabel = document.createElement("label");
    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.dataset.col = col;
    if (pendingFiltersP[col] && pendingFiltersP[col].length > 0) {
      toggle.checked = true;
    }
    toggle.addEventListener("change", async () => {
      const panel = wrapper.querySelector(".filter-values");
      if (toggle.checked) {
        panel.style.display = "block";
        if (!distinctCacheP[col]) {
          const values = await fetch(`/pojazdy/distinct/${col}`).then(r => r.json());
          distinctCacheP[col] = values;
          renderFilterOptionsP(col, values, wrapper);
        } else {
          renderFilterOptionsP(col, distinctCacheP[col], wrapper);
        }
      } else {
        panel.style.display = "none";
        delete pendingFiltersP[col];
      }
    });
    toggleLabel.appendChild(toggle);
    toggleLabel.append(` filtruj po ${col}`);
    wrapper.appendChild(toggleLabel);

    const panel = document.createElement("div");
    panel.classList.add("filter-values");
    panel.dataset.col = col;
    panel.style.display = (pendingFiltersP[col] && pendingFiltersP[col].length > 0) ? "block" : "none";

    const search = document.createElement("input");
    search.type = "text";
    search.placeholder = "Filtruj listę wartości…";
    search.classList.add("filter-search");
    search.dataset.col = col;
    search.addEventListener("input", () => {
      const term = search.value.toLowerCase();
      panel.querySelectorAll(".filter-option-label").forEach(label => {
        const text = label.dataset.valueText || "";
        label.style.display = text.includes(term) ? "" : "none";
      });
    });

    const optionsDiv = document.createElement("div");
    optionsDiv.classList.add("filter-options");
    optionsDiv.dataset.col = col;

    panel.appendChild(search);
    panel.appendChild(optionsDiv);
    wrapper.appendChild(panel);

    valueGroup.appendChild(wrapper);

    if (distinctCacheP[col]) {
      renderFilterOptionsP(col, distinctCacheP[col], wrapper);
    } else if (panel.style.display === "block") {
      fetch(`/pojazdy/distinct/${col}`)
        .then(r => r.json())
        .then(values => {
          distinctCacheP[col] = values;
          renderFilterOptionsP(col, values, wrapper);
        });
    }
  });

  container.appendChild(rangeGroup);
  container.appendChild(searchGroup);
  container.appendChild(valueGroup);
}

function renderFilterOptionsP(col, values, wrapper) {
  const optionsDiv = wrapper.querySelector(".filter-options");
  optionsDiv.innerHTML = "";
  const selected = new Set(pendingFiltersP[col] || []);

  values.forEach(val => {
    if (val == null || val === "") return;

    // NOWOŚĆ: używamy mapCode do wyświetlania
    const mapped = (typeof mapCode === "function") ? mapCode(col, val) : String(val);

    const label = document.createElement("label");
    label.classList.add("filter-option-label");
    label.dataset.valueText = mapped.toLowerCase();

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = val;                // wartość surowa, tak jak wcześniej
    cb.dataset.col = col;
    cb.classList.add("filter-option");
    cb.checked = selected.has(val);

    cb.addEventListener("change", () => {
      const colSel = [];
      wrapper.querySelectorAll('.filter-option:checked').forEach(ch => {
        colSel.push(ch.value);
      });
      if (colSel.length > 0) pendingFiltersP[col] = colSel;
      else delete pendingFiltersP[col];
    });

    label.appendChild(cb);
    const textSpan = document.createElement("span");
    textSpan.textContent = mapped;  // zamiast surowego `val`
    label.appendChild(textSpan);

    optionsDiv.appendChild(label);
  });
}


// paginacja

function updatePaginationUIP() {
  const totalRecordsInfo = document.getElementById("totalRecordsInfo");
  totalRecordsInfo.textContent = `Łącznie ${totalRecordsP} rekordów (po filtrach).`;

  const totalPagesSpan = document.getElementById("totalPages");
  totalPagesSpan.textContent = totalPagesP || 0;

  const pageInput = document.getElementById("pageInput");
  pageInput.value = currentPageP;
  pageInput.min = 1;
  pageInput.max = totalPagesP || 1;

  const bottomInfo = document.getElementById("bottomPageInfo");
  bottomInfo.textContent = `Strona ${currentPageP} z ${totalPagesP || 0}`;
}

function attachGlobalHandlersP() {
  const pageSizeSelect = document.getElementById("pageSizeSelect");
  pageSizeSelect.value = String(currentPageSizeP);
  pageSizeSelect.addEventListener("change", () => {
    currentPageSizeP = parseInt(pageSizeSelect.value, 10) || 100;
    if (currentPageSizeP > 100) currentPageSizeP = 100;
    currentPageP = 1;
    loadDataP();
  });

  document.getElementById("firstPage").addEventListener("click", () => {
    if (currentPageP > 1) {
      currentPageP = 1;
      loadDataP();
    }
  });

  document.getElementById("prevPage").addEventListener("click", () => {
    if (currentPageP > 1) {
      currentPageP--;
      loadDataP();
    }
  });

  document.getElementById("nextPage").addEventListener("click", () => {
    if (totalPagesP && currentPageP < totalPagesP) {
      currentPageP++;
      loadDataP();
    }
  });

  document.getElementById("lastPage").addEventListener("click", () => {
    if (totalPagesP && currentPageP < totalPagesP) {
      currentPageP = totalPagesP;
      loadDataP();
    }
  });

  const pageInput = document.getElementById("pageInput");
  pageInput.addEventListener("change", () => {
    let val = parseInt(pageInput.value, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (totalPagesP && val > totalPagesP) val = totalPagesP;
    currentPageP = val;
    loadDataP();
  });

  document.getElementById("applyFiltersBtn").addEventListener("click", () => {
    currentFiltersP = deepCopyP(pendingFiltersP);
    currentSearchFiltersP = deepCopyP(pendingSearchFiltersP);
    currentRangeFiltersP = deepCopyP(pendingRangeFiltersP);
    currentPageP = 1;
    loadDataP();
  });

  document.getElementById("clearFiltersBtn").addEventListener("click", () => {
    pendingFiltersP = {};
    pendingSearchFiltersP = {};
    pendingRangeFiltersP = {};
    currentFiltersP = {};
    currentSearchFiltersP = {};
    currentRangeFiltersP = {};
    // ale kontekst (ZSZD_ID) przywracamy
    if (contextFiltersP.ZSZD_ID) {
      pendingFiltersP.ZSZD_ID = [...contextFiltersP.ZSZD_ID];
      currentFiltersP.ZSZD_ID = [...contextFiltersP.ZSZD_ID];
    }
    currentPageP = 1;
    renderFilterControlsP();
    loadDataP();
  });
}

// podsumowanie filtrów

function updateActiveFiltersSummaryP() {
  const container = document.getElementById("activeFiltersSummary");
  const parts = [];

  const effectiveFilters = deepCopyP(currentFiltersP);
  Object.keys(contextFiltersP).forEach(col => {
    effectiveFilters[col] = contextFiltersP[col];
  });

  Object.keys(effectiveFilters).forEach(col => {
    const values = effectiveFilters[col] || [];
    if (values.length > 0) {
      parts.push(`${col} ∈ [${values.join(", ")}]`);
    }
  });

  Object.keys(currentSearchFiltersP).forEach(col => {
    const term = currentSearchFiltersP[col];
    if (term) parts.push(`${col} zawiera "${term}"`);
  });

  Object.keys(currentRangeFiltersP).forEach(col => {
    const r = currentRangeFiltersP[col] || {};
    const frag = [];
    if (r.from) frag.push(`od ${r.from}`);
    if (r.to) frag.push(`do ${r.to}`);
    let txt = `${col}: ${frag.join(" , ") || "zakres pusty"}`;
    if (r.includeNull) txt += " + brak danych";
    parts.push(txt);
  });

  if (parts.length === 0) {
    container.textContent = "Obecnie zastosowane filtry: brak";
  } else {
    container.textContent = "Obecnie zastosowane filtry: " + parts.join("; ");
  }
}

// start
initContextP();
loadDataP().catch(err => {
  console.error(err);
  const info = document.getElementById("bottomPageInfo");
  if (info) info.textContent = "Błąd ładowania danych (szczegóły w konsoli).";
});

// public/uczestnicyApp.js – uczestnicy (osoby)

let currentPageU = 1;
let currentPageSizeU = 100;

let currentFiltersU = {};
let pendingFiltersU = {};

let currentSearchFiltersU = {};
let pendingSearchFiltersU = {};

let currentRangeFiltersU = {};
let pendingRangeFiltersU = {};

let sortStateU = [];
let allColumnsU = [];
let visibleColumnsU = new Set();
const distinctCacheU = {};
let totalPagesU = 0;
let totalRecordsU = 0;

let contextFiltersU = {};

// ----- KONFIG KOLUMN DLA UCZESTNIKÓW/OSÓB -----

const SEARCH_ONLY_COLUMNS_U = new Set([
  "ID",
  "ZSZD_ID",
  "ZSPO_ID"
]);

const RANGE_DATE_COLUMNS_U = new Set([
  "DATA_UR",
  "DataUtworzenia",
  "DataMod"
]);

const RANGE_NUMERIC_COLUMNS_U = new Set([
  "LICZBA_LAT_KIEROWANIA"
]);

const RANGE_COLUMNS_U = new Set([
  ...RANGE_DATE_COLUMNS_U,
  ...RANGE_NUMERIC_COLUMNS_U
]);

const VALUE_FILTER_COLUMNS_U = new Set([
  "PLEC",
  "SOBY_KOD",
  "SSRU_KOD",
  "SUSU_KOD",
  "SRUZ_KOD",
  "STUC_KOD",
  "MIEJSCE_W_POJ"
]);

function deepCopyU(obj) {
  return JSON.parse(JSON.stringify(obj || {}));
}

function initContextU() {
  const params = new URLSearchParams(window.location.search);
  const zdId = params.get("zdarzenieId");
  const info = document.getElementById("activeContextInfo");
  if (zdId) {
    contextFiltersU.ZSZD_ID = [zdId];
    pendingFiltersU.ZSZD_ID = [zdId];
    currentFiltersU.ZSZD_ID = [zdId];
    if (info) {
      info.textContent = `Pokazuję uczestników powiązanych ze zdarzeniem ID = ${zdId} (ZSZD_ID = ${zdId}).`;
    }
  } else {
    if (info) {
      info.textContent = "Brak aktywnego filtra po zdarzeniu. Wyświetlam wszystkich uczestników (stronicowanych).";
    }
  }
}

function buildQueryParamsU() {
  const params = new URLSearchParams();
  params.append("page", currentPageU.toString());
  params.append("pageSize", currentPageSizeU.toString());

  const effectiveFilters = deepCopyU(currentFiltersU);
  Object.keys(contextFiltersU).forEach(col => {
    effectiveFilters[col] = contextFiltersU[col];
  });

  if (Object.keys(effectiveFilters).length > 0) {
    params.append("filters", JSON.stringify(effectiveFilters));
  }
  if (Object.keys(currentSearchFiltersU).length > 0) {
    params.append("search", JSON.stringify(currentSearchFiltersU));
  }
  if (Object.keys(currentRangeFiltersU).length > 0) {
    params.append("range", JSON.stringify(currentRangeFiltersU));
  }
  if (sortStateU.length > 0) {
    params.append("sort", JSON.stringify(sortStateU));
  }
  return params;
}

async function loadDataU() {
  const requestedPage = currentPageU;
  const params = buildQueryParamsU();
  const res = await fetch(`/uczestnicy?${params.toString()}`);
  const payload = await res.json();

  if (!payload || !Array.isArray(payload.rows)) {
    renderTableU([], []);
    document.getElementById("bottomPageInfo").textContent = "Brak danych";
    return;
  }

  const rows = payload.rows;
  totalRecordsU = payload.total || 0;
  currentPageU = payload.page || 1;
  currentPageSizeU = payload.pageSize || currentPageSizeU;
  totalPagesU = payload.totalPages || 0;

  if (requestedPage > 1 && rows.length === 0) {
    currentPageU = Math.max(1, requestedPage - 1);
  }

  if (rows.length === 0) {
    renderTableU([], []);
  } else {
    if (allColumnsU.length === 0) {
      allColumnsU = Object.keys(rows[0]);
      visibleColumnsU = new Set(allColumnsU);
      renderColumnControlsU();
      renderFilterControlsU();
      attachGlobalHandlersU();
    }
    renderTableU(allColumnsU, rows);
    applyColumnVisibilityU();
    updateSortUIU();
  }

  updatePaginationUIU();
  updateActiveFiltersSummaryU();
}

function renderTableU(columns, rows) {
  const theadRow = document.getElementById("header-row");
  const tbody = document.getElementById("body-rows");

  theadRow.innerHTML = "";
  tbody.innerHTML = "";

  columns.forEach(col => {
    const th = document.createElement("th");
    th.dataset.col = col;
    th.classList.add("sortable");
    th.innerHTML = `<span class="col-label">${col}</span> <span class="sort-arrow"></span>`;
    th.addEventListener("click", () => onHeaderClickU(col));
    theadRow.appendChild(th);
  });

  rows.forEach(row => {
    const tr = document.createElement("tr");
    columns.forEach(col => {
      const td = document.createElement("td");
      td.dataset.col = col;
      const value = row[col];
      td.textContent = value == null ? "" : value;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

// widoczne kolumny

function renderColumnControlsU() {
  const container = document.getElementById("columnControls");
  container.innerHTML = "";
  allColumnsU.forEach(col => {
    const label = document.createElement("label");
    label.classList.add("col-toggle");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = visibleColumnsU.has(col);
    cb.dataset.col = col;
    cb.addEventListener("change", () => {
      if (cb.checked) visibleColumnsU.add(col);
      else visibleColumnsU.delete(col);
      applyColumnVisibilityU();
    });
    label.appendChild(cb);
    label.append(" " + col);
    container.appendChild(label);
  });
}

function applyColumnVisibilityU() {
  const table = document.getElementById("results");
  allColumnsU.forEach(col => {
    const visible = visibleColumnsU.has(col);
    table.querySelectorAll(`[data-col="${col}"]`).forEach(el => {
      el.style.display = visible ? "" : "none";
    });
  });
}

// sortowanie

function onHeaderClickU(col) {
  let entry = sortStateU.find(s => s.column === col);
  if (!entry) {
    entry = { column: col, dir: "ASC" };
    sortStateU.push(entry);
  } else if (entry.dir === "ASC") {
    entry.dir = "DESC";
  } else {
    sortStateU = sortStateU.filter(s => s.column !== col);
  }

  if (entry && sortStateU.includes(entry)) {
    sortStateU = sortStateU.filter(s => s !== entry);
    sortStateU.push(entry);
  }

  currentPageU = 1;
  loadDataU();
}

function updateSortUIU() {
  const headerRow = document.getElementById("header-row");
  headerRow.querySelectorAll("th").forEach(th => {
    const col = th.dataset.col;
    const arrowSpan = th.querySelector(".sort-arrow");
    const entry = sortStateU.find(s => s.column === col);
    if (!entry) arrowSpan.textContent = "";
    else arrowSpan.textContent = entry.dir === "ASC" ? "↑" : "↓";
  });
}

// filtry

function renderFilterControlsU() {
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

  const numericRangeCols = allColumnsU.filter(c => RANGE_NUMERIC_COLUMNS_U.has(c));
  const dateRangeCols = allColumnsU.filter(c => RANGE_DATE_COLUMNS_U.has(c));

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

    const existing = pendingRangeFiltersU[col] || {};
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
        delete pendingRangeFiltersU[col];
      } else {
        pendingRangeFiltersU[col] = { from, to, includeNull };
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

  // tekstowe
  allColumnsU.forEach(col => {
    if (!SEARCH_ONLY_COLUMNS_U.has(col)) return;

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
    input.value = pendingSearchFiltersU[col] || "";

    input.addEventListener("change", () => {
      const term = input.value.trim();
      if (term) pendingSearchFiltersU[col] = term;
      else delete pendingSearchFiltersU[col];
    });

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    searchGroup.appendChild(wrapper);
  });

  // wartościowe
  allColumnsU.forEach(col => {
    if (!VALUE_FILTER_COLUMNS_U.has(col)) return;

    const wrapper = document.createElement("div");
    wrapper.classList.add("filter-column");

    const toggleLabel = document.createElement("label");
    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.dataset.col = col;
    if (pendingFiltersU[col] && pendingFiltersU[col].length > 0) {
      toggle.checked = true;
    }
    toggle.addEventListener("change", async () => {
      const panel = wrapper.querySelector(".filter-values");
      if (toggle.checked) {
        panel.style.display = "block";
        if (!distinctCacheU[col]) {
          const values = await fetch(`/uczestnicy/distinct/${col}`).then(r => r.json());
          distinctCacheU[col] = values;
          renderFilterOptionsU(col, values, wrapper);
        } else {
          renderFilterOptionsU(col, distinctCacheU[col], wrapper);
        }
      } else {
        panel.style.display = "none";
        delete pendingFiltersU[col];
      }
    });
    toggleLabel.appendChild(toggle);
    toggleLabel.append(` filtruj po ${col}`);
    wrapper.appendChild(toggleLabel);

    const panel = document.createElement("div");
    panel.classList.add("filter-values");
    panel.dataset.col = col;
    panel.style.display = (pendingFiltersU[col] && pendingFiltersU[col].length > 0) ? "block" : "none";

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

    if (distinctCacheU[col]) {
      renderFilterOptionsU(col, distinctCacheU[col], wrapper);
    } else if (panel.style.display === "block") {
      fetch(`/uczestnicy/distinct/${col}`)
        .then(r => r.json())
        .then(values => {
          distinctCacheU[col] = values;
          renderFilterOptionsU(col, values, wrapper);
        });
    }
  });

  container.appendChild(rangeGroup);
  container.appendChild(searchGroup);
  container.appendChild(valueGroup);
}

function renderFilterOptionsU(col, values, wrapper) {
  const optionsDiv = wrapper.querySelector(".filter-options");
  optionsDiv.innerHTML = "";
  const selected = new Set(pendingFiltersU[col] || []);

  values.forEach(val => {
    if (val == null || val === "") return;
    const label = document.createElement("label");
    label.classList.add("filter-option-label");
    label.dataset.valueText = String(val).toLowerCase();

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = val;
    cb.dataset.col = col;
    cb.classList.add("filter-option");
    cb.checked = selected.has(val);

    cb.addEventListener("change", () => {
      const colSel = [];
      wrapper.querySelectorAll('.filter-option:checked').forEach(ch => {
        colSel.push(ch.value);
      });
      if (colSel.length > 0) pendingFiltersU[col] = colSel;
      else delete pendingFiltersU[col];
    });

    label.appendChild(cb);
    const textSpan = document.createElement("span");
    textSpan.textContent = val;
    label.appendChild(textSpan);

    optionsDiv.appendChild(label);
  });
}

// paginacja

function updatePaginationUIU() {
  const totalRecordsInfo = document.getElementById("totalRecordsInfo");
  totalRecordsInfo.textContent = `Łącznie ${totalRecordsU} rekordów (po filtrach).`;

  const totalPagesSpan = document.getElementById("totalPages");
  totalPagesSpan.textContent = totalPagesU || 0;

  const pageInput = document.getElementById("pageInput");
  pageInput.value = currentPageU;
  pageInput.min = 1;
  pageInput.max = totalPagesU || 1;

  const bottomInfo = document.getElementById("bottomPageInfo");
  bottomInfo.textContent = `Strona ${currentPageU} z ${totalPagesU || 0}`;
}

function attachGlobalHandlersU() {
  const pageSizeSelect = document.getElementById("pageSizeSelect");
  pageSizeSelect.value = String(currentPageSizeU);
  pageSizeSelect.addEventListener("change", () => {
    currentPageSizeU = parseInt(pageSizeSelect.value, 10) || 100;
    if (currentPageSizeU > 100) currentPageSizeU = 100;
    currentPageU = 1;
    loadDataU();
  });

  document.getElementById("firstPage").addEventListener("click", () => {
    if (currentPageU > 1) {
      currentPageU = 1;
      loadDataU();
    }
  });

  document.getElementById("prevPage").addEventListener("click", () => {
    if (currentPageU > 1) {
      currentPageU--;
      loadDataU();
    }
  });

  document.getElementById("nextPage").addEventListener("click", () => {
    if (totalPagesU && currentPageU < totalPagesU) {
      currentPageU++;
      loadDataU();
    }
  });

  document.getElementById("lastPage").addEventListener("click", () => {
    if (totalPagesU && currentPageU < totalPagesU) {
      currentPageU = totalPagesU;
      loadDataU();
    }
  });

  const pageInput = document.getElementById("pageInput");
  pageInput.addEventListener("change", () => {
    let val = parseInt(pageInput.value, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (totalPagesU && val > totalPagesU) val = totalPagesU;
    currentPageU = val;
    loadDataU();
  });

  document.getElementById("applyFiltersBtn").addEventListener("click", () => {
    currentFiltersU = deepCopyU(pendingFiltersU);
    currentSearchFiltersU = deepCopyU(pendingSearchFiltersU);
    currentRangeFiltersU = deepCopyU(pendingRangeFiltersU);
    currentPageU = 1;
    loadDataU();
  });

  document.getElementById("clearFiltersBtn").addEventListener("click", () => {
    pendingFiltersU = {};
    pendingSearchFiltersU = {};
    pendingRangeFiltersU = {};
    currentFiltersU = {};
    currentSearchFiltersU = {};
    currentRangeFiltersU = {};
    if (contextFiltersU.ZSZD_ID) {
      pendingFiltersU.ZSZD_ID = [...contextFiltersU.ZSZD_ID];
      currentFiltersU.ZSZD_ID = [...contextFiltersU.ZSZD_ID];
    }
    currentPageU = 1;
    renderFilterControlsU();
    loadDataU();
  });
}

// podsumowanie filtrów

function updateActiveFiltersSummaryU() {
  const container = document.getElementById("activeFiltersSummary");
  const parts = [];

  const effectiveFilters = deepCopyU(currentFiltersU);
  Object.keys(contextFiltersU).forEach(col => {
    effectiveFilters[col] = contextFiltersU[col];
  });

  Object.keys(effectiveFilters).forEach(col => {
    const values = effectiveFilters[col] || [];
    if (values.length > 0) {
      parts.push(`${col} ∈ [${values.join(", ")}]`);
    }
  });

  Object.keys(currentSearchFiltersU).forEach(col => {
    const term = currentSearchFiltersU[col];
    if (term) parts.push(`${col} zawiera "${term}"`);
  });

  Object.keys(currentRangeFiltersU).forEach(col => {
    const r = currentRangeFiltersU[col] || {};
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
initContextU();
loadDataU().catch(err => {
  console.error(err);
  const info = document.getElementById("bottomPageInfo");
  if (info) info.textContent = "Błąd ładowania danych (szczegóły w konsoli).";
});

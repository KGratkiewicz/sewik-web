// public/app.js – zdarzenia

let currentPage = 1;
let currentPageSize = 100;

let currentFilters = {};        // IN (checkboxy) – zastosowane
let pendingFilters = {};

let currentSearchFilters = {};  // LIKE – zastosowane
let pendingSearchFilters = {};

let currentRangeFilters = {};   // zakresy – zastosowane
let pendingRangeFilters = {};

let sortState = [];             // [{column, dir}]
let allColumns = [];
let visibleColumns = new Set();
const distinctCache = {};
let totalPagesGlobal = 0;
let totalRecordsGlobal = 0;

/* ===================== KONFIGURACJA TYPÓW KOLUMN ===================== */

// filtry TYLKO tekstowe (wyszukiwarka)
const SEARCH_ONLY_COLUMNS = new Set([
  "ID",
  "JEDNOSTKA_MIEJSCA",
  "JEDNOSTKA_LIKWIDUJACA",
  "JEDNOSTKA_OPERATORA",
  "NR_KW",
  "KOD_GUS",
  "GPS_X_GUS",
  "GPS_Y_GUS",
  "NUMER_DOMU",
  "ULICA_ADRES",
  "MIEJSCOWOSC",
  "ZSSD_KOD",
  "WSP_GPS_X",
  "WSP_GPS_Y"
]);

// zakres – DATY
const RANGE_DATE_COLUMNS = new Set([
  "DataUtworzenia",
  "DataMod",
  "DATA_ZDARZENIA",
  "DATA_ZDARZ",
  "DATA_ZGLOSZENIA",
  "DATA_PRZYJAZDU"
]);

// zakres – CZASY
const RANGE_TIME_COLUMNS = new Set([
  "GODZINA_ZDARZ"
]);

// zakres – LICZBY
const RANGE_NUMERIC_COLUMNS = new Set([
  "ROK",
  "KM_HM",
  "PREDKOSC_DOPUSZCZALNA",
  "LICZBA_POJAZDOW",
  "LICZBA_UCZESTNIKOW"
]);

const RANGE_COLUMNS = new Set([
  ...RANGE_DATE_COLUMNS,
  ...RANGE_TIME_COLUMNS,
  ...RANGE_NUMERIC_COLUMNS
]);

// filtry wartościowe (lista + checkboxy) – TYLKO dla tych kolumn
const VALUE_FILTER_COLUMNS = new Set([
  "SzkicZdarzenia",
  "WOJ",
  "GMINA",
  "POWIAT",
  "SZOS_KOD",
  "SZOS_TABK_TYPE",
  "SZRD_KOD",
  "SZRD_TABK_TYPE",
  "DROGA_PUBLICZNA"
]);

function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj || {}));
}

function buildQueryParams() {
  const params = new URLSearchParams();
  params.append("page", currentPage.toString());
  params.append("pageSize", currentPageSize.toString());

  if (Object.keys(currentFilters).length > 0) {
    params.append("filters", JSON.stringify(currentFilters));
  }
  if (Object.keys(currentSearchFilters).length > 0) {
    params.append("search", JSON.stringify(currentSearchFilters));
  }
  if (Object.keys(currentRangeFilters).length > 0) {
    params.append("range", JSON.stringify(currentRangeFilters));
  }
  if (sortState.length > 0) {
    params.append("sort", JSON.stringify(sortState));
  }
  return params;
}

/* ===================== ŁADOWANIE DANYCH ===================== */

async function loadData() {
  const requestedPage = currentPage;
  const params = buildQueryParams();
  const res = await fetch(`/zdarzenia?${params.toString()}`);
  const payload = await res.json();

  if (!payload || !Array.isArray(payload.rows)) {
    renderTable([], []);
    document.getElementById("pageInfo") &&
      (document.getElementById("pageInfo").textContent = `Brak danych`);
    return;
  }

  const rows = payload.rows;
  totalRecordsGlobal = payload.total || 0;
  currentPage = payload.page || 1;
  currentPageSize = payload.pageSize || currentPageSize;
  totalPagesGlobal = payload.totalPages || 0;

  if (requestedPage > 1 && rows.length === 0) {
    currentPage = Math.max(1, requestedPage - 1);
  }

  if (rows.length === 0) {
    renderTable([], []);
  } else {
    if (allColumns.length === 0) {
      allColumns = Object.keys(rows[0]);
      visibleColumns = new Set(allColumns);
      renderColumnControls();
      renderFilterControls();
      attachGlobalHandlers();
    }

    renderTable(allColumns, rows);
    applyColumnVisibility();
    updateSortUI();
  }

  updatePaginationUI();
  updateActiveFiltersSummary();
}

/* ===================== TABELA ===================== */

function renderTable(columns, rows) {
  const theadRow = document.getElementById("header-row");
  const tbody = document.getElementById("body-rows");

  theadRow.innerHTML = "";
  tbody.innerHTML = "";

  columns.forEach(col => {
    const th = document.createElement("th");
    th.dataset.col = col;
    th.classList.add("sortable");
    th.innerHTML = `<span class="col-label">${col}</span> <span class="sort-arrow"></span>`;
    th.addEventListener("click", () => onHeaderClick(col));
    theadRow.appendChild(th);
  });

  rows.forEach(row => {
    const tr = document.createElement("tr");
    columns.forEach(col => {
      const td = document.createElement("td");
      td.dataset.col = col;
      const value = row[col];

      // specjalne traktowanie kolumn z licznikami:
      if (col === "LICZBA_POJAZDOW" && row["ID"] != null) {
        if (value != null && value !== "") {
          const a = document.createElement("a");
          a.href = `/pojazdy/view?zdarzenieId=${encodeURIComponent(row["ID"])}`;
          a.target = "_blank";
          a.textContent = value;
          td.appendChild(a);
        } else {
          td.textContent = "";
        }
      } else if (col === "LICZBA_UCZESTNIKOW" && row["ID"] != null) {
        if (value != null && value !== "") {
          const a = document.createElement("a");
          a.href = `/uczestnicy/view?zdarzenieId=${encodeURIComponent(row["ID"])}`;
          a.target = "_blank";
          a.textContent = value;
          td.appendChild(a);
        } else {
          td.textContent = "";
        }
      } else {
        td.textContent = value == null ? "" : value;
      }

      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

/* ===================== WIDOCZNOŚĆ KOLUMN ===================== */

function renderColumnControls() {
  const container = document.getElementById("columnControls");
  container.innerHTML = "";
  allColumns.forEach(col => {
    const label = document.createElement("label");
    label.classList.add("col-toggle");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = visibleColumns.has(col);
    checkbox.dataset.col = col;
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        visibleColumns.add(col);
      } else {
        visibleColumns.delete(col);
      }
      applyColumnVisibility();
    });
    label.appendChild(checkbox);
    label.append(" " + col);
    container.appendChild(label);
  });
}

function applyColumnVisibility() {
  const table = document.getElementById("results");
  allColumns.forEach(col => {
    const visible = visibleColumns.has(col);
    table.querySelectorAll(`[data-col="${col}"]`).forEach(el => {
      el.style.display = visible ? "" : "none";
    });
  });
}

/* ===================== SORTOWANIE ===================== */

function onHeaderClick(col) {
  let entry = sortState.find(s => s.column === col);
  if (!entry) {
    entry = { column: col, dir: "ASC" };
    sortState.push(entry);
  } else if (entry.dir === "ASC") {
    entry.dir = "DESC";
  } else if (entry.dir === "DESC") {
    sortState = sortState.filter(s => s.column !== col);
  }

  if (entry && sortState.includes(entry)) {
    sortState = sortState.filter(s => s !== entry);
    sortState.push(entry);
  }

  currentPage = 1;
  loadData();
}

function updateSortUI() {
  const headerRow = document.getElementById("header-row");
  headerRow.querySelectorAll("th").forEach(th => {
    const col = th.dataset.col;
    const arrowSpan = th.querySelector(".sort-arrow");
    const entry = sortState.find(s => s.column === col);
    if (!entry) arrowSpan.textContent = "";
    else arrowSpan.textContent = entry.dir === "ASC" ? "↑" : "↓";
  });
}

/* ===================== FILTROWANIE ===================== */

function renderFilterControls() {
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

  // --- tutaj ustalamy KOLEJNOŚĆ zakresów: NUMERY -> DATY -> GODZINY ---
  const numericRangeCols = allColumns.filter(c => RANGE_NUMERIC_COLUMNS.has(c));
  const dateRangeCols    = allColumns.filter(c => RANGE_DATE_COLUMNS.has(c));
  const timeRangeCols    = allColumns.filter(c => RANGE_TIME_COLUMNS.has(c));

  // pomocnicza funkcja do rysowania jednego filtra zakresowego
  function addRangeFilter(col) {
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

    if (RANGE_NUMERIC_COLUMNS.has(col)) {
      fromInput.type = "number";
      toInput.type = "number";
      if (col === "KM_HM") {
        fromInput.step = "0.1";
        toInput.step = "0.1";
      }
    } else if (RANGE_DATE_COLUMNS.has(col)) {
      fromInput.type = "date";
      toInput.type = "date";
    } else if (RANGE_TIME_COLUMNS.has(col)) {
      fromInput.type = "time";
      toInput.type = "time";
    } else {
      fromInput.type = "text";
      toInput.type = "text";
    }

    fromInput.placeholder = "od";
    toInput.placeholder = "do";
    fromInput.classList.add("range-input");
    toInput.classList.add("range-input");

    const existing = pendingRangeFilters[col] || {};
    if (existing.from) fromInput.value = existing.from;
    if (existing.to)   toInput.value   = existing.to;

    const nullLabel = document.createElement("label");
    nullLabel.classList.add("range-null-label");
    const nullCb = document.createElement("input");
    nullCb.type = "checkbox";
    nullCb.checked = !!existing.includeNull;
    nullLabel.appendChild(nullCb);
    nullLabel.append(" Wyświetlaj gdy brak danych");

    function updateRange() {
      const from = fromInput.value.trim();
      const to   = toInput.value.trim();
      const includeNull = nullCb.checked;
      if (!from && !to && !includeNull) {
        delete pendingRangeFilters[col];
      } else {
        pendingRangeFilters[col] = { from, to, includeNull };
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

  // 1) najpierw zakresy LICZBOWE
  numericRangeCols.forEach(addRangeFilter);
  // 2) potem zakresy DAT
  dateRangeCols.forEach(addRangeFilter);
  // 3) na końcu zakresy GODZIN
  timeRangeCols.forEach(addRangeFilter);

  // --- FILTRY TEKSTOWE (wyszukiwarki) ---
  allColumns.forEach(col => {
    if (!SEARCH_ONLY_COLUMNS.has(col)) return;

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
    input.value = pendingSearchFilters[col] || "";

    input.addEventListener("change", () => {
      const term = input.value.trim();
      if (term) pendingSearchFilters[col] = term;
      else delete pendingSearchFilters[col];
    });

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    searchGroup.appendChild(wrapper);
  });

  // --- FILTRY WARTOŚCIOWE (lista + checkboxy) tylko dla VALUE_FILTER_COLUMNS ---
  allColumns.forEach(col => {
    if (!VALUE_FILTER_COLUMNS.has(col)) return;

    const wrapper = document.createElement("div");
    wrapper.classList.add("filter-column");

    const toggleLabel = document.createElement("label");
    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.dataset.col = col;
    if (pendingFilters[col] && pendingFilters[col].length > 0) {
      toggle.checked = true;
    }
    toggle.addEventListener("change", async () => {
      const panel = wrapper.querySelector(".filter-values");
      if (toggle.checked) {
        panel.style.display = "block";
        if (!distinctCache[col]) {
          const values = await fetch(`/zdarzenia/distinct/${col}`).then(r => r.json());
          distinctCache[col] = values;
          renderFilterOptions(col, values, wrapper);
        } else {
          renderFilterOptions(col, distinctCache[col], wrapper);
        }
      } else {
        panel.style.display = "none";
        delete pendingFilters[col];
      }
    });
    toggleLabel.appendChild(toggle);
    toggleLabel.append(` filtruj po ${col}`);
    wrapper.appendChild(toggleLabel);

    const panel = document.createElement("div");
    panel.classList.add("filter-values");
    panel.dataset.col = col;
    panel.style.display = (pendingFilters[col] && pendingFilters[col].length > 0) ? "block" : "none";

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

    if (distinctCache[col]) {
      renderFilterOptions(col, distinctCache[col], wrapper);
    } else if (panel.style.display === "block") {
      fetch(`/zdarzenia/distinct/${col}`)
        .then(r => r.json())
        .then(values => {
          distinctCache[col] = values;
          renderFilterOptions(col, values, wrapper);
        });
    }
  });

  container.appendChild(rangeGroup);
  container.appendChild(searchGroup);
  container.appendChild(valueGroup);
}


function renderFilterOptions(col, values, wrapper) {
  const optionsDiv = wrapper.querySelector(".filter-options");
  optionsDiv.innerHTML = "";
  const selected = new Set(pendingFilters[col] || []);

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
      if (colSel.length > 0) pendingFilters[col] = colSel;
      else delete pendingFilters[col];
    });

    label.appendChild(cb);
    const textSpan = document.createElement("span");
    textSpan.textContent = val;
    label.appendChild(textSpan);

    optionsDiv.appendChild(label);
  });
}

/* ===================== PAGINACJA / TOOLBAR ===================== */

function updatePaginationUI() {
  const totalRecordsInfo = document.getElementById("totalRecordsInfo");
  totalRecordsInfo.textContent = `Łącznie ${totalRecordsGlobal} rekordów (po filtrach).`;

  const totalPagesSpan = document.getElementById("totalPages");
  totalPagesSpan.textContent = totalPagesGlobal || 0;

  const pageInput = document.getElementById("pageInput");
  pageInput.value = currentPage;
  pageInput.min = 1;
  pageInput.max = totalPagesGlobal || 1;

  const bottomInfo = document.getElementById("bottomPageInfo");
  bottomInfo.textContent = `Strona ${currentPage} z ${totalPagesGlobal || 0}`;
}

function attachGlobalHandlers() {
  const pageSizeSelect = document.getElementById("pageSizeSelect");
  pageSizeSelect.value = String(currentPageSize);
  pageSizeSelect.addEventListener("change", () => {
    currentPageSize = parseInt(pageSizeSelect.value, 10) || 100;
    if (currentPageSize > 100) currentPageSize = 100;
    currentPage = 1;
    loadData();
  });

  document.getElementById("firstPage").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage = 1;
      loadData();
    }
  });

  document.getElementById("prevPage").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      loadData();
    }
  });

  document.getElementById("nextPage").addEventListener("click", () => {
    if (totalPagesGlobal && currentPage < totalPagesGlobal) {
      currentPage++;
      loadData();
    }
  });

  document.getElementById("lastPage").addEventListener("click", () => {
    if (totalPagesGlobal && currentPage < totalPagesGlobal) {
      currentPage = totalPagesGlobal;
      loadData();
    }
  });

  const pageInput = document.getElementById("pageInput");
  pageInput.addEventListener("change", () => {
    let val = parseInt(pageInput.value, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (totalPagesGlobal && val > totalPagesGlobal) val = totalPagesGlobal;
    currentPage = val;
    loadData();
  });

  document.getElementById("applyFiltersBtn").addEventListener("click", () => {
    currentFilters = deepCopy(pendingFilters);
    currentSearchFilters = deepCopy(pendingSearchFilters);
    currentRangeFilters = deepCopy(pendingRangeFilters);
    currentPage = 1;
    loadData();
  });

  document.getElementById("clearFiltersBtn").addEventListener("click", () => {
    pendingFilters = {};
    pendingSearchFilters = {};
    pendingRangeFilters = {};
    currentFilters = {};
    currentSearchFilters = {};
    currentRangeFilters = {};
    currentPage = 1;
    renderFilterControls();
    loadData();
  });
}

/* ===================== PODSUMOWANIE FILTRÓW ===================== */

function updateActiveFiltersSummary() {
  const container = document.getElementById("activeFiltersSummary");
  const parts = [];

  Object.keys(currentFilters).forEach(col => {
    const values = currentFilters[col] || [];
    if (values.length > 0) {
      parts.push(`${col} ∈ [${values.join(", ")}]`);
    }
  });

  Object.keys(currentSearchFilters).forEach(col => {
    const term = currentSearchFilters[col];
    if (term) {
      parts.push(`${col} zawiera "${term}"`);
    }
  });

  Object.keys(currentRangeFilters).forEach(col => {
    const r = currentRangeFilters[col] || {};
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

/* ===================== START ===================== */

loadData().catch(err => {
  console.error(err);
  const info = document.getElementById("bottomPageInfo");
  if (info) info.textContent = "Błąd ładowania danych (szczegóły w konsoli).";
});

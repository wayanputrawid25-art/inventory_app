let chart = null;
let chartTopProduk = null;
let chartTopOutlet = null;
let chartOutletStatus = null;
let currentMenu = "penjualan";
let selectedSalesOutlet = "";
const MENU_STORAGE_KEY = "inventoryActiveMenu";
const VALID_MENUS = ["penjualan", "audit", "persediaan", "forecast", "opname"];

const state = {
  produkOptions: [],
  auditOutlets: [],
  outletTransactions: {
    outlets: [],
    detail: [],
    selected_outlet: ""
  },
  persediaan: [],
  persediaanCategory: "all",
  outletDetailCategory: "all",
  forecastCategory: "all",
  forecast: [],
  audit: {
    db_ready: false,
    summary: {},
    outlet_summary: [],
    movements: [],
    flags: [],
    analysis: [],
    notes: []
  },
  opname: [],
  opnameScan: {},
  perintahList: [],
  activePerintah: null,
  opnameHistory: []
};

const pageMeta = {
  penjualan: {
    eyebrow: "Sales Monitor",
    title: "Dashboard Penjualan",
    caption: "Monitoring penjualan warehouse per periode, outlet, dan produk aktif."
  },
  audit: {
    eyebrow: "Outlet Stock Assurance",
    title: "Audit Stok Outlet",
    caption: "Pantau stok masuk outlet, penjualan outlet, penyesuaian, dan flag audit dalam satu periode."
  },
  persediaan: {
    eyebrow: "Inventory Health",
    title: "Persediaan Warehouse",
    caption: "Rolling stock dihitung mengikuti cutoff bulan database agar mutasi masuk dan keluar tetap konsisten."
  },
  forecast: {
    eyebrow: "Demand Planning",
    title: "Forecast Penjualan",
    caption: "Forecast memakai EMA 3 bulan + buffer 10% dan dibulatkan ke atas agar stok tidak seret."
  },
  opname: {
    eyebrow: "Stock Control",
    title: "Stok Opname Gudang",
    caption: "Stok opname mengikuti periode yang sama dengan persediaan agar selisih rolling lebih akurat."
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  initTahun("tahun");
  initTahun("opnameTahun");
  setInitialPeriod();
  bindGlobalFilters();
  selectInput(null, "penjualan");
  selectImport(null, "penjualan");
  selectPersediaanInput(null, "pembelian");
  selectPersediaanImport(null, "pembelian");
  await loadProdukOptions();
  await loadAuditOutletOptions();
  await buildDynamicMenu();
  initOpnameQtyModal();
  selectMenu(null, getSavedMenu());
});

function getSavedMenu() {
  const savedMenu = window.localStorage.getItem(MENU_STORAGE_KEY);
  return VALID_MENUS.includes(savedMenu) ? savedMenu : "penjualan";
}

function toggleMobileMenu() {
  document.body.classList.toggle("mobile-menu-open");
}

function closeMobileMenu() {
  document.body.classList.remove("mobile-menu-open");
}

function bindGlobalFilters() {
  document.getElementById("bulan")?.addEventListener("change", applyCurrentFilters);
  document.getElementById("tahun")?.addEventListener("change", applyCurrentFilters);
  document.getElementById("filterProduk")?.addEventListener("change", applyCurrentFilters);
  document.getElementById("filterProduk")?.addEventListener("input", debounce(applyCurrentFilters, 200));
  document.getElementById("opnameBulan")?.addEventListener("change", syncOpnamePeriodFromLocal);
  document.getElementById("opnameTahun")?.addEventListener("change", syncOpnamePeriodFromLocal);
}

function debounce(fn, delay = 200) {
  let timeout = null;
  return (...args) => {
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => fn(...args), delay);
  };
}

function initTahun(id) {
  const select = document.getElementById(id);
  if (!select) return;

  const now = new Date().getFullYear();
  select.innerHTML = "";
  for (let year = now + 1; year >= now - 5; year -= 1) {
    const option = document.createElement("option");
    option.value = String(year);
    option.textContent = String(year);
    select.appendChild(option);
  }
}

function setInitialPeriod() {
  const now = new Date();
  const bulan = String(now.getMonth() + 1);
  const tahun = String(now.getFullYear());
  setValue("bulan", bulan);
  setValue("tahun", tahun);
  setValue("opnameBulan", bulan);
  setValue("opnameTahun", tahun);
  updateFilterStatus();
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function getBulan() {
  return document.getElementById("bulan")?.value || String(new Date().getMonth() + 1);
}

function getTahun() {
  return document.getElementById("tahun")?.value || String(new Date().getFullYear());
}

function getProdukFilter() {
  return (document.getElementById("filterProduk")?.value || "").trim();
}

function getAuditOutletFilter() {
  return (document.getElementById("auditOutletFilter")?.value || "").trim();
}

function getAuditSectionKey(id = "") {
  const map = {
    auditOverview: "overview",
    auditOutletStock: "outlet",
    auditLog: "log",
    auditControl: "control",
    auditIntegration: "integration"
  };
  return map[id] || "overview";
}

function getCurrentAuditSection() {
  const visible = [...document.querySelectorAll("#auditTab .module-content")]
    .find(el => el.style.display !== "none");
  return getAuditSectionKey(visible?.id || "auditOverview");
}

function getSelectedSku() {
  const raw = getProdukFilter();
  if (!raw) return "";

  const exact = state.produkOptions.find(item => {
    const label = `${item.sku} - ${item.nama_produk}`;
    return label.toLowerCase() === raw.toLowerCase() || item.sku.toLowerCase() === raw.toLowerCase();
  });

  if (exact) return exact.sku;
  return "";
}

function getBulanLabel(bulan = getBulan()) {
  const names = [
    "",
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember"
  ];
  return names[Number(bulan)] || "-";
}

function updateFilterStatus() {
  const produk = getSelectedSku();
  const outlet = currentMenu === "audit" ? getAuditOutletFilter() : "";
  const text = `Periode aktif: ${getBulanLabel()} ${getTahun()}${produk ? ` | Produk: ${produk}` : " | Produk: Semua"}${outlet ? ` | Outlet: ${outlet}` : ""}`;
  setText("filterStatus", text);
}

function updatePageHeader(menu) {
  const meta = pageMeta[menu] || pageMeta.penjualan;
  setText("pageEyebrow", meta.eyebrow);
  setText("pageTitle", meta.title);
  setText("pageCaption", meta.caption);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? 0;
}

function formatNumber(value) {
  return Number(value ?? 0).toLocaleString("id-ID");
}

function formatRupiah(value) {
  return `Rp ${Number(value ?? 0).toLocaleString("id-ID")}`;
}

function formatDate(dateString) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID");
}

function formatDateTime(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return `${date.toLocaleDateString("id-ID")} ${date.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}`;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text || "Response bukan JSON yang valid" };
  }

  if (!response.ok) {
    throw new Error(data?.error || `HTTP ${response.status}`);
  }

  if (data && typeof data === 'object' && data.hasOwnProperty('success')) {
    if (data.hasOwnProperty('data') && data.data !== undefined) {
      return data.data;
    }
    return data;
  }

  return data;
}

function toArray(data) {
  return Array.isArray(data) ? data : [];
}

function toObject(data) {
  return data && typeof data === "object" && !Array.isArray(data) ? data : {};
}

function showLoader() {
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = "flex";
}

function hideLoader() {
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = "none";
}

function showToast(message, success = true) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.style.background = success ? "#257a56" : "#b14141";
  toast.style.display = "block";
  window.setTimeout(() => {
    toast.style.display = "none";
  }, 3000);
}

async function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = event => resolve(event.target?.result || "");
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function syncOpnamePeriodFromLocal() {
  if (currentMenu !== "opname") return;
  setValue("bulan", document.getElementById("opnameBulan")?.value || getBulan());
  setValue("tahun", document.getElementById("opnameTahun")?.value || getTahun());
  applyCurrentFilters();
}

function syncOpnamePeriodToLocal() {
  setValue("opnameBulan", getBulan());
  setValue("opnameTahun", getTahun());
}

function clearProdukFilter() {
  setValue("filterProduk", "");
  applyCurrentFilters();
}

async function loadProdukOptions() {
  try {
    state.produkOptions = toArray(await fetchJson("/api/produk-list"));
    const list = document.getElementById("produkList");
    if (!list) return;
    list.innerHTML = state.produkOptions
      .map(item => `<option value="${escapeHtml(item.sku)} - ${escapeHtml(item.nama_produk)}"></option>`)
      .join("");
  } catch (error) {
    console.error("Produk list error:", error);
  }
}

async function loadAuditOutletOptions() {
  try {
    state.auditOutlets = toArray(await fetchJson("/api/outlet-list"));
    const select = document.getElementById("auditOutletFilter");
    if (!select) return;

    const currentValue = select.value;
    select.innerHTML = `<option value="">Semua Outlet</option>${state.auditOutlets
      .map(item => `<option value="${escapeHtml(item.nama_outlet)}">${escapeHtml(item.nama_outlet)}</option>`)
      .join("")}`;
    select.value = currentValue;
  } catch (error) {
    console.error("Audit outlet list error:", error);
  }
}

// Build dynamic main menu from backend data (outlets, top products).
async function buildDynamicMenu() {
  const container = document.getElementById('mainQuickMenu');
  if (!container) return;

  // Try to fetch outlets and top products; if fail, use simple mock
  let outlets = [];
  let topProduk = [];
  try {
    outlets = toArray(await fetchJson('/api/outlet-list'));
  } catch (e) {
    console.warn('Could not fetch outlets, using mock', e);
    outlets = [
      { id: 'OUT001', nama_outlet: 'Outlet Jakarta' },
      { id: 'OUT002', nama_outlet: 'Outlet Bandung' },
      { id: 'OUT003', nama_outlet: 'Outlet Surabaya' }
    ];
  }

  try {
    topProduk = toArray(await fetchJson('/api/top-produk'));
  } catch (e) {
    console.warn('Could not fetch top-produk, using mock', e);
    topProduk = [
      { sku: 'PRD001', nama_produk: 'Modul A' },
      { sku: 'PRD002', nama_produk: 'Tas B' }
    ];
  }

  // Render outlet quick tiles (limit to 6)
  const outletsHtml = outlets.slice(0, 6).map(o => `
    <button class="quick-tile tile-blue" onclick="selectMenu(null,'outlet-${escapeHtml(String(o.id))}')" aria-label="${escapeHtml(o.nama_outlet)}" tabindex="0">
      <div class="icon-wrap"><i data-lucide="home"></i></div>
      <span>${escapeHtml(o.nama_outlet)}</span>
    </button>
  `).join('');

  // Render top product quick tiles
  const produkHtml = topProduk.slice(0, 6).map(p => `
    <button class="quick-tile tile-green" onclick="selectMenu(null,'produk-${escapeHtml(p.sku)}')" aria-label="${escapeHtml(p.nama_produk)}" tabindex="0">
      <div class="icon-wrap"><i data-lucide="box"></i></div>
      <span>${escapeHtml(p.nama_produk)}</span>
    </button>
  `).join('');

  // Insert into container: find first quick-group for Penjualan and append sections
  const section = container.querySelector('.quick-menu-section');
  if (section) {
    // Create outlets block
    const outletsBlock = document.createElement('div');
    outletsBlock.className = 'quick-menu-section';
    outletsBlock.innerHTML = `<h4 class="quick-group">Outlet Cepat</h4><div class="quick-menu-grid">${outletsHtml}</div>`;
    section.parentNode.insertBefore(outletsBlock, section.nextSibling);

    // Create top-produk block
    const produkBlock = document.createElement('div');
    produkBlock.className = 'quick-menu-section';
    produkBlock.innerHTML = `<h4 class="quick-group">Top Produk</h4><div class="quick-menu-grid">${produkHtml}</div>`;
    section.parentNode.insertBefore(produkBlock, outletsBlock.nextSibling);
  }
  // Re-init lucide icons if available
  if (window.lucide) window.lucide.replace();
}

function getSelectedBarcodeProduct() {
  const raw = (document.getElementById("barcodeProductInput")?.value || "").trim();
  if (!raw) return null;

  const normalized = raw.toLowerCase();
  return state.produkOptions.find(item => {
    const label = `${item.sku} - ${item.nama_produk}`;
    return label.toLowerCase() === normalized
      || item.sku.toLowerCase() === normalized
      || label.toLowerCase().includes(normalized);
  }) || null;
}

function loadBarcodeGenerator() {
  setText("productBarcodeValue", "-");
  setText("rackBarcodeValue", "-");
  const productSvg = document.getElementById("productBarcodeSvg");
  const rackSvg = document.getElementById("rackBarcodeSvg");
  if (productSvg) productSvg.innerHTML = "";
  if (rackSvg) rackSvg.innerHTML = "";
}

function renderProductBarcode() {
  const produk = getSelectedBarcodeProduct();
  if (!produk) {
    showToast("Produk tidak valid. Pilih dari daftar.", false);
    return;
  }

  const barcodeValue = produk.sku;
  setText("productBarcodeValue", barcodeValue);

  const svg = document.getElementById("productBarcodeSvg");
  if (svg && window.JsBarcode) {
    svg.innerHTML = "";
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "120");
    JsBarcode(svg, barcodeValue, {
      format: "CODE128",
      displayValue: true,
      fontSize: 16,
      height: 80,
      width: 2,
      margin: 10,
      textMargin: 6
    });
  }
}

function renderRackBarcode() {
  const kodeRak = (document.getElementById("barcodeRackInput")?.value || "").trim();
  if (!kodeRak) {
    showToast("Masukkan kode rak terlebih dahulu.", false);
    return;
  }

  const barcodeValue = `RAK-${kodeRak}`;
  setText("rackBarcodeValue", barcodeValue);

  const svg = document.getElementById("rackBarcodeSvg");
  if (svg && window.JsBarcode) {
    svg.innerHTML = "";
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "120");
    JsBarcode(svg, barcodeValue, {
      format: "CODE128",
      displayValue: true,
      fontSize: 16,
      height: 80,
      width: 2,
      margin: 10,
      textMargin: 6
    });
  }
}

function downloadBarcodeSvg(svgId, prefix) {
  const svg = document.getElementById(svgId);
  if (!svg || !svg.innerHTML.trim()) {
    showToast("Generate barcode terlebih dahulu sebelum mengunduh.", false);
    return;
  }

  const serializer = new XMLSerializer();
  const svgData = serializer.serializeToString(svg);
  const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${prefix}-${Date.now()}.svg`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function getQueryParams(includeProduct = true) {
  const qs = new URLSearchParams({
    bulan: getBulan(),
    tahun: getTahun()
  });

  const sku = getSelectedSku();
  if (includeProduct && sku) qs.set("sku", sku);
  return qs;
}

function showTab(event, id) {
  document.querySelectorAll("#kpiTab, #chartTab, #outletTransactionTab, #inputTab, #importTab")
    .forEach(tab => { tab.style.display = "none"; });

  document.querySelectorAll("#salesTabMenu button")
    .forEach(button => button.classList.remove("active-tab"));

  const target = document.getElementById(id);
  if (target) target.style.display = "block";
  if (event) event.target.classList.add("active-tab");

  if (id === "chartTab") {
    loadChart();
  }
  if (id === "miniReviewTab") {
    loadMiniReview();
  }
  if (id === "outletTransactionTab") loadOutletTransactionMonitor();
}

async function loadMiniReview() {
  const content = document.getElementById("miniReviewContent");
  if (!content) return;

  try {
    const data = await fetchJson(`/api/mini-review?${getQueryParams(false).toString()}`);
    if (!data || !Array.isArray(data.modul)) {
      const message = data?.message || "Data mini review tidak tersedia untuk periode ini.";
      content.innerHTML = `<p>${escapeHtml(message)}</p>`;
      return;
    }

    if (data.message) {
      content.innerHTML = `<p>${escapeHtml(data.message)}</p>`;
      return;
    }

    const modulRows = data.modul
      .map(item => `
        <li>
          <span>${escapeHtml(item.level)}</span>
          <strong>${formatNumber(item.total)}</strong>
        </li>
      `)
      .join("");

    content.innerHTML = `
      <div class="mini-review-block">
        <p><strong>Ringkasan Modul per Level</strong></p>
        <ul class="mini-review-list">
          ${modulRows}
        </ul>
      </div>
      <div class="mini-review-block">
        <p><strong>Ringkasan Tas</strong></p>
        <p>${formatNumber(data.tas_total)} unit</p>
      </div>
    `;
  } catch (err) {
    content.innerHTML = `<p>Gagal memuat mini review penjualan.</p>`;
    console.error("Mini review load error:", err);
  }
}

function showModuleTab(event, module, id) {
  document.querySelectorAll(`#${module}Tab .module-content`)
    .forEach(el => { el.style.display = "none"; });

  document.querySelectorAll(`#${module}Menu button`)
    .forEach(button => button.classList.remove("active-tab"));

  const target = document.getElementById(id);
  if (target) target.style.display = "block";
  if (event) event.target.classList.add("active-tab");

  if (module === "audit") {
    loadAudit(getAuditSectionKey(id));
  }
}

function showOpnameTab(event, id) {
  document.querySelectorAll(".opname-content")
    .forEach(el => { el.style.display = "none"; });

  document.querySelectorAll(".tab-menu-opname button")
    .forEach(button => button.classList.remove("active-tab"));

  const target = document.getElementById(id);
  if (target) target.style.display = "block";
  const activeButton = event?.currentTarget
    || document.querySelector(`.tab-menu-opname button[data-opname-tab="${id}"]`)
    || [...document.querySelectorAll(".tab-menu-opname button")].find(button => button.getAttribute("onclick")?.includes(`'${id}'`));
  activeButton?.classList.add("active-tab");

  if (id === "opnameHistory") loadHistory();
  if (id === "opnamePerintah") {
    initPerintahFormDefaults();
    loadPerintahList();
  }
  if (id === "opnameHasil") {
    loadPerintahList();
    goBackHasilSoList();
  }
  if (id === "opnameInput") {
    if (!guardOpnameScanTab()) {
      showToast('Pilih perintah SO dari tab Hasil SO terlebih dahulu', false);
    }
  }
  if (id === "opnameBarcode") loadBarcodeGenerator();
  if (id === "opnameKPI") loadOpnameKpiData();
  if (window.lucide) lucide.createIcons();
}

function selectMenu(event, menu) {
  if (!VALID_MENUS.includes(menu)) menu = "penjualan";
  currentMenu = menu;
  window.localStorage.setItem(MENU_STORAGE_KEY, menu);
  closeMobileMenu();
  updatePageHeader(menu);
  updateFilterStatus();

  document.querySelectorAll(".sidebar li")
    .forEach(item => item.classList.remove("active"));

  const activeItem = event?.currentTarget
    || [...document.querySelectorAll(".sidebar li")].find(item => item.getAttribute("onclick")?.includes(`'${menu}'`));
  activeItem?.classList.add("active");

  document.querySelectorAll(".tab-content")
    .forEach(tab => { tab.style.display = "none"; });

  document.getElementById("salesTabMenu").style.display = menu === "penjualan" ? "flex" : "none";
  document.querySelectorAll("#salesTabMenu button")
    .forEach(button => button.classList.remove("active-tab"));

  if (menu === "penjualan") {
    document.getElementById("kpiTab").style.display = "block";
    document.querySelector("#salesTabMenu button")?.classList.add("active-tab");
    loadData();
    return;
  }

  if (menu === "persediaan") {
    document.getElementById("persediaanTab").style.display = "block";
    showModuleTab(null, "persediaan", "persediaanOverview");
    document.querySelector("#persediaanMenu button")?.classList.add("active-tab");
    loadPersediaan();
    return;
  }

  // Audit menu removed from UI; related code cleaned up

  if (menu === "forecast") {
    document.getElementById("forecastTab").style.display = "block";
    showModuleTab(null, "forecast", "forecastOverview");
    document.querySelector("#forecastMenu button")?.classList.add("active-tab");
    loadForecast();
    return;
  }

  if (menu === "opname") {
    document.getElementById("opnameTab").style.display = "block";
    showOpnameTab(null, "opnameKPI");
    document.querySelector(".tab-menu-opname button")?.classList.add("active-tab");
    syncOpnamePeriodToLocal();
    initPerintahFormDefaults();
    loadPerintahList();
    loadOpnameKpiData();
    updateOpnameInputVisibility();
  }
}

async function applyCurrentFilters() {
  updateFilterStatus();

  if (currentMenu === "penjualan") {
    await loadData();
    return;
  }

  if (currentMenu === "persediaan") {
    await loadPersediaan();
    return;
  }

  // Audit removed — no action required here

  if (currentMenu === "forecast") {
    await loadForecast();
    return;
  }

  if (currentMenu === "opname") {
    syncOpnamePeriodToLocal();
    await loadPerintahList();
    await loadOpnameKpiData();
    if (state.activePerintah?.id) await loadStokSistem();
    updateOpnameInputVisibility();
  }
}

async function loadData() {
  showLoader();
  try {
    await Promise.all([
      loadKPI(),
      loadChart(),
      loadTopProduk(),
      loadTopOutlet(),
      loadOutletStatus(),
      loadOutletTransactionMonitor(false)
    ]);
  } catch (error) {
    console.error("Load data error:", error);
    showToast(error.message || "Gagal memuat dashboard penjualan", false);
  } finally {
    hideLoader();
  }
}

async function loadOutletTransactionMonitor(showSpinner = true) {
  if (showSpinner) showLoader();

  try {
    const qs = getQueryParams();
    const status = document.getElementById("outletTransactionStatus")?.value || "";
    if (status) qs.set("status", status);
    if (selectedSalesOutlet) qs.set("outlet", selectedSalesOutlet);

    state.outletTransactions = toObject(await fetchJson(`/api/outlet-transaksi?${qs.toString()}`));
    const outlets = toArray(state.outletTransactions.outlets);
    const detail = toArray(state.outletTransactions.detail);
    const totals = toObject(state.outletTransactions.totals);
    const selectedOutlet = state.outletTransactions.selected_outlet || selectedSalesOutlet || "";
    selectedSalesOutlet = selectedOutlet;

    const selectedRow = outlets.find(item => item.nama_outlet === selectedOutlet);
    const selectedStock = detail.reduce((sum, item) => sum + Number(item.stok_akhir || 0), 0);
    const doneCount = Number(totals.sudah ?? 0);
    const pendingCount = Number(totals.belum ?? 0);

    setText("sales_outlet_done", formatNumber(doneCount));
    setText("sales_outlet_pending", formatNumber(pendingCount));
    setText("sales_outlet_selected", selectedOutlet || "-");
    setText("sales_outlet_stock", formatNumber(selectedStock));

    renderOutletTransactionTable(outlets, selectedOutlet);
    renderOutletTransactionDetail(detail, selectedRow);
  } catch (error) {
    console.error("Outlet transaction monitor error:", error);
    showToast(error.message || "Gagal memuat transaksi outlet", false);
  } finally {
    if (showSpinner) hideLoader();
  }
}

function renderOutletTransactionTable(outlets, selectedOutlet) {
  const body = document.getElementById("outletTransactionBody");
  if (!body) return;

  if (!outlets.length) {
    body.innerHTML = `<div class="outlet-list-empty">Tidak ada data outlet untuk periode ini.</div>`;
    return;
  }

  body.innerHTML = outlets.map(item => {
    const statusClass = item.status_transaksi === "sudah" ? "status-safe" : "status-out";
    const statusLabel = item.status_transaksi === "sudah" ? "Sudah Transaksi" : "Belum Transaksi";
    const isActive = item.nama_outlet === selectedOutlet ? "active" : "";
    return `
      <button
        type="button"
        class="outlet-list-item ${isActive}"
        data-outlet="${escapeHtml(item.nama_outlet)}"
        onclick="selectSalesOutlet(this.dataset.outlet)"
      >
        <div class="outlet-list-head">
          <h4 class="outlet-list-name">${escapeHtml(item.nama_outlet)}</h4>
          <span class="status-badge ${statusClass}">${statusLabel}</span>
        </div>
        <div class="outlet-list-meta">
          <div class="outlet-stat">
            <span class="outlet-stat-label">Qty Transaksi</span>
            <span class="outlet-stat-value">${formatNumber(item.qty_transaksi)}</span>
          </div>
          <div class="outlet-stat">
            <span class="outlet-stat-label">Stok Outlet</span>
            <span class="outlet-stat-value">${formatNumber(item.stok_akhir)}</span>
          </div>
        </div>
        <p class="outlet-list-note">${escapeHtml(item.catatan || "-")}</p>
      </button>
    `;
  }).join("");
}

function renderOutletTransactionDetail(detail, selectedRow) {
  const title = document.getElementById("outletDetailTitle");
  const summary = document.getElementById("outletDetailSummary");
  const body = document.getElementById("outletTransactionDetailBody");
  const heroBadge = document.getElementById("outletDetailStatusBadge");
  const heroText = document.getElementById("outletDetailStatusText");
  const heroNote = document.getElementById("outletDetailStatusNote");
  if (!title || !summary || !body || !heroBadge || !heroText || !heroNote) return;

  if (!selectedRow) {
    title.textContent = "Pilih outlet";
    heroBadge.className = "status-badge status-low";
    heroBadge.textContent = "Menunggu";
    heroText.textContent = "Belum ada outlet dipilih";
    heroNote.textContent = "Klik salah satu nama outlet di panel kiri untuk melihat rincian lengkapnya.";
    summary.innerHTML = `
      <h4>Belum ada outlet dipilih</h4>
      <p>Klik salah satu outlet untuk melihat detail stok dan alasan kenapa outlet tersebut sudah atau belum transaksi pada periode ini.</p>
    `;
    body.innerHTML = `<tr><td colspan="8">Belum ada detail outlet dipilih.</td></tr>`;
    setText("outletDetailQty", "0");
    setText("outletDetailStock", "0");
    return;
  }

  const isDone = selectedRow.status_transaksi === "sudah";
  const detailQty = Number(selectedRow.qty_transaksi || 0);
  const detailStock = detail.reduce((sum, item) => sum + Number(item.stok_akhir || 0), 0);

  title.textContent = selectedRow.nama_outlet;
  heroBadge.className = `status-badge ${isDone ? "status-safe" : "status-out"}`;
  heroBadge.textContent = isDone ? "Sudah Transaksi" : "Belum Transaksi";
  heroText.textContent = `${formatNumber(detailQty)} qty transaksi pada periode aktif`;
  heroNote.textContent = selectedRow.catatan || "-";
  summary.innerHTML = `
    <h4>Status ${isDone ? "Sudah Transaksi" : "Belum Transaksi"}</h4>
    <p>${escapeHtml(selectedRow.catatan || "-")}</p>
  `;
  setText("outletDetailQty", formatNumber(detailQty));
  setText("outletDetailStock", formatNumber(detailStock));

  body.innerHTML = "";
  if (!detail.length) {
    body.innerHTML = `<tr><td colspan="8">Belum ada detail stok outlet pada periode ini.</td></tr>`;
    return;
  }

  const filteredDetail = detail.filter(item => {
    const category = getOpnameCategory(item.nama_produk);
    return state.outletDetailCategory === "all" || category === state.outletDetailCategory;
  });

  if (!filteredDetail.length) {
    body.innerHTML = `<tr><td colspan="8">Tidak ada detail produk pada kategori ini.</td></tr>`;
    return;
  }

  filteredDetail.forEach(item => {
    const stock = Number(item.stok_akhir || 0);
    const stockClass = stock <= 0 ? "status-out" : stock <= 10 ? "status-low" : "status-safe";
    const stockLabel = stock <= 0 ? "Habis" : stock <= 10 ? "Menipis" : "Masih Ada";
    body.innerHTML += `
      <tr>
        <td>${escapeHtml(item.sku)}</td>
        <td>${escapeHtml(item.nama_produk)}</td>
        <td>${formatNumber(item.opening_stok)}</td>
        <td>${formatNumber(item.stok_masuk)}</td>
        <td>${formatNumber(item.stok_keluar)}</td>
        <td>${formatNumber(item.penyesuaian)}</td>
        <td>${formatNumber(stock)}</td>
        <td><span class="status-badge ${stockClass}">${stockLabel}</span></td>
      </tr>
    `;
  });
}

function selectSalesOutlet(outletName) {
  selectedSalesOutlet = outletName;
  loadOutletTransactionMonitor();
}

function selectOutletDetailCategory(event, category) {
  state.outletDetailCategory = category;
  document.querySelectorAll("#outletDetailCategoryTabs button")
    .forEach(button => button.classList.remove("active-mini-tab"));
  document.querySelector(`#outletDetailCategoryTabs button[onclick*="'${category}'"]`)?.classList.add("active-mini-tab");
  renderOutletTransactionDetail(
    toArray(state.outletTransactions.detail),
    toArray(state.outletTransactions.outlets).find(item => item.nama_outlet === selectedSalesOutlet)
  );
}

async function loadKPI() {
  const data = toObject(await fetchJson(`/api/kpi?${getQueryParams().toString()}`));

  setText("kpi_qty", formatNumber(data.total_qty));
  setText("kpi_produk", formatNumber(data.produk_terjual));
  setText("kpi_produk_belum", formatNumber(data.produk_belum));
  setText("kpi_outlet", formatNumber(data.outlet_transaksi));
  setText("kpi_outlet_belum", formatNumber(data.outlet_tidak));
  setText("kpi_nilai", formatRupiah(data.total_nilai));
  setText("kpi_modal", formatRupiah(data.total_modal));

  const profitEl = document.getElementById("kpi_profit");
  if (profitEl) {
    const profit = Number(data.profit || 0);
    profitEl.textContent = `${profit >= 0 ? "▲" : "▼"} ${formatRupiah(Math.abs(profit))}`;
    profitEl.style.color = profit >= 0 ? "#257a56" : "#b14141";
  }
}

async function loadChart() {
  const data = toArray(await fetchJson(`/api/chart?${new URLSearchParams({
    tahun: getTahun(),
    ...(getSelectedSku() ? { sku: getSelectedSku() } : {})
  }).toString()}`));

  const labels = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const values = new Array(12).fill(0);
  data.forEach(item => {
    values[Number(item.bulan) - 1] = Number(item.total || 0);
  });

  const ctx = document.getElementById("chart");
  if (!ctx) return;
  if (chart instanceof Chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Penjualan Bulanan",
        data: values,
        borderColor: "#b85c38",
        backgroundColor: "rgba(184, 92, 56, 0.12)",
        tension: 0.35,
        borderWidth: 3,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: "#b85c38"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      }
    }
  });
}

async function loadTopProduk() {
  const data = toArray(await fetchJson(`/api/top-produk?${getQueryParams().toString()}`));
  const ctx = document.getElementById("chartTopProduk");
  if (!ctx) return;
  if (chartTopProduk instanceof Chart) chartTopProduk.destroy();

  chartTopProduk = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.map(item => item.nama_produk),
      datasets: [{
        label: "Qty",
        data: data.map(item => Number(item.total || 0)),
        backgroundColor: "#d8a25e"
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      plugins: { legend: { display: false } }
    }
  });
}

async function loadTopOutlet() {
  const data = toArray(await fetchJson(`/api/top-outlet?${getQueryParams().toString()}`));
  const ctx = document.getElementById("chartTopOutlet");
  if (!ctx) return;
  if (chartTopOutlet instanceof Chart) chartTopOutlet.destroy();

  chartTopOutlet = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.map(item => item.nama_outlet),
      datasets: [{
        label: "Qty",
        data: data.map(item => Number(item.total || 0)),
        backgroundColor: "#257a56"
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      plugins: { legend: { display: false } }
    }
  });
}

async function loadOutletStatus() {
  const data = toObject(await fetchJson(`/api/outlet-status?${getQueryParams().toString()}`));
  const ctx = document.getElementById("chartOutletStatus");
  if (!ctx) return;
  if (chartOutletStatus instanceof Chart) chartOutletStatus.destroy();

  chartOutletStatus = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Transaksi", "Tidak Transaksi"],
      datasets: [{
        data: [Number(data.transaksi || 0), Number(data.tidak || 0)],
        backgroundColor: ["#257a56", "#b14141"]
      }]
    },
    options: {
      responsive: true
    }
  });
}

function buildForm(type, prefix) {
  const field = id => `${prefix}_${id}`;
  const forms = {
    penjualan: `
      <h3>Input Penjualan Warehouse</h3>
      <div class="form-grid">
        <input type="date" id="${field("tgl")}" />
        <input type="text" id="${field("outlet")}" placeholder="Outlet" />
        <input type="text" id="${field("sku")}" list="produkList" placeholder="SKU / Produk" />
        <input type="number" id="${field("qty")}" placeholder="Qty" />
      </div>
    `,
    pembelian: `
      <h3>Input Pembelian</h3>
      <div class="form-grid">
        <input type="date" id="${field("tgl")}" />
        <input type="text" id="${field("sku")}" list="produkList" placeholder="SKU / Produk" />
        <input type="number" id="${field("qty")}" placeholder="Qty" />
      </div>
    `,
    stok_awal: `
      <h3>Input Stok Awal</h3>
      <div class="form-grid">
        <input type="text" id="${field("sku")}" list="produkList" placeholder="SKU / Produk" />
        <input type="number" id="${field("qty")}" placeholder="Qty Awal" />
      </div>
    `,
    outlet: `
      <h3>Input Outlet</h3>
      <div class="form-grid">
        <input type="text" id="${field("outlet")}" placeholder="Nama Outlet" />
      </div>
    `
  };

  return forms[type] || "";
}

function selectInput(event, type) {
  if (event) {
    document.querySelectorAll("#inputTab .mini-sidebar div")
      .forEach(item => item.classList.remove("active-mini"));
    event.target.classList.add("active-mini");
  }

  document.getElementById("inputContent").innerHTML = `
    ${buildForm(type, "sales")}
    <div class="top-space">
      <button class="btn-primary" onclick="previewInput('${type}', 'preview', 'sales')">Preview</button>
    </div>
    <div id="preview"></div>
  `;
}

function selectPersediaanInput(event, type) {
  if (event) {
    document.querySelectorAll("#persediaanInputMenu div")
      .forEach(item => item.classList.remove("active-mini"));
    event.target.classList.add("active-mini");
  }

  document.getElementById("persediaanInputContent").innerHTML = `
    ${buildForm(type, "inventory")}
    <div class="top-space">
      <button class="btn-primary" onclick="previewInput('${type}', 'persediaanPreview', 'inventory')">Preview</button>
    </div>
    <div id="persediaanPreview"></div>
  `;
}

function previewInput(type, previewId, prefix) {
  const val = id => document.getElementById(`${prefix}_${id}`)?.value || "-";
  const details = [];

  if (type === "penjualan") details.push(`Tanggal: ${val("tgl")}`, `Outlet: ${val("outlet")}`, `SKU: ${val("sku")}`, `Qty: ${val("qty")}`);
  if (type === "pembelian") details.push(`Tanggal: ${val("tgl")}`, `SKU: ${val("sku")}`, `Qty: ${val("qty")}`);
  if (type === "stok_awal") details.push(`SKU: ${val("sku")}`, `Qty Awal: ${val("qty")}`);
  if (type === "outlet") details.push(`Nama Outlet: ${val("outlet")}`);

  document.getElementById(previewId).innerHTML = `
    <div class="preview-box">
      <strong>Preview data</strong><br>
      ${details.map(item => escapeHtml(item)).join("<br>")}
      <div class="top-space">
        <button class="btn-primary" onclick="submitData('${type}', '${prefix}')">Simpan</button>
      </div>
    </div>
  `;
}

async function submitData(type, prefix) {
  showLoader();
  const val = id => document.getElementById(`${prefix}_${id}`)?.value || "";
  let body = {};

  if (type === "penjualan") body = { tanggal: val("tgl"), nama_outlet: val("outlet"), sku: getSkuFromRaw(val("sku")), qty: val("qty") };
  if (type === "pembelian") body = { tanggal: val("tgl"), sku: getSkuFromRaw(val("sku")), qty: val("qty") };
  if (type === "stok_awal") body = { sku: getSkuFromRaw(val("sku")), qty: val("qty") };
  if (type === "outlet") body = { nama_outlet: val("outlet") };

  try {
    const data = await fetchJson(`/api/add-${type}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    showToast(data.message || "Data berhasil disimpan");
    await applyCurrentFilters();
  } catch (error) {
    console.error("Submit error:", error);
    showToast(error.message || "Gagal menyimpan data", false);
  } finally {
    hideLoader();
  }
}

function getSkuFromRaw(raw = "") {
  return raw.includes(" - ") ? raw.split(" - ")[0].trim() : raw.trim();
}

function selectImport(event, type) {
  if (event) {
    document.querySelectorAll("#importTab .mini-sidebar div")
      .forEach(item => item.classList.remove("active-mini"));
    event.target.classList.add("active-mini");
  }

  document.getElementById("importContent").innerHTML = buildImportPanel(type, "previewCSV");
}

function selectPersediaanImport(event, type) {
  if (event) {
    document.querySelectorAll("#persediaanImportMenu div")
      .forEach(item => item.classList.remove("active-mini"));
    event.target.classList.add("active-mini");
  }

  document.getElementById("persediaanImportContent").innerHTML = buildImportPanel(type, "persediaanPreviewCSV");
}

function buildImportPanel(type, previewId) {
  return `
    <h3>Import ${escapeHtml(type)}</h3>
    <div class="section-actions">
      <button class="btn-secondary" onclick="downloadTemplate('${type}')">Download Template</button>
    </div>
    <div class="top-space">
      <input type="file" id="${previewId}_file" accept=".csv,text/csv">
      <button class="btn-primary" onclick="previewCSV('${type}','${previewId}')">Preview</button>
    </div>
    <div id="${previewId}" class="top-space"></div>
  `;
}

function downloadTemplate(type = "outlet") {
  const map = {
    outlet: "/api/template-outlet",
    penjualan: "/api/template-penjualan",
    pembelian: "/api/template-pembelian",
    stok_awal: "/api/template-stok_awal"
  };
  window.open(map[type], "_blank");
}

async function previewCSV(type, previewId) {
  const file = document.getElementById(`${previewId}_file`)?.files?.[0];
  if (!file) {
    showToast("Pilih file CSV terlebih dahulu", false);
    return;
  }

  const csv = await readFileAsText(file);
  const lines = csv.split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) {
    showToast("CSV belum berisi data", false);
    return;
  }

  let html = `<div class="table-shell"><table class="table"><thead><tr>`;
  lines[0].split(/[,;]/).forEach(header => {
    html += `<th>${escapeHtml(header.trim())}</th>`;
  });
  html += `</tr></thead><tbody>`;

  for (let index = 1; index < Math.min(lines.length, 6); index += 1) {
    html += "<tr>";
    lines[index].split(/[,;]/).forEach(cell => {
      html += `<td>${escapeHtml(cell.trim())}</td>`;
    });
    html += "</tr>";
  }

  html += `</tbody></table></div>
    <div class="top-space">
      <button class="btn-primary" onclick="importCSV('${type}','${previewId}')">Import Data</button>
    </div>`;

  const previewEl = document.getElementById(previewId);
  previewEl.innerHTML = html;
  previewEl.dataset.csv = csv;
}

async function importCSV(type, previewId) {
  const previewEl = document.getElementById(previewId);
  const csv = previewEl?.dataset.csv;
  if (!csv) {
    showToast("Preview file terlebih dahulu", false);
    return;
  }

  showLoader();
  try {
    const data = await fetchJson(`/api/import-${type}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv })
    });

    showToast(data.message || "Import selesai");
    await applyCurrentFilters();
  } catch (error) {
    console.error("Import error:", error);
    showToast(error.message || "Import gagal", false);
  } finally {
    hideLoader();
  }
}

async function loadPersediaan() {
  showLoader();
  try {
    state.persediaan = toArray(await fetchJson(`/api/persediaan?${getQueryParams().toString()}`));
    renderPersediaanTables();
  } catch (error) {
    console.error("Persediaan error:", error);
    showToast(error.message || "Gagal memuat persediaan", false);
  } finally {
    hideLoader();
  }
}

function renderPersediaanTables() {
  const body = document.getElementById("persediaanBody");
  const restockBody = document.getElementById("persediaanRestockBody");
  if (!body || !restockBody) return;

  body.innerHTML = "";
  restockBody.innerHTML = "";

  let totalStok = 0;
  let lowStock = 0;
  let outStock = 0;

  const filteredItems = state.persediaan.filter(item => {
    const category = getOpnameCategory(item.nama_produk);
    return state.persediaanCategory === "all" || category === state.persediaanCategory;
  });

  filteredItems.forEach(item => {
    const stokAkhir = Number(item.stok_akhir || 0);
    const category = getOpnameCategory(item.nama_produk);
    const categoryLabel = getOpnameCategoryLabel(category);
    totalStok += stokAkhir;
    if (stokAkhir <= 0) outStock += 1;
    if (stokAkhir > 0 && stokAkhir <= 10) lowStock += 1;

    body.innerHTML += `
      <tr>
        <td>${escapeHtml(item.sku)}</td>
        <td>${escapeHtml(item.nama_produk)}</td>
        <td><span class="status-badge category-badge category-${category}">${categoryLabel}</span></td>
        <td>${formatNumber(item.stok_awal)}</td>
        <td>${formatNumber(item.pembelian)}</td>
        <td>${formatNumber(item.penjualan)}</td>
        <td>${formatNumber(item.penyesuaian)}</td>
        <td>${formatNumber(stokAkhir)}</td>
      </tr>
    `;

    if (stokAkhir <= 10) {
      const statusClass = stokAkhir <= 0 ? "status-out" : "status-low";
      const label = stokAkhir <= 0 ? "Minus / Habis" : "Prioritas Restock";
      restockBody.innerHTML += `
        <tr>
          <td>${escapeHtml(item.sku)}</td>
          <td>${escapeHtml(item.nama_produk)}</td>
          <td>${formatNumber(stokAkhir)}</td>
          <td><span class="status-badge ${statusClass}">${label}</span></td>
        </tr>
      `;
    }
  });

  if (!filteredItems.length) {
    body.innerHTML = `<tr><td colspan="8">Tidak ada data persediaan pada kategori ini.</td></tr>`;
    restockBody.innerHTML = `<tr><td colspan="4">Tidak ada data restock pada kategori ini.</td></tr>`;
  } else if (!restockBody.innerHTML) {
    restockBody.innerHTML = `<tr><td colspan="4">Tidak ada item restock pada kategori ini.</td></tr>`;
  }

  setText("persediaan_total_sku", formatNumber(filteredItems.length));
  setText("persediaan_total_stok", formatNumber(totalStok));
  setText("persediaan_low_stock", formatNumber(lowStock));
  setText("persediaan_out_stock", formatNumber(outStock));
}

function selectPersediaanCategory(event, category) {
  state.persediaanCategory = category;
  document.querySelectorAll("#persediaanCategoryTabs button, #persediaanRestockCategoryTabs button")
    .forEach(button => button.classList.remove("active-mini-tab"));
  document.querySelectorAll(`#persediaanCategoryTabs button[onclick*="'${category}'"], #persediaanRestockCategoryTabs button[onclick*="'${category}'"]`)
    .forEach(button => button.classList.add("active-mini-tab"));
  renderPersediaanTables();
}

async function loadAudit(section = "overview") {
  showLoader();
  try {
    const qs = getQueryParams();
    const outlet = getAuditOutletFilter();
    if (outlet) qs.set("outlet", outlet);
    qs.set("section", section);
    const response = toObject(await fetchJson(`/api/audit?${qs.toString()}`));

    state.audit.db_ready = Boolean(response.db_ready ?? state.audit.db_ready);
    if ("summary" in response) state.audit.summary = toObject(response.summary);
    if ("outlet_summary" in response) state.audit.outlet_summary = toArray(response.outlet_summary);
    if ("movements" in response) state.audit.movements = toArray(response.movements);
    if ("flags" in response) state.audit.flags = toArray(response.flags);
    if ("analysis" in response) state.audit.analysis = toArray(response.analysis);
    if ("notes" in response) state.audit.notes = toArray(response.notes);

    if (section === "overview") renderAuditOverview();
    if (section === "outlet") renderAuditOutletTable();
    if (section === "log") renderAuditMovementTable();
    if (section === "control") renderAuditFlagTable();
    if (section === "integration") renderAuditIntegration();
  } catch (error) {
    console.error("Audit error:", error);
    showToast(error.message || "Gagal memuat audit", false);
  } finally {
    hideLoader();
  }
}

function renderAuditOverview() {
  const summary = toObject(state.audit.summary);
  const flags = toArray(state.audit.flags);
  const analysis = toArray(state.audit.analysis);
  const insightCards = document.getElementById("auditInsightCards");
  const analysisBody = document.getElementById("auditAnalysisBody");
  if (!insightCards || !analysisBody) return;

  setText("audit_total_log", formatNumber(summary.total_mutasi));
  setText("audit_penjualan_total", formatNumber(summary.stok_masuk_outlet));
  setText("audit_pembelian_total", formatNumber(summary.penjualan_outlet));
  setText("audit_qty_total", formatNumber(summary.qty_bergerak));
  setText("audit_problem_outlet", formatNumber(summary.problem_outlet));

  insightCards.innerHTML = "";
  analysisBody.innerHTML = "";

  const insightItems = [
    {
      title: "Status Database Audit",
      detail: state.audit.db_ready
        ? "Audit sudah memakai rolling stock, stok keluar outlet, dan analisis level siswa."
        : "Migrasi audit belum lengkap. Sistem masih perlu penyempurnaan struktur database."
    },
    {
      title: "Outlet Terpantau",
      detail: `${formatNumber(summary.total_outlet || 0)} outlet tercakup pada periode ${getBulanLabel()} ${getTahun()}.`
    },
    {
      title: "Flag Audit",
      detail: `${formatNumber(flags.length)} indikator risiko terdeteksi pada ringkasan audit.`
    },
    {
      title: "Analisis Level",
      detail: analysis.length
        ? `${formatNumber(analysis.filter(item => Number(item.selisih || 0) !== 0).length)} baris level siswa tidak cocok dengan modul keluar outlet.`
        : "Belum ada data analisis level siswa untuk periode ini."
    }
  ];

  insightItems.forEach(item => {
    insightCards.innerHTML += `
      <div class="insight-card">
        <h4>${escapeHtml(item.title)}</h4>
        <p>${escapeHtml(item.detail)}</p>
      </div>
    `;
  });

  analysis.forEach(item => {
    const diff = Number(item.selisih || 0);
    const badgeClass = diff === 0 ? "status-safe" : diff > 0 ? "status-low" : "status-out";
    analysisBody.innerHTML += `
      <tr>
        <td>${escapeHtml(item.nama_outlet || "-")}</td>
        <td>${escapeHtml(item.level_code || "-")}</td>
        <td>${formatNumber(item.jumlah_siswa)}</td>
        <td>${formatNumber(item.modul_keluar)}</td>
        <td>${formatNumber(item.target_modul)}</td>
        <td>${formatNumber(diff)}</td>
        <td><span class="status-badge ${badgeClass}">${escapeHtml(item.status || "-")}</span></td>
      </tr>
    `;
  });

  if (!analysis.length) {
    analysisBody.innerHTML = `<tr><td colspan="7">Belum ada data analisis level siswa pada periode ini.</td></tr>`;
  }
}

function renderAuditOutletTable() {
  const outletSummary = toArray(state.audit.outlet_summary);
  const outletBody = document.getElementById("auditOutletBody");
  if (!outletBody) return;

  outletBody.innerHTML = "";
  outletSummary.forEach(item => {
    outletBody.innerHTML += `
      <tr>
        <td>${escapeHtml(item.nama_outlet || "-")}</td>
        <td>${escapeHtml(item.sku || "-")}</td>
        <td>${escapeHtml(item.nama_produk || "-")}</td>
        <td>${formatNumber(item.opening_stok)}</td>
        <td>${formatNumber(item.stok_masuk)}</td>
        <td>${formatNumber(item.stok_keluar)}</td>
        <td>${formatNumber(item.penyesuaian)}</td>
        <td>${formatNumber(item.stok_akhir)}</td>
      </tr>
    `;
  });

  if (!outletSummary.length) {
    outletBody.innerHTML = `<tr><td colspan="8">Belum ada data stok outlet pada periode ini.</td></tr>`;
  }
}

function renderAuditMovementTable() {
  const movements = toArray(state.audit.movements);
  const movementBody = document.getElementById("auditBody");
  if (!movementBody) return;

  movementBody.innerHTML = "";
  movements.forEach(item => {
    movementBody.innerHTML += `
      <tr>
        <td>${formatDate(item.tanggal)}</td>
        <td>${escapeHtml(item.sumber || "-")}</td>
        <td>${escapeHtml(item.jenis || "-")}</td>
        <td>${escapeHtml(item.nama_outlet || "-")}</td>
        <td>${escapeHtml(item.sku || "-")}</td>
        <td>${formatNumber(item.qty)}</td>
        <td>${escapeHtml(item.referensi || "-")}</td>
        <td>${escapeHtml(item.keterangan || "-")}</td>
      </tr>
    `;
  });

  if (!movements.length) {
    movementBody.innerHTML = `<tr><td colspan="8">Belum ada mutasi pada periode ini.</td></tr>`;
  }
}

function renderAuditFlagTable() {
  const flags = toArray(state.audit.flags);
  const flagBody = document.getElementById("auditFlagBody");
  if (!flagBody) return;

  flagBody.innerHTML = "";
  flags.forEach(item => {
    flagBody.innerHTML += `
      <tr>
        <td>${escapeHtml(item.nama_outlet || "-")}</td>
        <td>${escapeHtml(item.sku || "-")}</td>
        <td>${escapeHtml(item.flag || "-")}</td>
        <td>${escapeHtml(item.detail || "-")}</td>
      </tr>
    `;
  });

  if (!flags.length) {
    flagBody.innerHTML = `<tr><td colspan="4">Belum ada flag audit pada periode ini.</td></tr>`;
  }
}

function renderAuditIntegration() {
  const dbStatus = document.getElementById("auditDbStatus");
  const notePanel = document.getElementById("auditIntegrationNotes");
  if (!dbStatus || !notePanel) return;

  dbStatus.textContent = state.audit.db_ready
    ? "Siap dipakai. Audit sudah memakai query bertahap agar menu lebih ringan dibuka."
    : "Migrasi audit belum lengkap. Jalankan SQL migrasi baru agar query audit lebih stabil dan akurat.";

  const notes = [
    ...toArray(state.audit.notes),
    "Gunakan filter Outlet atau Produk sebelum membuka tabel berat seperti Mutasi dan Stok Outlet.",
    "Mulai dari tab Ringkasan dulu. Tab lain sekarang dimuat saat dibuka agar browser tidak cepat berat.",
    "Jika data outlet sangat besar, pastikan index pada migration_neon_safe.sql sudah dijalankan di database."
  ];

  notePanel.innerHTML = `
    <h4>Instruksi Sinkron API & DB</h4>
    <ul>
      ${notes.map(note => `<li>${escapeHtml(note)}</li>`).join("")}
    </ul>
  `;
}

async function loadForecast() {
  showLoader();
  try {
    state.forecast = toArray(await fetchJson(`/api/forecast?${getQueryParams().toString()}`));
    renderForecast();
  } catch (error) {
    console.error("Forecast error:", error);
    showToast(error.message || "Gagal memuat forecast", false);
  } finally {
    hideLoader();
  }
}

function renderForecast() {
  const body = document.getElementById("forecastBody");
  const recommendationCards = document.getElementById("forecastRecommendationCards");
  if (!body || !recommendationCards) return;

  body.innerHTML = "";
  recommendationCards.innerHTML = "";

  let totalForecast = 0;
  let totalActual = 0;
  let totalGap = 0;
  let produkAktif = 0;
  let accuracyTotal = 0;
  let accuracyCount = 0;

  const filteredItems = state.forecast.filter(item => {
    const category = getOpnameCategory(item.nama_produk);
    return state.forecastCategory === "all" || category === state.forecastCategory;
  });

  filteredItems.forEach(item => {
    const forecast = Number(item.forecast_bulan_depan || 0);
    const actual = Number(item.bulan_3 || 0);
    const gap = forecast - actual;
    totalForecast += forecast;
    totalActual += actual;
    totalGap += gap;
    if (forecast > 0) produkAktif += 1;

    const accuracy = getForecastAccuracy(forecast, actual);
    if (accuracy !== null) {
      accuracyTotal += accuracy;
      accuracyCount += 1;
    }

    body.innerHTML += `
      <tr>
        <td>${escapeHtml(item.sku)}</td>
        <td>${escapeHtml(item.nama_produk)}</td>
        <td>${formatNumber(item.bulan_1)}</td>
        <td>${formatNumber(item.bulan_2)}</td>
        <td>${formatNumber(item.bulan_3)}</td>
        <td>${formatNumber(item.ema_3_bulan)}</td>
        <td>${formatNumber(item.forecast_bulan_depan)}</td>
      </tr>
    `;
  });

  if (!filteredItems.length) {
    body.innerHTML = `<tr><td colspan="7">Tidak ada data forecast pada kategori ini.</td></tr>`;
  }

  const sorted = [...filteredItems].sort((a, b) => Number(b.forecast_bulan_depan || 0) - Number(a.forecast_bulan_depan || 0));
  const topDemand = sorted[0];

  setText("forecast_total_produk", formatNumber(filteredItems.length));
  setText("forecast_total_value", formatNumber(totalForecast));
  setText("forecast_actual_value", formatNumber(totalActual));
  setText("forecast_gap_value", formatNumber(totalGap));
  setText("forecast_accuracy", `${formatForecastPercentage(accuracyCount ? accuracyTotal / accuracyCount : 0)}%`);
  setText("forecast_avg_tahunan", formatNumber(filteredItems.length ? Math.ceil(totalForecast / filteredItems.length) : 0));
  setText("forecast_top_demand", topDemand ? topDemand.nama_produk : "-");
  setText("forecast_produk_aktif", formatNumber(produkAktif));

  sorted.filter(item => Number(item.forecast_bulan_depan || 0) > 0).slice(0, 3).forEach((item, index) => {
    recommendationCards.innerHTML += `
      <div class="insight-card">
        <h4>Prioritas ${index + 1}</h4>
        <p>${escapeHtml(item.nama_produk)} diproyeksikan membutuhkan ${formatNumber(item.forecast_bulan_depan)} unit bulan depan. Siapkan stok minimal di atas angka ini.</p>
      </div>
    `;
  });

  if (!recommendationCards.innerHTML) {
    recommendationCards.innerHTML = `
      <div class="insight-card">
        <h4>Belum ada rekomendasi</h4>
        <p>Histori penjualan 3 bulan masih belum cukup untuk memberi prioritas forecast.</p>
      </div>
    `;
  }
}

function selectForecastCategory(event, category) {
  state.forecastCategory = category;
  document.querySelectorAll("#forecastCategoryTabs button")
    .forEach(button => button.classList.remove("active-mini-tab"));
  document.querySelector(`#forecastCategoryTabs button[onclick*="'${category}'"]`)?.classList.add("active-mini-tab");
  renderForecast();
}

function getForecastAccuracy(forecast, actual) {
  const safeForecast = Number(forecast || 0);
  const safeActual = Number(actual || 0);

  if (safeForecast === 0 && safeActual === 0) return 100;
  if (safeActual === 0) return 0;

  const accuracy = 100 - (Math.abs(safeForecast - safeActual) / safeActual) * 100;
  return Math.max(0, Math.min(100, accuracy));
}

function formatForecastPercentage(value) {
  return Number(value || 0).toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });
}

function getOpnameCategory(namaProduk = "") {
  const nama = namaProduk.toLowerCase().trim();
  if (nama.startsWith("modul")) return "modul";
  if (nama.startsWith("poster") || nama.startsWith("flash")) return "poster";
  if (nama.includes("merah") || nama.includes("kuning") || nama.includes("biru") || nama.includes(" my")) return "seragam";
  return "lain-lain";
}

function getOpnameCategoryLabel(category) {
  const labels = {
    modul: "Modul",
    seragam: "Seragam",
    poster: "Poster",
    "lain-lain": "Lain-lain"
  };
  return labels[category] || "Lain-lain";
}

function normalizeKategoriTargets(targets) {
  const allowed = ['modul', 'seragam', 'poster', 'lain-lain'];
  if (Array.isArray(targets)) {
    return [...new Set(targets
      .map((item) => String(item || '').trim().toLowerCase())
      .filter((item) => allowed.includes(item)))];
  }

  if (typeof targets === 'string' && targets.trim()) {
    try {
      const parsed = JSON.parse(targets);
      if (Array.isArray(parsed)) return normalizeKategoriTargets(parsed);
    } catch {
      // continue to comma-split logic
    }
    return [...new Set(targets
      .split(',')
      .map((item) => String(item || '').trim().toLowerCase())
      .filter((item) => allowed.includes(item)))];
  }

  return [];
}

let opnameScanner = null;
let opnameScannerMode = 'barang';

function getProductStokSistem(product) {
  return Number(product?.stok_sistem ?? product?.qty_stok ?? product?.stok ?? 0);
}

function getOpnameOutletId() {
  const outletSelect = document.getElementById('opnameOutletSelect');
  const raw = outletSelect?.value;
  return raw ? Number(raw) : undefined;
}

function getTodayLocalDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getOpnameRange() {
  const bulan = document.getElementById('opnameBulan')?.value || getBulan();
  const tahun = document.getElementById('opnameTahun')?.value || getTahun();
  const month = String(bulan).padStart(2, '0');
  const startDate = `${tahun}-${month}-01`;
  const endDate = `${tahun}-${month}-${new Date(Number(tahun), Number(bulan), 0).getDate()}`;
  return { bulan, tahun, startDate, endDate };
}

async function loadOpnameKpiData(options = {}) {
  const { showSpinner = false } = options;
  if (showSpinner) showLoader();
  try {
    const { bulan, tahun } = getOpnameRange();
    const qs = new URLSearchParams({ bulan, tahun });
    const sku = getSelectedSku();
    if (sku) qs.set('sku', sku);
    state.opname = toArray(await fetchJson(`/api/stok-sistem?${qs.toString()}`));
    refreshOpnameMetrics();
  } catch (error) {
    console.error('Load opname KPI error:', error);
    refreshOpnameMetrics();
  } finally {
    if (showSpinner) hideLoader();
  }
}

async function loadStokSistem() {
  showLoader();
  try {
    const { bulan, tahun } = getOpnameRange();
    const qs = new URLSearchParams({
      bulan,
      tahun
    });

    const sku = getSelectedSku();
    if (sku) qs.set('sku', sku);

    state.opname = toArray(await fetchJson(`/api/stok-sistem?${qs.toString()}`));
    const body = document.getElementById('opnameBody');

    if (body) {
      body.innerHTML = '';

      if (!state.opname.length) {
        body.innerHTML = `<tr><td colspan="7">Belum ada stok sistem pada periode ini.</td></tr>`;
      }

      state.opname.forEach((item) => {
        const skuValue = item.sku || item.kode_barang || '';
        const namaValue = item.nama_barang || item.nama_produk || '-';
        const category = getOpnameCategory(namaValue);
        const rakLabel = item.rak_code ? escapeHtml(item.rak_code) : '-';
        const stokLabel = getProductStokSistem(item);

        body.innerHTML += `
          <tr id="row-${escapeHtml(skuValue)}" data-category="${category}" data-rak-barcode="${escapeHtml(item.rak_barcode || '')}" data-visible="true" data-scanned="false">
            <td>${escapeHtml(skuValue)}</td>
            <td>${escapeHtml(namaValue)}</td>
            <td>${rakLabel}</td>
            <td><span class="status-badge status-safe">${getOpnameCategoryLabel(category)}</span></td>
            <td id="sys-${escapeHtml(skuValue)}">${formatNumber(stokLabel)}</td>
            <td>
              <input
                type="number"
                class="input-opname"
                id="fisik-${escapeHtml(skuValue)}"
                oninput="hitungSelisih('${escapeHtml(skuValue)}')"
                onkeydown="handleOpnameInputKey(event, '${escapeHtml(skuValue)}')"
                placeholder="Qty fisik"
                min="0"
              />
            </td>
            <td id="selisih-${escapeHtml(skuValue)}">0</td>
          </tr>
        `;
      });

      updateSummary();
      filterOpname();
    } else {
      refreshOpnameMetrics();
    }
  } catch (error) {
    console.error('Stok sistem error:', error);
    showToast(error.message || 'Gagal memuat stok sistem', false);
  } finally {
    hideLoader();
  }
}

function nextInput(event, index) {
  if (event.key !== 'Enter') return;
  const inputs = document.querySelectorAll('.input-opname');
  inputs[index + 1]?.focus();
}

function hideAllOpnameRows() {
  document.querySelectorAll('#opnameBody tr').forEach(row => {
    row.style.display = 'none';
    row.classList.remove('active-opname-row');
  });
}

function showOpnameRow(row) {
  document.querySelectorAll('#opnameBody tr').forEach(item => {
    item.classList.remove('active-opname-row');
  });
  row.dataset.visible = 'true';
  row.style.display = '';
  row.classList.add('active-opname-row');
  row.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function handleOpnameInputKey(event, sku) {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  saveScannedOpnameRow(sku).catch((error) => {
    console.error('Save scan row error:', error);
    showToast(error.message || 'Gagal menyimpan data scan', false);
  });
}

async function saveScannedOpnameRow(sku) {
  const input = document.getElementById(`fisik-${sku}`);
  if (!input) return;

  if (input.value === '') {
    showToast('Isi stok fisik sebelum menyimpan.', false);
    input.focus();
    return;
  }

  hitungSelisih(sku);

  const row = document.getElementById(`row-${sku}`);
  const nama = row?.children[1]?.textContent?.trim() || '';
  const sistem = Number((document.getElementById(`sys-${sku}`)?.textContent || '0').replace(/\./g, '').replace(/,/g, ''));
  const fisik = Number(input.value || 0);
  const selisih = fisik - sistem;

  state.opnameScan[sku] = {
    nama,
    sistem,
    fisik,
    selisih
  };

  if (row) {
    row.dataset.scanned = 'true';
    row.dataset.visible = 'true';
    row.style.display = '';
    row.classList.remove('active-opname-row');
    row.classList.add('counted-opname-row');
  }

  updateSummary();
  updateOpnameScanSummary();
  const scanResultInput = document.getElementById('scanOpnameResult');
  if (scanResultInput) scanResultInput.value = '';
  document.getElementById('scanOpnameStatus').textContent = `Mode scan: ${opnameScannerMode}`;
  showToast(`Data ${sku} disimpan. Lanjut scan berikutnya.`);
  await autoSaveOpname({ silent: true });
}

function hitungSelisih(sku) {
  const sistem = Number((document.getElementById(`sys-${sku}`)?.textContent || '0').replace(/\./g, '').replace(/,/g, ''));
  const input = document.getElementById(`fisik-${sku}`);
  const fisik = input?.value === '' ? sistem : Number(input?.value || 0);
  const selisih = fisik - sistem;

  const selisihEl = document.getElementById(`selisih-${sku}`);
  const row = document.getElementById(`row-${sku}`);

  if (selisihEl) {
    selisihEl.textContent = formatNumber(selisih);
    selisihEl.classList.remove('selisih-plus', 'selisih-minus');
    if (selisih > 0) selisihEl.classList.add('selisih-plus');
    if (selisih < 0) selisihEl.classList.add('selisih-minus');
  }

  row?.classList.toggle('row-problem', selisih !== 0);
  updateSummary();
}

function hasOpnameInput(row) {
  const sku = row.id.replace('row-', '');
  const input = document.getElementById(`fisik-${sku}`);
  return row.dataset.scanned === 'true' || (input && input.value !== '');
}

function refreshOpnameMetrics() {
  const hasTable = Boolean(document.getElementById('opnameBody'));
  if (hasTable) {
    updateSummary();
    return;
  }

  const products = Array.isArray(state.opname) ? state.opname : [];
  const totalSku = products.length || state.produkOptions.length || 0;
  let totalStokSistemProduk = 0;

  products.forEach((item) => {
    totalStokSistemProduk += getProductStokSistem(item);
  });

  let totalSistemScan = 0;
  let totalFisik = 0;
  let totalSelisih = 0;
  let problem = 0;
  const scannedCount = Object.keys(state.opnameScan).length;

  Object.values(state.opnameScan).forEach(item => {
    totalSistemScan += Number(item.sistem || 0);
    totalFisik += Number(item.fisik || 0);
    totalSelisih += Number(item.selisih ?? (item.fisik - item.sistem));
    if (Number(item.selisih ?? (item.fisik - item.sistem)) !== 0) problem += 1;
  });

  const remaining = Math.max(totalSku - scannedCount, 0);
  const progress = totalSku ? Math.round((scannedCount / totalSku) * 100) : 0;
  const stokSistemDisplay = scannedCount > 0 ? totalSistemScan : totalStokSistemProduk;

  setText('kpi_opname_total', formatNumber(totalSku));
  setText('kpi_opname_counted', formatNumber(scannedCount));
  setText('kpi_opname_progress', `${progress}% progress`);
  setText('kpi_opname_sistem', formatNumber(stokSistemDisplay));
  setText('kpi_opname_fisik', formatNumber(totalFisik));
  setText('kpi_opname_selisih', formatNumber(totalSelisih));
  setText('kpi_opname_problem', formatNumber(problem));
  setText('kpi_opname_remaining', `${formatNumber(remaining)} belum dihitung`);
  setText('sum_total', formatNumber(scannedCount));
  setText('sum_selisih', formatNumber(totalSelisih));
  setText('sum_problem', formatNumber(problem));

  const progressBar = document.getElementById('opnameProgressBar');
  if (progressBar) progressBar.style.width = `${progress}%`;

  const lastScan = Object.keys(state.opnameScan).at(-1);
  setText('opnameLastScanBadge', lastScan ? `Terakhir: ${lastScan}` : 'Belum ada scan');
}

function updateSummary() {
  const body = document.getElementById('opnameBody');
  if (!body) {
    refreshOpnameMetrics();
    return;
  }

  const totalSku = document.querySelectorAll('#opnameBody tr[id^="row-"]').length;
  let totalSistem = 0;
  let totalFisik = 0;
  let totalSelisih = 0;
  let problem = 0;
  let scannedCount = 0;

  document.querySelectorAll('#opnameBody tr').forEach(row => {
    if (!hasOpnameInput(row)) return;

    const sku = row.id.replace('row-', '');
    const sistem = Number((document.getElementById(`sys-${sku}`)?.textContent || '0').replace(/\./g, '').replace(/,/g, ''));
    const input = document.getElementById(`fisik-${sku}`);
    const fisik = input?.value === '' ? sistem : Number(input?.value || 0);
    const selisih = fisik - sistem;

    scannedCount += 1;
    totalSistem += sistem;
    totalFisik += fisik;
    totalSelisih += selisih;
    if (selisih !== 0) problem += 1;
  });

  const remaining = Math.max(totalSku - scannedCount, 0);
  const progress = totalSku ? Math.round((scannedCount / totalSku) * 100) : 0;

  setText('kpi_opname_total', formatNumber(totalSku));
  setText('kpi_opname_counted', formatNumber(scannedCount));
  setText('kpi_opname_progress', `${progress}% progress`);
  setText('kpi_opname_sistem', formatNumber(totalSistem));
  setText('kpi_opname_fisik', formatNumber(totalFisik));
  setText('kpi_opname_selisih', formatNumber(totalSelisih));
  setText('kpi_opname_problem', formatNumber(problem));
  setText('kpi_opname_remaining', `${formatNumber(remaining)} belum dihitung`);
  setText('sum_total', formatNumber(scannedCount));
  setText('sum_selisih', formatNumber(totalSelisih));
  setText('sum_problem', formatNumber(problem));

  const progressBar = document.getElementById('opnameProgressBar');
  if (progressBar) progressBar.style.width = `${progress}%`;
}

function filterOpname() {
  const keyword = (document.getElementById('searchOpname')?.value || '').toLowerCase();
  const category = document.getElementById('opnameCategoryFilter')?.value || 'all';

  document.querySelectorAll('#opnameCategoryTabs button')
    .forEach(button => button.classList.remove('active-mini-tab'));
  document.querySelector(`#opnameCategoryTabs button[onclick*="'${category}'"]`)?.classList.add('active-mini-tab');

  const activeTargets = state.activePerintah?.kategori_targets || [];

  document.querySelectorAll('#opnameBody tr').forEach(row => {
    if (row.dataset.visible !== 'true') {
      row.style.display = 'none';
      return;
    }

    const matchText = row.textContent.toLowerCase().includes(keyword);
    const matchCategory = category === 'all' || row.dataset.category === category;
    const matchPerintahTarget = !activeTargets.length || activeTargets.includes(row.dataset.category);
    row.style.display = matchText && matchCategory && matchPerintahTarget ? '' : 'none';
  });

  if (typeof renderActivePerintahKategoriIndicator === 'function') {
    renderActivePerintahKategoriIndicator();
  }
}

function selectOpnameCategoryTab(event, category) {
  const select = document.getElementById('opnameCategoryFilter');
  if (select) select.value = category;
  filterOpname();
}

function formatHistoryKodeSo(item) {
  return escapeHtml(item.kode_so || `OPNAME-${item.opname_id}`);
}

async function loadHistory() {
  try {
    const { bulan, tahun } = getOpnameRange();
    const qs = new URLSearchParams({ bulan, tahun });
    state.opnameHistory = toArray(await fetchJson(`/api/opname-history?${qs.toString()}`));
    const body = document.getElementById('historyBody');
    if (!body) return;
    body.innerHTML = '';

    state.opnameHistory.forEach(item => {
      body.innerHTML += `
        <tr>
          <td><strong>${formatHistoryKodeSo(item)}</strong></td>
          <td>${formatDate(item.tanggal_perintah)}</td>
          <td>${formatDateTime(item.tanggal_pelaksanaan)}</td>
          <td>${escapeHtml(item.svp_nama || '-')}</td>
          <td>${escapeHtml(item.pic_pelaksana || item.checker || '-')}</td>
          <td>${escapeHtml(item.lokasi || '-')}</td>
          <td>${formatNumber(item.total_item)}</td>
          <td>${formatNumber(item.total_selisih)}</td>
          <td>
            <button type="button" class="btn-secondary btn-sm" onclick="showHistoryDetail(${item.opname_id})">
              <i data-lucide="eye"></i><span>Detail</span>
            </button>
          </td>
        </tr>
      `;
    });

    if (!state.opnameHistory.length) {
      body.innerHTML = `<tr><td colspan="9">Belum ada history SO pada periode ini.</td></tr>`;
    }

    closeHistoryDetail();
    if (window.lucide) lucide.createIcons();
  } catch (error) {
    console.error('History opname error:', error);
    showToast(error.message || 'Gagal memuat history opname', false);
  }
}

function closeHistoryDetail() {
  const panel = document.getElementById('historyDetailPanel');
  if (panel) panel.style.display = 'none';
}

async function sesuaikanHistoryOpname() {
  const btn = document.getElementById('historySesuaikanBtn');
  const opnameId = Number(btn?.dataset.opnameId);
  if (!opnameId) {
    showToast('Data opname tidak ditemukan', false);
    return;
  }

  if (!window.confirm('Terapkan selisih hasil opname ke stok gudang (penyesuaian)?')) {
    return;
  }

  showLoader();
  try {
    const data = await fetchJson('/api/sesuaikan-opname', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opname_id: opnameId })
    });
    showToast(data.message || 'Stok berhasil disesuaikan');
    await loadHistory();
    await showHistoryDetail(opnameId);
    await loadOpnameKpiData();
  } catch (error) {
    console.error('Sesuaikan history opname error:', error);
    showToast(error.message || 'Gagal menyesuaikan stok', false);
  } finally {
    hideLoader();
  }
}

async function showHistoryDetail(opnameId) {
  showLoader();
  try {
    const data = await fetchJson(`/api/opname-history?opname_id=${opnameId}`);
    const { header, details } = data;

    document.getElementById('historyDetailTitle').textContent =
      `${header.kode_so || `OPNAME-${header.opname_id}`} — ${formatDateTime(header.tanggal_pelaksanaan)}`;

    document.getElementById('historyDetailMeta').innerHTML = `
      <div><label>Kode SO</label><p style="font-weight:600;margin:0;color:#000">${escapeHtml(header.kode_so || '-')}</p></div>
      <div><label>Tanggal Perintah</label><p style="font-weight:600;margin:0;color:#000">${formatDate(header.tanggal_perintah)}</p></div>
      <div><label>Tanggal Pelaksanaan</label><p style="font-weight:600;margin:0;color:#000">${formatDateTime(header.tanggal_pelaksanaan)}</p></div>
      <div><label>SVP</label><p style="font-weight:600;margin:0;color:#000">${escapeHtml(header.svp_nama || '-')}</p></div>
      <div><label>PIC Pelaksana</label><p style="font-weight:600;margin:0;color:#000">${escapeHtml(header.pic_pelaksana || '-')}</p></div>
      <div><label>Lokasi</label><p style="font-weight:600;margin:0;color:#000">${escapeHtml(header.lokasi || '-')}</p></div>
      <div><label>Total Item / Selisih</label><p style="font-weight:600;margin:0;color:#000">${formatNumber(header.total_item)} / ${formatNumber(header.total_selisih)}</p></div>
      <div><label>Keterangan</label><p style="font-weight:600;margin:0;color:#000">${escapeHtml(header.keterangan || '-')}</p></div>
      <div><label>Status Stok</label><p style="font-weight:600;margin:0;color:#000">${header.stok_disesuaikan || header.disesuaikan_at ? `Sudah disesuaikan (${formatDateTime(header.disesuaikan_at)})` : 'Dicatat, belum disesuaikan'}</p></div>
    `;

    const sesuaikanBtn = document.getElementById('historySesuaikanBtn');
    const adaSelisih = details.some(row => Number(row.selisih) !== 0);
    if (sesuaikanBtn) {
      sesuaikanBtn.style.display = 'inline-flex';
      sesuaikanBtn.disabled = Boolean(header.stok_disesuaikan || header.disesuaikan_at) || !adaSelisih;
      sesuaikanBtn.dataset.opnameId = String(header.opname_id);
    }

    const tbody = document.getElementById('historyDetailBody');
    tbody.innerHTML = details.length
      ? details.map(row => `
        <tr>
          <td>${escapeHtml(row.sku)}</td>
          <td>${escapeHtml(row.nama_produk || '-')}</td>
          <td style="text-align:right">${formatNumber(row.stok_sistem)}</td>
          <td style="text-align:right">${formatNumber(row.stok_fisik)}</td>
          <td style="text-align:right;color:${row.selisih === 0 ? '#000' : row.selisih > 0 ? '#e65100' : '#c62828'}">${formatNumber(row.selisih)}</td>
          <td>${formatDateTime(row.input_at)}</td>
        </tr>
      `).join('')
      : '<tr><td colspan="6">Tidak ada detail produk.</td></tr>';

    document.getElementById('historyDetailPanel').style.display = 'block';
    document.getElementById('historyDetailPanel')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (window.lucide) lucide.createIcons();
  } catch (error) {
    console.error('History detail error:', error);
    showToast(error.message || 'Gagal memuat detail history', false);
  } finally {
    hideLoader();
  }
}

async function exportOpnameHistory() {
  try {
    const { bulan, tahun } = getOpnameRange();
    const qs = new URLSearchParams({ bulan, tahun, detail: 'true' });
    const data = await fetchJson(`/api/opname-history?${qs.toString()}`);

    if (!data?.details?.length) {
      showToast('Tidak ada detail history SO untuk diekspor', false);
      return;
    }

    downloadCsv(
      `history_so_${tahun}_${String(bulan).padStart(2, '0')}.csv`,
      [
        'kode_so', 'tanggal_perintah', 'tanggal_pelaksanaan', 'svp_nama', 'pic_pelaksana',
        'lokasi', 'sku', 'nama_produk', 'stok_sistem', 'stok_fisik', 'selisih', 'waktu_input'
      ],
      data.details.map(row => [
        row.kode_so || `OPNAME-${row.opname_id}`,
        formatDate(row.tanggal_perintah),
        formatDateTime(row.tanggal_pelaksanaan),
        row.svp_nama || '',
        row.pic_pelaksana || '',
        row.lokasi || '',
        row.sku,
        row.nama_produk || '',
        row.stok_sistem,
        row.stok_fisik,
        row.selisih,
        formatDateTime(row.input_at)
      ])
    );
  } catch (error) {
    console.error('Export history error:', error);
    showToast(error.message || 'Gagal mengekspor history opname', false);
  }
}

async function simpanOpname() {
  if (!state.activePerintah?.id) {
    showToast('Pilih perintah SO dari tab Hasil SO terlebih dahulu', false);
    showOpnameTab(null, 'opnameHasil');
    return;
  }

  const checker = document.getElementById('opnameChecker')?.value?.trim();
  const lokasi = document.getElementById('opnameGudang')?.value?.trim();

  if (!checker) {
    showToast('Isi nama PIC pelaksana terlebih dahulu', false);
    return;
  }

  if (!lokasi) {
    showToast('Isi lokasi gudang terlebih dahulu', false);
    return;
  }

  const items = Object.entries(state.opnameScan).map(([sku, data]) => ({
    sku,
    sistem: data.sistem,
    fisik: data.fisik
  }));

  if (!items.length) {
    showToast('Tidak ada data scan untuk disimpan. Lakukan scan minimal 1 barang', false);
    return;
  }

  showLoader();
  try {
    const body = {
      tanggal: getTodayLocalDate(),
      checker,
      lokasi,
      items,
      perintah_id: state.activePerintah.id,
      keterangan: state.activePerintah.keterangan || null
    };

    const data = await fetchJson('/api/simpan-opname', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    showToast(data.message || 'Hasil opname berhasil difinalisasi');
    stopOpnameScanner();
    state.activePerintah = null;
    state.opnameScan = {};
    updateOpnameInputVisibility();
    updateOpnameScanSummary();
    refreshOpnameMetrics();
    await loadPerintahList();
    await loadHistory();
    showOpnameTab(null, 'opnameHasil');
  } catch (error) {
    console.error('Simpan opname error:', error);
    showToast(error.message || 'Gagal menyimpan opname', false);
  } finally {
    hideLoader();
  }
}

function exportOpname() {
  const rows = [...document.querySelectorAll('#opnameBody tr')]
    .filter(row => hasOpnameInput(row))
    .map(row => {
      const sku = row.children[0].textContent.trim();
      const kategori = row.children[3].textContent.trim();
      const sistem = row.children[4].textContent.trim();
      const input = document.getElementById(`fisik-${sku}`);
      const fisik = input?.value === '' ? sistem : input?.value || '0';
      const selisih = Number(String(fisik).replace(/\./g, '').replace(/,/g, '')) - Number(String(sistem).replace(/\./g, '').replace(/,/g, ''));
      return [sku, row.children[1].textContent.trim(), row.children[2].textContent.trim(), kategori, sistem, fisik, selisih];
    });

  downloadCsv(`opname_${getTahun()}_${getBulan()}.csv`, ['sku', 'nama_produk', 'rak', 'kategori', 'stok_sistem', 'stok_fisik', 'selisih'], rows);
}

function downloadOpnameTemplate() {
  const csv = 'sku,stok_fisik\nSKU001,10\nSKU002,5';
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'template_opname.csv';
  link.click();
  URL.revokeObjectURL(url);
}

async function previewOpnameImport() {
  const file = document.getElementById('opnameImportFile')?.files?.[0];
  if (!file) {
    showToast('Pilih file CSV opname terlebih dahulu', false);
    return;
  }

  const csv = await readFileAsText(file);
  const lines = csv.split(/\r?\n/).filter(Boolean);
  const previewEl = document.getElementById('opnameImportPreview');

  let html = `<div class="table-shell"><table class="table"><thead><tr>`;
  lines[0].split(',').forEach(header => {
    html += `<th>${escapeHtml(header.trim())}</th>`;
  });
  html += `</tr></thead><tbody>`;

  for (let index = 1; index < Math.min(lines.length, 6); index += 1) {
    html += '<tr>';
    lines[index].split(',').forEach(cell => {
      html += `<td>${escapeHtml(cell.trim())}</td>`;
    });
    html += '</tr>';
  }

  html += `</tbody></table></div>
    <div class="top-space">
      <button class="btn-primary" onclick="importOpnameCSV()">Import ke Tabel Opname</button>
    </div>`;

  previewEl.innerHTML = html;
  previewEl.dataset.csv = csv;
}

async function importOpnameCSV() {
  const previewEl = document.getElementById('opnameImportPreview');
  const csv = previewEl?.dataset.csv;
  if (!csv) {
    showToast('Preview file opname dulu sebelum import', false);
    return;
  }

  if (!state.opname.length) {
    await loadStokSistem();
  }

  let applied = 0;
  let skipped = 0;
  const hasTable = Boolean(document.getElementById('opnameBody'));

  csv.split(/\r?\n/).slice(1).filter(Boolean).forEach(line => {
    const [skuRaw, stokFisikRaw] = line.split(',').map(item => item.trim());
    if (!skuRaw || !stokFisikRaw) {
      skipped += 1;
      return;
    }

    const product = state.opname.find(item =>
      String(item.sku || item.kode_barang || '').toLowerCase() === skuRaw.toLowerCase()
    );

    if (!product) {
      skipped += 1;
      return;
    }

    const fisikQty = Number(stokFisikRaw);
    if (!Number.isFinite(fisikQty) || fisikQty < 0) {
      skipped += 1;
      return;
    }

    const sistem = getProductStokSistem(product);
    const sku = product.sku || product.kode_barang;

    if (hasTable) {
      const input = document.getElementById(`fisik-${sku}`);
      if (!input) {
        skipped += 1;
        return;
      }

      input.value = String(fisikQty);
      input.closest('tr')?.setAttribute('data-scanned', 'true');
      input.closest('tr')?.setAttribute('data-visible', 'true');
      hitungSelisih(sku);
    } else {
      state.opnameScan[sku] = {
        nama: product.nama_barang || product.nama_produk,
        sistem,
        fisik: fisikQty,
        selisih: fisikQty - sistem
      };
      updateOpnameScanSummary();
    }

    applied += 1;
  });

  showToast(`Import opname selesai (${applied} diterapkan, ${skipped} dilewati)`, applied > 0);
  showOpnameTab(null, 'opnameInput');
  document.querySelector('.tab-menu-opname button:nth-child(2)')?.classList.add('active-tab');
}

async function applyManualOpnameScan() {
  try {
    if (!state.activePerintah?.id) {
      showToast('Pilih perintah SO dari tab Hasil SO terlebih dahulu', false);
      showOpnameTab(null, 'opnameHasil');
      return;
    }

    const input = document.getElementById('manualOpnameScan');
    const sku = input?.value?.trim();
    if (!sku) {
      showToast('Isi SKU atau barcode produk terlebih dahulu', false);
      return;
    }

    if (!state.opname.length) {
      await loadStokSistem();
    }

    const product = state.opname.find(p => 
      p.sku?.toLowerCase() === sku.toLowerCase() || 
      p.kode_barang?.toLowerCase() === sku.toLowerCase()
    );

    if (!product) {
      showToast(`SKU "${sku}" tidak ditemukan di stok sistem periode ini`, false);
      input.value = '';
      input.focus();
      return;
    }

    await promptOpnameQty(product);
  } catch (error) {
    console.error('Manual opname scan error:', error);
    showToast(error.message || 'Gagal memproses scan manual', false);
  }
}

let opnameQtyModalResolver = null;
let opnameQtyModalProduct = null;
let opnameQtyModalSystemQty = 0;

function initOpnameQtyModal() {
  const modal = document.getElementById('opnameQtyModal');
  const input = document.getElementById('opnameQtyModalInput');
  const preview = document.getElementById('opnameQtySelisihPreview');
  if (!modal || !input) return;

  const closeModal = (value) => {
    modal.classList.remove('app-modal--open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    const resolve = opnameQtyModalResolver;
    opnameQtyModalResolver = null;
    opnameQtyModalProduct = null;
    resolve?.(value);
  };

  const updateSelisihPreview = () => {
    if (!preview) return;
    const raw = input.value.trim();
    if (raw === '') {
      preview.hidden = true;
      return;
    }

    const fisik = Number(raw);
    if (!Number.isFinite(fisik)) {
      preview.hidden = true;
      return;
    }

    const selisih = fisik - opnameQtyModalSystemQty;
    preview.hidden = false;
    preview.className = 'opname-qty-selisih';
    if (selisih === 0) {
      preview.classList.add('opname-qty-selisih--match');
      preview.textContent = 'Selisih: 0 — stok sesuai sistem';
    } else if (selisih > 0) {
      preview.classList.add('opname-qty-selisih--plus');
      preview.textContent = `Selisih: +${formatNumber(selisih)} (lebih dari sistem)`;
    } else {
      preview.classList.add('opname-qty-selisih--minus');
      preview.textContent = `Selisih: ${formatNumber(selisih)} (kurang dari sistem)`;
    }
  };

  const adjustQty = (delta) => {
    const current = input.value === '' ? opnameQtyModalSystemQty : Number(input.value || 0);
    const next = Math.max(0, current + delta);
    input.value = String(next);
    updateSelisihPreview();
  };

  const confirmQty = () => {
    const raw = input.value.trim();
    if (raw === '') {
      showToast('Masukkan qty fisik terlebih dahulu', false);
      input.focus();
      return;
    }

    const fisikQty = Number(raw);
    if (!Number.isFinite(fisikQty) || fisikQty < 0) {
      showToast('Qty fisik harus angka positif', false);
      input.focus();
      return;
    }

    closeModal(fisikQty);
  };

  modal.querySelectorAll('[data-opname-qty-close]').forEach(el => {
    el.addEventListener('click', () => closeModal(null));
  });

  document.getElementById('opnameQtyModalCancel')?.addEventListener('click', () => closeModal(null));
  document.getElementById('opnameQtyModalConfirm')?.addEventListener('click', confirmQty);
  document.getElementById('opnameQtyDec')?.addEventListener('click', () => adjustQty(-1));
  document.getElementById('opnameQtyInc')?.addEventListener('click', () => adjustQty(1));
  input.addEventListener('input', updateSelisihPreview);

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      confirmQty();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal(null);
    }
  });

  modal.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeModal(null);
  });
}

function openOpnameQtyModal(product, systemQty, currentQty = '') {
  const modal = document.getElementById('opnameQtyModal');
  const input = document.getElementById('opnameQtyModalInput');
  const preview = document.getElementById('opnameQtySelisihPreview');
  if (!modal || !input) {
    return Promise.resolve(null);
  }

  const nama = product.nama_barang || product.nama_produk || '-';
  const sku = product.sku || product.kode_barang || '-';

  opnameQtyModalProduct = product;
  opnameQtyModalSystemQty = systemQty;

  document.getElementById('opnameQtyModalTitle').textContent = nama;
  document.getElementById('opnameQtyModalSku').textContent = `SKU: ${sku}`;
  document.getElementById('opnameQtyModalSistem').textContent = formatNumber(systemQty);
  input.value = currentQty === '' || currentQty === undefined ? '' : String(currentQty);

  if (preview) {
    preview.hidden = true;
    preview.className = 'opname-qty-selisih';
  }

  modal.classList.add('app-modal--open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  if (window.lucide) lucide.createIcons();

  window.setTimeout(() => {
    input.focus();
    input.select();
  }, 80);

  return new Promise(resolve => {
    opnameQtyModalResolver = resolve;
  });
}

async function promptOpnameQty(product) {
  const systemQty = getProductStokSistem(product);
  const currentQty = state.opnameScan[product.sku]?.fisik ?? '';
  const fisikQty = await openOpnameQtyModal(product, systemQty, currentQty);

  if (fisikQty === null) return;

  state.opnameScan[product.sku] = {
    nama: product.nama_barang || product.nama_produk,
    sistem: systemQty,
    fisik: fisikQty,
    selisih: fisikQty - systemQty
  };

  displayScanResult(product, fisikQty, systemQty);
  updateOpnameScanSummary();
  refreshOpnameMetrics();
  await autoSaveOpname({ silent: true });

  const input = document.getElementById('manualOpnameScan');
  if (input) {
    input.value = '';
    input.focus();
  }
}

function displayScanResult(product, fisik, sistem) {
  const selisih = fisik - sistem;
  const resultDiv = document.getElementById('scanResultDetail');
  const resultPanel = document.getElementById('opnameScanResult');

  if (!resultDiv || !resultPanel) return;

  resultDiv.innerHTML = `
    <div style="background: #2a2e33; padding: 12px; border-radius: 6px; color: #f5f7fa;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
        <div>
          <label style="font-size: 12px; color: #a8b0ba;">SKU</label>
          <p style="font-weight: 600; margin: 0; color: #f5f7fa;">${escapeHtml(product.sku)}</p>
        </div>
        <div>
          <label style="font-size: 12px; color: #a8b0ba;">Produk</label>
          <p style="font-weight: 600; margin: 0; color: #f5f7fa;">${escapeHtml(product.nama_barang || product.nama_produk)}</p>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
        <div style="text-align: center; padding: 12px; background: #25292e; border-radius: 4px;">
          <p style="margin: 0; font-size: 12px; color: #a8b0ba;">Sistem</p>
          <p style="margin: 0; font-size: 20px; font-weight: 700; color: #f5f7fa;">${formatNumber(sistem)}</p>
        </div>
        <div style="text-align: center; padding: 12px; background: #25292e; border-radius: 4px;">
          <p style="margin: 0; font-size: 12px; color: #a8b0ba;">Fisik</p>
          <p style="margin: 0; font-size: 20px; font-weight: 700; color: #f5f7fa;">${formatNumber(fisik)}</p>
        </div>
        <div style="text-align: center; padding: 12px; background: ${selisih === 0 ? 'rgba(52,199,89,0.18)' : selisih > 0 ? 'rgba(255,176,32,0.18)' : 'rgba(255,107,107,0.18)'}; border-radius: 4px;">
          <p style="margin: 0; font-size: 12px; color: #a8b0ba;">Selisih</p>
          <p style="margin: 0; font-size: 20px; font-weight: 700; color: ${selisih === 0 ? '#34c759' : selisih > 0 ? '#ffb020' : '#ff6b6b'};">${formatNumber(selisih)}</p>
        </div>
      </div>
    </div>
  `;
  
  resultPanel.style.display = 'block';
}

function updateOpnameScanSummary() {
  let totalCount = 0;
  let totalSistem = 0;
  let totalFisik = 0;
  let totalSelisih = 0;

  Object.values(state.opnameScan).forEach(item => {
    totalCount++;
    totalSistem += item.sistem;
    totalFisik += item.fisik;
    totalSelisih += item.selisih;
  });

  setText('scanCount', formatNumber(totalCount));
  setText('scanSistem', formatNumber(totalSistem));
  setText('scanFisik', formatNumber(totalFisik));
  setText('scanSelisih', formatNumber(totalSelisih));
  refreshOpnameMetrics();
  if (typeof renderActivePerintahKategoriIndicator === 'function') {
    renderActivePerintahKategoriIndicator();
  }
}

async function autoSaveOpname({ silent = true } = {}) {
  if (!state.activePerintah?.id) return;
  const items = Object.entries(state.opnameScan).map(([sku, data]) => ({
    sku,
    sistem: Number(data.sistem || 0),
    fisik: Number(data.fisik || 0)
  }));
  if (!items.length) return;

  try {
    const body = {
      tanggal: getTodayLocalDate(),
      checker: document.getElementById('opnameChecker')?.value?.trim() || null,
      lokasi: document.getElementById('opnameGudang')?.value?.trim() || null,
      items,
      perintah_id: state.activePerintah.id,
      keterangan: state.activePerintah.keterangan || null,
      partial: true
    };

    await fetchJson('/api/simpan-opname', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch (error) {
    console.error('Auto save opname error:', error);
    if (!silent) showToast(error.message || 'Gagal menyimpan opname otomatis', false);
  }
}

function loadScannerLibrary() {
  const urls = [
    'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js',
    'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'
  ];

  return new Promise((resolve, reject) => {
    if (window.Html5Qrcode) {
      resolve();
      return;
    }

    const tryLoad = index => {
      if (index >= urls.length) {
        reject(new Error('Gagal memuat library scanner dari semua CDN'));
        return;
      }

      const script = document.createElement('script');
      script.src = urls[index];
      script.async = true;
      script.onload = () => {
        if (window.Html5Qrcode) {
          resolve();
        } else {
          tryLoad(index + 1);
        }
      };
      script.onerror = () => {
        script.remove();
        tryLoad(index + 1);
      };
      document.head.appendChild(script);
    };

    tryLoad(0);
  });
}

async function startOpnameScanner() {
  if (!state.activePerintah?.id) {
    showToast('Pilih perintah SO dari tab Hasil SO terlebih dahulu', false);
    return;
  }

  const scanContainer = document.getElementById('scannerPreview');
  if (!scanContainer) {
    showToast('Container scanner tidak ditemukan', false);
    return;
  }

  if (!window.Html5Qrcode) {
    try {
      await loadScannerLibrary();
    } catch (error) {
      console.error(error);
      showToast('Library scanner tidak tersedia', false);
      return;
    }
  }

  if (opnameScanner) {
    opnameScanner.clear().catch(() => {});
  }

  opnameScanner = new Html5Qrcode('scannerPreview');
  const config = { fps: 10, qrbox: { width: 280, height: 180 } };

  opnameScanner.start(
    { facingMode: 'environment' },
    config,
    qrCodeMessage => {
      const statusEl = document.getElementById('scanOpnameStatus');
      if (statusEl) statusEl.textContent = 'Barcode terbaca';
      applyScannedOpname(qrCodeMessage);
    },
    errorMessage => {
      console.debug('Scanner info:', errorMessage);
    }
  ).catch(error => {
    console.error('Scanner gagal dimulai:', error);
    showToast('Gagal mengaktifkan kamera scan', false);
  });
}

function stopOpnameScanner() {
  if (!opnameScanner) return;
  opnameScanner.stop().then(() => {
    opnameScanner.clear().catch(() => {});
    opnameScanner = null;
    document.getElementById('scanOpnameStatus').textContent = 'Scanner berhenti';
  }).catch(error => {
    console.error('Gagal stop scanner', error);
  });
}

function resetOpnameScanState() {
  stopOpnameScanner();
  state.opnameScan = {};
  const manualInput = document.getElementById('manualOpnameScan');
  if (manualInput) manualInput.value = '';
  const statusEl = document.getElementById('scanOpnameStatus');
  if (statusEl) statusEl.textContent = 'Siap scan';
  const resultPanel = document.getElementById('opnameScanResult');
  if (resultPanel) resultPanel.style.display = 'none';
  updateOpnameScanSummary();
  refreshOpnameMetrics();
  manualInput?.focus();
}

function setOpnameScannerMode(mode) {
  opnameScannerMode = mode;
  document.getElementById('scanOpnameStatus').textContent = `Mode scan: ${mode}`;
}

function applyScannedOpname(barcode) {
  const normalized = barcode.trim();
  if (!normalized) return;

  const manualInput = document.getElementById('manualOpnameScan');
  if (manualInput) {
    manualInput.value = normalized;
    applyManualOpnameScan();
    return;
  }

  const rows = [...document.querySelectorAll('#opnameBody tr')];
  let found = false;

  rows.forEach(row => {
    const sku = row.children[0].textContent.trim();
    const nama = row.children[1].textContent.trim();
    const rakBarcode = row.dataset.rakBarcode || '';

    if (opnameScannerMode === 'rak' && rakBarcode && rakBarcode === normalized) {
      showOpnameRow(row);
      setText('opnameLastScanBadge', `Rak: ${normalized}`);
      found = true;
    }

    if (opnameScannerMode === 'barang' && (sku === normalized || nama.toLowerCase().includes(normalized.toLowerCase()))) {
      showOpnameRow(row);
      row.querySelector('.input-opname')?.focus();
      setText('opnameLastScanBadge', `Produk: ${sku}`);
      found = true;
    }
  });

  if (!found) {
    showToast('Barcode tidak ditemukan', false);
  }
}

function printOpname() {
  const checker = document.getElementById('opnameChecker')?.value?.trim() || '................................';
  const gudang = document.getElementById('opnameGudang')?.value?.trim() || '................................';
  const category = document.getElementById('opnamePrintCategory')?.value || 'all';
  const rows = [...document.querySelectorAll('#opnameBody tr')]
    .filter(row => hasOpnameInput(row))
    .filter(row => category === 'all' || row.dataset.category === category);

  if (!rows.length) {
    showToast('Tidak ada data opname yang sudah diisi untuk kategori yang dipilih', false);
    return;
  }

  const tableRows = rows.map((row, index) => {
    const sku = row.children[0].textContent.trim();
    const sistem = row.children[4].textContent.trim();
    const fisik = document.getElementById(`fisik-${sku}`)?.value || '';
    const selisih = row.children[6].textContent.trim();

    return [
      index + 1,
      sku,
      row.children[1].textContent.trim(),
      row.children[2].textContent.trim(),
      row.children[3].textContent.trim(),
      sistem,
      fisik,
      selisih
    ];
  });

  const title = `Form Stok Opname Gudang - ${getBulanLabel(document.getElementById('opnameBulan')?.value)} ${document.getElementById('opnameTahun')?.value}`;
  const summary = [
    ['Checker', checker],
    ['Gudang / Lokasi', gudang],
    ['Tanggal Cetak', formatDate(new Date())]
  ];

  openPrintWindow({
    title,
    subtitle: `Periode ${getBulanLabel(document.getElementById('opnameBulan')?.value)} ${document.getElementById('opnameTahun')?.value}`,
    summary,
    headers: ['No', 'SKU', 'Nama Produk', 'Rak', 'Kategori', 'Stok Sistem', 'Stok Fisik', 'Selisih'],
    rows: tableRows
  });
}

function exportCurrentModule() {
  if (currentMenu === "persediaan") {
    downloadCsv(
      `persediaan_${getTahun()}_${getBulan()}.csv`,
      ["sku", "nama_produk", "kategori", "opening", "pembelian", "keluar_gudang", "penyesuaian", "stok_akhir"],
      state.persediaan.map(item => [
        item.sku,
        item.nama_produk,
        getOpnameCategoryLabel(getOpnameCategory(item.nama_produk)),
        item.stok_awal,
        item.pembelian,
        item.penjualan,
        item.penyesuaian,
        item.stok_akhir
      ])
    );
    return;
  }

  if (currentMenu === "audit") {
    const outletVisible = document.getElementById("auditOutletStock")?.style.display !== "none";
    if (outletVisible) {
      downloadCsv(
        `audit_stok_outlet_${getTahun()}_${getBulan()}.csv`,
        ["outlet", "sku", "nama_produk", "opening", "stok_masuk", "stok_keluar", "penyesuaian", "stok_akhir"],
        state.audit.outlet_summary.map(item => [item.nama_outlet, item.sku, item.nama_produk, item.opening_stok, item.stok_masuk, item.stok_keluar, item.penyesuaian, item.stok_akhir])
      );
    } else {
      downloadCsv(
        `audit_mutasi_${getTahun()}_${getBulan()}.csv`,
        ["tanggal", "sumber", "jenis", "outlet", "sku", "qty", "referensi", "keterangan"],
        state.audit.movements.map(item => [item.tanggal, item.sumber, item.jenis, item.nama_outlet, item.sku, item.qty, item.referensi, item.keterangan])
      );
    }
    return;
  }

  if (currentMenu === "forecast") {
    downloadCsv(
      `forecast_${getTahun()}_${getBulan()}.csv`,
      ["sku", "nama_produk", "bulan_1", "bulan_2", "bulan_3", "ema_3_bulan", "forecast_bulan_depan"],
      state.forecast.map(item => [item.sku, item.nama_produk, item.bulan_1, item.bulan_2, item.bulan_3, item.ema_3_bulan, item.forecast_bulan_depan])
    );
  }
}

function downloadCsv(filename, headers, rows) {
  const content = [
    headers.join(","),
    ...rows.map(row => row.map(cell => csvEscape(cell)).join(","))
  ].join("\n");

  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function printCurrentView() {
  if (currentMenu === "penjualan") {
    openPrintWindow({
      title: "Ringkasan Penjualan Warehouse",
      subtitle: `Periode ${getBulanLabel()} ${getTahun()}${getSelectedSku() ? ` | SKU ${getSelectedSku()}` : ""}`,
      summary: [
        ["Total Qty", document.getElementById("kpi_qty")?.textContent || "0"],
        ["Total Penjualan", document.getElementById("kpi_nilai")?.textContent || "Rp 0"],
        ["Total Modal", document.getElementById("kpi_modal")?.textContent || "Rp 0"],
        ["Profit", document.getElementById("kpi_profit")?.textContent || "Rp 0"]
      ]
    });
    return;
  }

  if (currentMenu === "persediaan") {
    openPrintWindow({
      title: "Laporan Persediaan Warehouse",
      subtitle: `Periode ${getBulanLabel()} ${getTahun()}`,
      headers: ["SKU", "Nama Produk", "Kategori", "Opening", "Pembelian", "Keluar Gudang", "Penyesuaian", "Stok Akhir"],
      rows: state.persediaan.map(item => [
        item.sku,
        item.nama_produk,
        getOpnameCategoryLabel(getOpnameCategory(item.nama_produk)),
        item.stok_awal,
        item.pembelian,
        item.penjualan,
        item.penyesuaian,
        item.stok_akhir
      ])
    });
    return;
  }

  if (currentMenu === "audit") {
    openPrintWindow({
      title: "Laporan Audit Stok Outlet",
      subtitle: `Periode ${getBulanLabel()} ${getTahun()}`,
      summary: [
        ["Status DB Audit", state.audit.db_ready ? "Siap" : "Perlu tabel tambahan"],
        ["Total Mutasi", formatNumber(state.audit.summary?.total_mutasi)],
        ["Stok Masuk Outlet", formatNumber(state.audit.summary?.stok_masuk_outlet)],
        ["Penjualan Outlet", formatNumber(state.audit.summary?.penjualan_outlet)]
      ],
      headers: ["Outlet", "SKU", "Nama Produk", "Opening", "Masuk", "Keluar", "Penyesuaian", "Stok Akhir"],
      rows: state.audit.outlet_summary.map(item => [item.nama_outlet, item.sku, item.nama_produk, item.opening_stok, item.stok_masuk, item.stok_keluar, item.penyesuaian, item.stok_akhir])
    });
    return;
  }

  if (currentMenu === "forecast") {
    openPrintWindow({
      title: "Laporan Forecast Penjualan",
      subtitle: `Periode ${getBulanLabel()} ${getTahun()}`,
      headers: ["SKU", "Nama Produk", "Bulan -2", "Bulan -1", "Bulan Aktif", "EMA 3 Bulan", "Forecast +10%"],
      rows: state.forecast.map(item => [item.sku, item.nama_produk, item.bulan_1, item.bulan_2, item.bulan_3, item.ema_3_bulan, item.forecast_bulan_depan])
    });
    return;
  }

  if (currentMenu === "opname") {
    printOpname();
  }
}

function openPrintWindow({ title, subtitle = "", summary = [], headers = [], rows = [] }) {
  const printWindow = window.open("", "_blank", "width=1280,height=900");
  if (!printWindow) {
    showToast("Popup print diblokir browser", false);
    return;
  }

  const summaryHtml = summary.length
    ? `
      <table class="summary">
        <tbody>
          ${summary.map(item => `<tr><td>${escapeHtml(item[0])}</td><td>${escapeHtml(item[1])}</td></tr>`).join("")}
        </tbody>
      </table>
    `
    : "";

  const tableHtml = headers.length
    ? `
      <table class="main">
        <thead>
          <tr>${headers.map(header => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${rows.length
            ? rows.map(row => `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")
            : `<tr><td colspan="${headers.length}">Tidak ada data untuk dicetak.</td></tr>`}
        </tbody>
      </table>
    `
    : "";

  printWindow.document.write(`
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #1f2933; padding: 30px; }
          .brand { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
          .brand img { width: 68px; height: 68px; object-fit: contain; }
          .brand h1 { margin: 0; font-size: 28px; }
          .brand p { margin: 4px 0 0; color: #677788; }
          .summary, .main { width: 100%; border-collapse: collapse; margin-top: 18px; }
          .summary td, .main td, .main th { border: 1px solid #d9dee7; padding: 10px 12px; font-size: 13px; }
          .main th { background: #f8f2e7; text-transform: uppercase; font-size: 11px; letter-spacing: 0.08em; }
          .footer { margin-top: 18px; color: #677788; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="brand">
          <img src="/assets/logo.png" alt="CV EPIC Warehouse">
          <div>
            <h1>CV EPIC Warehouse</h1>
            <p>${escapeHtml(title)}</p>
            <p>${escapeHtml(subtitle)}</p>
          </div>
        </div>
        ${summaryHtml}
        ${tableHtml}
        <div class="footer">Dicetak pada ${new Date().toLocaleDateString("id-ID")} ${new Date().toLocaleTimeString("id-ID")}</div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

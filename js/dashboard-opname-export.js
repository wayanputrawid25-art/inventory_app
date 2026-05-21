// Export SO Sessions Functions

async function loadExportSessions() {
  showLoader();
  try {
    const { bulan, tahun } = getOpnameRange();
    const qs = new URLSearchParams({ bulan, tahun });
    const sessions = toArray(await fetchJson(`/api/opname-export?${qs.toString()}`));
    
    const listContainer = document.getElementById('exportSessionList');
    if (!listContainer) return;

    if (!sessions.length) {
      listContainer.innerHTML = `
        <div style="padding: 24px; text-align: center; color: #999;">
          <p>Tidak ada Stok Opname selesai pada periode ini</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = sessions.map((session, idx) => {
      const soCode = `SO${String(idx + 1).padStart(3, '0')}`;
      const status = session.total_item_selisih > 0 ? 'Ada Selisih' : 'Seimbang';
      
      return `
        <div style="
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
          background: white;
        " onclick="showExportDetail(${session.id}, '${soCode}')" onmouseover="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'" onmouseout="this.style.boxShadow='none'">
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 8px;">
            <div>
              <p style="margin: 0; font-size: 12px; color: #666;">Kode SO</p>
              <p style="margin: 0; font-weight: 600; font-size: 14px;">${soCode}</p>
            </div>
            <div>
              <p style="margin: 0; font-size: 12px; color: #666;">Tanggal</p>
              <p style="margin: 0; font-weight: 600; font-size: 14px;">${formatDate(session.tanggal)}</p>
            </div>
            <div>
              <p style="margin: 0; font-size: 12px; color: #666;">PIC</p>
              <p style="margin: 0; font-weight: 600; font-size: 14px;">${escapeHtml(session.checker || '-')}</p>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div style="background: #f5f5f5; padding: 8px; border-radius: 4px;">
              <p style="margin: 0; font-size: 11px; color: #666;">Total Item</p>
              <p style="margin: 0; font-weight: 600; font-size: 13px;">${session.total_item}</p>
            </div>
            <div style="background: ${session.total_item_selisih > 0 ? '#fff3e0' : '#e8f5e9'}; padding: 8px; border-radius: 4px;">
              <p style="margin: 0; font-size: 11px; color: #666;">Status</p>
              <p style="margin: 0; font-weight: 600; font-size: 13px; color: ${session.total_item_selisih > 0 ? '#e65100' : '#2e7d32'};">${status}</p>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Load export sessions error:', error);
    showToast(error.message || 'Gagal memuat daftar SO', false);
  } finally {
    hideLoader();
  }
}

async function showExportDetail(opnameId, soCode) {
  showLoader();
  try {
    const qs = new URLSearchParams({ opname_id: opnameId });
    const data = await fetchJson(`/api/opname-export?${qs.toString()}`);

    const { header, details } = data;

    // Populate detail section
    document.getElementById('exportDetailCode').textContent = soCode;
    document.getElementById('exportDetailDate').textContent = formatDate(header.tanggal);
    document.getElementById('exportDetailPic').textContent = escapeHtml(header.checker || '-');
    document.getElementById('exportDetailLokasi').textContent = escapeHtml(header.lokasi || '-');
    document.getElementById('exportDetailStatus').textContent = 
      header.total_item_selisih > 0 ? 'Ada Selisih' : 'Seimbang';

    // Populate details table
    const tbody = document.getElementById('exportDetailBody');
    tbody.innerHTML = details.map(d => `
      <tr>
        <td>${escapeHtml(d.sku)}</td>
        <td>${escapeHtml(d.nama_produk || '-')}</td>
        <td style="text-align: right;">${formatNumber(d.stok_sistem)}</td>
        <td style="text-align: right;">${formatNumber(d.stok_fisik)}</td>
        <td style="text-align: right; color: ${d.selisih === 0 ? '#333' : d.selisih > 0 ? '#e65100' : '#c62828'}; font-weight: ${d.selisih !== 0 ? '600' : 'normal'};">
          ${formatNumber(d.selisih)}
        </td>
      </tr>
    `).join('');

    // Store for export
    window._currentExportData = { header, details, soCode };

    // Show detail view, hide list
    document.getElementById('opnameExportList').style.display = 'none';
    document.getElementById('opnameExportDetail').style.display = 'block';
  } catch (error) {
    console.error('Show export detail error:', error);
    showToast(error.message || 'Gagal memuat detail SO', false);
  } finally {
    hideLoader();
  }
}

function goBackExportList() {
  document.getElementById('opnameExportDetail').style.display = 'none';
  document.getElementById('opnameExportList').style.display = 'block';
  window._currentExportData = null;
}

function exportSOcsv() {
  if (!window._currentExportData) {
    showToast('Data SO tidak tersedia', false);
    return;
  }

  const { header, details, soCode } = window._currentExportData;

  // Build CSV rows
  const rows = details.map(d => [
    formatDate(header.tanggal),
    escapeHtml(header.checker || '-'),
    escapeHtml(header.lokasi || '-'),
    d.sku,
    d.nama_produk || '',
    d.stok_sistem,
    d.stok_fisik,
    d.selisih
  ]);

  // Download
  downloadCsv(
    `${soCode}_${formatDate(header.tanggal)}.csv`,
    ['Tanggal', 'PIC', 'Lokasi', 'SKU', 'Produk', 'Qty Sistem', 'Qty Fisik', 'Selisih'],
    rows
  );

  showToast('CSV berhasil diunduh');
}

// ═══════════════════════════════════════════════════════
// EPCB Dashboard — Apps Script v5
// Sheet Projects: id,name,group,status,deadline,pct,risk,owner,notes,links,timeline,updated_at
// Sheet Timeline: project_id, project_name, start, end, milestone_1..N (dễ đọc)
// ═══════════════════════════════════════════════════════
const SHEET_NAME = "Projects";
const TL_SHEET   = "Timeline View";
const HEADERS    = ["id","name","group","status","deadline","pct","risk","owner","notes","links","timeline","updated_at"];

// ── Sheets ────────────────────────────────────────────
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let s = ss.getSheetByName(SHEET_NAME);
  if (!s) {
    s = ss.insertSheet(SHEET_NAME);
    s.getRange(1,1,1,HEADERS.length).setValues([HEADERS])
     .setBackground("#1e2d3d").setFontColor("#fff").setFontWeight("bold");
    s.setFrozenRows(1);
  }
  ensureCols(s);
  return s;
}

function getTlViewSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let s = ss.getSheetByName(TL_SHEET);
  if (!s) {
    s = ss.insertSheet(TL_SHEET);
    setupTlViewSheet(s);
  }
  return s;
}

function setupTlViewSheet(s) {
  const headers = ["Dự án","Bắt đầu","Kết thúc","Số ngày","Trạng thái","Milestone 1","Ngày MS1","Milestone 2","Ngày MS2","Milestone 3","Ngày MS3","Milestone 4","Ngày MS4","Milestone 5","Ngày MS5"];
  s.getRange(1,1,1,headers.length).setValues([headers])
   .setBackground("#1e3d2d").setFontColor("#fff").setFontWeight("bold");
  s.setFrozenRows(1);
  s.setColumnWidth(1, 200); // Dự án
  s.setColumnWidth(2, 100); // Bắt đầu
  s.setColumnWidth(3, 100); // Kết thúc
  s.setColumnWidth(4, 80);  // Số ngày
  s.setColumnWidth(5, 120); // Trạng thái
  // Milestone columns
  for (let i = 6; i <= 15; i++) {
    s.setColumnWidth(i, i%2===0 ? 160 : 100);
  }
}

// ── JSONP output ──────────────────────────────────────
function makeOutput(cb, data) {
  const json = JSON.stringify(data);
  return ContentService.createTextOutput(cb ? cb+'('+json+')' : json)
    .setMimeType(cb ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}

// ── GET ───────────────────────────────────────────────
function doGet(e) {
  const cb = (e.parameter && e.parameter.callback) || '';
  try {
    if (e.parameter && e.parameter.method === 'POST') {
      let body;
      if (e.parameter.b64) {
        const bytes = Utilities.base64Decode(decodeURIComponent(e.parameter.b64));
        body = JSON.parse(Utilities.newBlob(bytes).getDataAsString());
      } else if (e.parameter.body) {
        body = JSON.parse(decodeURIComponent(e.parameter.body));
      }
      if (body) return makeOutput(cb, handleAction(body));
    }
    return makeOutput(cb, { ok: true, data: loadProjects() });
  } catch(err) {
    return makeOutput(cb, { ok: false, error: err.message });
  }
}

function doPost(e) {
  const cb = (e.parameter && e.parameter.callback) || '';
  try {
    const body = JSON.parse(e.postData.contents);
    return makeOutput(cb, handleAction(body));
  } catch(err) {
    return makeOutput(cb, { ok: false, error: err.message });
  }
}

// ── Load projects ─────────────────────────────────────
function loadProjects() {
  const s = getSheet();
  const rows = s.getDataRange().getValues();
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    obj.id  = Number(obj.id)  || 0;
    obj.pct = Number(obj.pct) || 0;
    if (obj.timeline && typeof obj.timeline === 'string' && obj.timeline.trim()) {
      try { obj.timeline = JSON.parse(obj.timeline); } catch(e) { obj.timeline = {}; }
    } else if (!obj.timeline || typeof obj.timeline !== 'object') {
      obj.timeline = {};
    }
    // Parse links column
    if (obj.links && typeof obj.links === 'string' && obj.links.trim()) {
      try { obj.links = JSON.parse(obj.links); } catch(e) { obj.links = []; }
    } else if (!Array.isArray(obj.links)) {
      obj.links = [];
    }
    // Backward compat: nếu notes vẫn còn @@LINKS@@ thì migrate sang cột links
    if (obj.notes && obj.notes.includes('@@LINKS@@')) {
      const parts = obj.notes.split('@@LINKS@@');
      obj.notes = parts[0];
      if (!obj.links.length) {
        try { obj.links = JSON.parse(parts[1]); } catch(e) {}
      }
    }
    return obj;
  }).filter(p => p.id > 0);
}

// ── Actions ───────────────────────────────────────────
function handleAction(body) {
  if (body.action === 'update')          return actionUpdate(body.project);
  if (body.action === 'add')             return actionAdd(body.project);
  if (body.action === 'delete')          return actionDelete(body.id);
  if (body.action === 'update_timeline') return actionUpdateTimeline(body.timeline);
  return { ok: false, error: 'Unknown action: ' + body.action };
}

function getRowIdx(sheet, id) {
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (Number(rows[i][0]) === Number(id)) return i + 1;
  }
  return -1;
}

function getColIdx(sheet, colName) {
  const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  const idx = headers.indexOf(colName);
  return idx >= 0 ? idx + 1 : -1;
}

// Đảm bảo sheet có đủ cột, tự thêm nếu thiếu
function ensureCols(sheet) {
  const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  const needed = ['links','timeline','updated_at'];
  needed.forEach(col => {
    if (!headers.includes(col)) {
      const newCol = sheet.getLastColumn() + 1;
      sheet.getRange(1, newCol).setValue(col)
        .setBackground('#1e2d3d').setFontColor('#fff').setFontWeight('bold');
      if (col === 'links') sheet.setColumnWidth(newCol, 300);
    }
  });
}

function actionUpdate(p) {
  const s = getSheet();
  const idx = getRowIdx(s, p.id);
  if (idx === -1) return { ok: false, error: 'Not found: ' + p.id };
  const headers = s.getRange(1,1,1,s.getLastColumn()).getValues()[0];
  ['name','group','status','deadline','pct','risk','owner','notes','links'].forEach(f => {
    const col = headers.indexOf(f) + 1;
    if (col > 0) {
      let val = p[f] !== undefined ? p[f] : '';
      if (f === 'links') {
        val = Array.isArray(p[f]) && p[f].length ? JSON.stringify(p[f]) : '';
      } else if (f === 'deadline') {
        // Normalize deadline: chuyển ISO datetime → dd/mm/yyyy để hiển thị đẹp trong sheet
        val = fmtDeadline(p[f]);
      }
      s.getRange(idx, col).setValue(val);
    }
  });
  const utCol = headers.indexOf('updated_at') + 1;
  if (utCol > 0) s.getRange(idx, utCol).setValue(new Date().toISOString());
  colorRow(s, idx, p.risk);

  // Cập nhật lại Timeline View nếu dự án có timeline
  const tlColU = getColIdx(s, 'timeline');
  if (tlColU > 0) {
    const tlVal = s.getRange(idx, tlColU).getValue();
    if (tlVal) {
      try {
        const tlData = JSON.parse(tlVal);
        const nameColU = getColIdx(s, 'name');
        const projNameU = nameColU > 0 ? s.getRange(idx, nameColU).getValue() : '';
        tlData.projStatus = p.status || '';
        tlData.projPct    = Number(p.pct) || 0;
        updateTlView(Number(p.id), projNameU, tlData);
      } catch(e) {}
    }
  }
  return { ok: true };
}

function actionAdd(p) {
  const s = getSheet();
  const last = s.getLastRow();
  const ids = last > 1
    ? s.getRange(2,1,last-1,1).getValues().flat().map(Number).filter(Boolean) : [];
  p.id = ids.length ? Math.max(...ids) + 1 : 1;
  const row = HEADERS.map(h => {
    if (h === 'id')         return p.id;
    if (h === 'updated_at') return new Date().toISOString();
    if (h === 'timeline')   return '';
    if (h === 'links')      return Array.isArray(p.links) && p.links.length ? JSON.stringify(p.links) : '';
    if (h === 'pct')        return Number(p[h]) || 0;
    return p[h] || '';
  });
  s.getRange(last+1, 1, 1, row.length).setValues([row]);
  colorRow(s, last+1, p.risk);
  return { ok: true, id: p.id };
}

function actionDelete(id) {
  const s = getSheet();
  const idx = getRowIdx(s, id);
  if (idx > 0) s.deleteRow(idx);
  // Xóa khỏi Timeline View
  const tv = getTlViewSheet();
  const tvRows = tv.getDataRange().getValues();
  for (let i = 1; i < tvRows.length; i++) {
    if (String(tvRows[i][0]).startsWith('['+id+']')) {
      tv.deleteRow(i + 1); break;
    }
  }
  return { ok: true };
}

function actionUpdateTimeline(tl) {
  const s   = getSheet();
  const pid = Number(tl.project_id);
  if (!pid) return { ok: false, error: 'Invalid project_id' };

  // 1. Lưu JSON vào cột timeline của Projects sheet
  const idx = getRowIdx(s, pid);
  if (idx === -1) return { ok: false, error: 'Project not found: ' + pid };

  const tlCol = getColIdx(s, 'timeline');
  if (tlCol === -1) return { ok: false, error: 'Column timeline not found' };

  const tlData = { start: tl.start||'', end: tl.end||'', milestones: tl.milestones||[] };
  s.getRange(idx, tlCol).setValue(JSON.stringify(tlData));

  const utCol = getColIdx(s, 'updated_at');
  if (utCol > 0) s.getRange(idx, utCol).setValue(new Date().toISOString());

  // 2. Lấy tên project
  const nameCol = getColIdx(s, 'name');
  const projName = nameCol > 0 ? s.getRange(idx, nameCol).getValue() : 'Unknown';

  // 3. Cập nhật Timeline View sheet (đẹp, dễ đọc)
  // Lấy status và pct của project để tính trạng thái timeline
  const statusCol = getColIdx(s, 'status');
  const pctCol    = getColIdx(s, 'pct');
  tlData.projStatus = statusCol > 0 ? s.getRange(idx, statusCol).getValue() : '';
  tlData.projPct    = pctCol    > 0 ? s.getRange(idx, pctCol).getValue()    : 0;
  updateTlView(pid, projName, tlData);

  colorRow(s, idx, s.getRange(idx, getColIdx(s,'risk')).getValue());
  return { ok: true, saved: { project_id: pid, col: tlCol, row: idx } };
}

function updateTlView(pid, projName, tl) {
  const tv = getTlViewSheet();

  // Tính số ngày
  let dayCount = '';
  if (tl.start && tl.end) {
    const diff = (new Date(tl.end) - new Date(tl.start)) / 86400000;
    dayCount = Math.round(diff) + ' ngày';
  }

  // Trạng thái timeline — kết hợp ngày + pct + status dự án
  let tlStatus = '⏳ Chưa bắt đầu';
  const today = new Date();
  const projStatus = (tl.projStatus || '').toLowerCase().trim();
  const projPct    = Number(tl.projPct) || 0;
  // isDone: 100% hoặc status là Done/done/DONE/hoàn thành
  const isDone = projPct >= 100 || projStatus === 'done' || projStatus === 'hoàn thành';

  if (isDone) {
    tlStatus = '✅ Hoàn thành';
  } else if (tl.start && tl.end) {
    const s = new Date(tl.start), e = new Date(tl.end);
    if (today < s)      tlStatus = '🔜 Sắp bắt đầu';
    else if (today > e) tlStatus = '⚠️ Quá hạn';
    else                tlStatus = '🔵 Đang thực hiện';
  }

  // Format ngày
  function fmt(d) {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('vi-VN'); } catch(e) { return d; }
  }

  // Build row: [Dự án, Bắt đầu, Kết thúc, Số ngày, Trạng thái, MS1, Date1, MS2, Date2...]
  const row = [
    '['+pid+'] '+projName,
    fmt(tl.start),
    fmt(tl.end),
    dayCount,
    tlStatus
  ];

  // Thêm milestones (tối đa 5)
  const ms = (tl.milestones || []).slice(0, 5);
  for (let i = 0; i < 5; i++) {
    row.push(ms[i] ? ms[i].label : '');
    row.push(ms[i] ? fmt(ms[i].date) : '');
  }

  // Tìm hàng hiện có hoặc thêm mới
  const rows = tv.getDataRange().getValues();
  let rowIdx = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).startsWith('['+pid+']')) { rowIdx = i + 1; break; }
  }

  if (rowIdx === -1) {
    rowIdx = tv.getLastRow() + 1;
  }

  tv.getRange(rowIdx, 1, 1, row.length).setValues([row]);

  // Format màu theo trạng thái
  const bgColors = {
    '🔵 Đang thực hiện': '#e8f4fd',
    '✅ Đã kết thúc':    '#e8f5e9',
    '🔜 Sắp bắt đầu':   '#fff8e1',
    '⏳ Chưa bắt đầu':  '#f5f5f5',
  };
  const bg = bgColors[tlStatus] || '#ffffff';
  tv.getRange(rowIdx, 1, 1, row.length).setBackground(bg);

  // In đậm tên dự án
  tv.getRange(rowIdx, 1).setFontWeight('bold');

  // Format ngày milestone màu đỏ nếu đã qua
  const ms_arr = tl.milestones || [];
  ms_arr.slice(0,5).forEach((m, i) => {
    const dateCol = 7 + i * 2; // cột ngày MS: 7,9,11,13,15
    const cell = tv.getRange(rowIdx, dateCol);
    if (m.date && new Date(m.date) < today) {
      cell.setFontColor('#c0392b'); // đỏ = đã qua
    } else {
      cell.setFontColor('#27ae60'); // xanh = chưa tới
    }
  });

  // Sort theo tên dự án
  if (tv.getLastRow() > 2) {
    tv.getRange(2, 1, tv.getLastRow()-1, row.length).sort(1);
  }
}

function fmtDeadline(d) {
  if (!d || d === 'TBD' || d === 'ASAP') return d || '';
  try {
    // Nếu đã dạng dd/mm/yyyy thì giữ nguyên
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) return d;
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    const day   = String(dt.getDate()).padStart(2,'0');
    const month = String(dt.getMonth()+1).padStart(2,'0');
    const year  = dt.getFullYear();
    return day+'/'+month+'/'+year;
  } catch(e) { return d; }
}

function colorRow(sheet, rowIdx, risk) {
  const colors = { critical:'#fce4e4', high:'#fff3e0', mid:'#fffde7', low:'#e8f5e9' };
  const last = Math.max(sheet.getLastColumn(), HEADERS.length);
  sheet.getRange(rowIdx,1,1,last).setBackground(colors[risk]||'#ffffff');
}

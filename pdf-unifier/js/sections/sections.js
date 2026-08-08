// ─────────────────────────────────────────────────────────────
//  MÓDULO DE SECCIONES
//  Gestiona secciones tanto en el lienzo (agrupan páginas)
//  como en la biblioteca (agrupan ítems de biblioteca).
// ─────────────────────────────────────────────────────────────

// ── Helpers ──────────────────────────────────────────────────

function getNextCanvasSectionName(){
  let n = sections.length + 1;
  let base = 'Sección ' + n;
  while (sections.some(s => s.name === base)){ n++; base = 'Sección ' + n; }
  return base;
}

function getNextLibSectionName(){
  let n = librarySections.length + 1;
  let base = 'Sección ' + n;
  while (librarySections.some(s => s.name === base)){ n++; base = 'Sección ' + n; }
  return base;
}

function getSectionOfPage(pageId){
  return sections.find(s => s.pageIds.includes(pageId)) || null;
}

function getLibSectionOfItem(libId){
  return librarySections.find(s => s.libIds.includes(libId)) || null;
}

// ── Selección de secciones de biblioteca ─────────────────────

function toggleLibSectionSelect(secId){
  if (selectedLibSectionIds.has(secId)) selectedLibSectionIds.delete(secId);
  else selectedLibSectionIds.add(secId);
  updateLibSectionSelectionUI();
}

function updateLibSectionSelectionUI(){
  document.querySelectorAll('#libraryList .libSection').forEach(el=>{
    el.classList.toggle('selected', selectedLibSectionIds.has(el.dataset.libSectionId));
    const dot = el.querySelector('.libSelectDot');
    if (dot) dot.classList.toggle('checked', selectedLibSectionIds.has(el.dataset.libSectionId));
  });
}

// ── Conversión de ítems/secciones de biblioteca a páginas del lienzo ──

function buildPagesFromLibItem(item){
  const result = [];
  if (!item) return result;
  if (item.status !== 'ready') return result;

  if (item.kind === 'file'){
    if (item.type === 'pdf'){
      const src = sources[item.sourceId];
      if (src && src.pageThumbs){
        src.pageThumbs.forEach((pt, i)=>{
          result.push({
            id: 'p' + (idCounter++),
            sourceId: item.sourceId,
            type: 'pdf',
            pageIndex: i,
            thumb: pt.thumb,
            label: item.name,
            w: pt.w, h: pt.h
          });
        });
      }
    } else {
      const src = sources[item.sourceId];
      result.push({
        id: 'p' + (idCounter++),
        sourceId: item.sourceId,
        type: 'image',
        thumb: src.dataUrl,
        label: item.name,
        w: src.w, h: src.h
      });
    }
  } else {
    result.push({
      id: 'p' + (idCounter++),
      sourceId: item.sourceId,
      type: item.type,
      pageIndex: item.pageIndex,
      thumb: item.thumb,
      label: item.name,
      w: item.w, h: item.h
    });
  }
  return result;
}

// Convierte los ítems de una sección de biblioteca en páginas del lienzo
function buildPagesFromLibSection(sec){
  const result = [];
  if (!sec) return result;
  sec.libIds.forEach(libId=>{
    const item = libraryItemsMap[libId];
    if (!item) return;
    result.push(...buildPagesFromLibItem(item));
  });
  return result;
}

// ── Crear sección en el lienzo ───────────────────────────────

function createCanvasSection(pageIds){
  const before = snapshotState();
  const ids = Array.isArray(pageIds) ? pageIds.filter(id => pages.some(p => p.id === id)) : [];
  if (!ids.length) return;

  const sec = {
    id: 'sec' + (sectionCounter++),
    name: getNextCanvasSectionName(),
    pageIds: ids
  };
  sections.push(sec);
  renderPageList();
  showToast('Sección creada en el lienzo.');
  commitAction('Crear sección en el lienzo', before);
}

// Opción contextual: agrupar las páginas seleccionadas del lienzo
document.addEventListener('click', e=>{
  const btn = e.target.closest('#createCanvasSectionBtn');
  if (!btn) return;
  if (!selectedIds.size){
    showToast('Selecciona varias páginas del lienzo para crear una sección.');
    return;
  }
  createCanvasSection(Array.from(selectedIds));
  selectedIds.clear();
  updateSelectionUI();
});

// ── Crear sección en la biblioteca ─────────────────────────────

function createLibrarySection(libIds){
  const before = snapshotState();
  const ids = Array.isArray(libIds)
    ? libIds.filter(id => libraryItemsMap[id] && libraryItemsMap[id].status === 'ready')
    : [];
  if (!ids.length) return;

  // Quitar los ítems de secciones existentes para no duplicar
  librarySections.forEach(s => {
    s.libIds = s.libIds.filter(id => !ids.includes(id));
  });

  const sec = {
    id: 'libsec' + (libSectionCounter++),
    name: getNextLibSectionName(),
    libIds: ids
  };
  librarySections.push(sec);
  renderLibrary();
  showToast('Sección creada en la biblioteca.');
  commitAction('Crear sección en la biblioteca', before);
}

document.addEventListener('click', e=>{
  const btn = e.target.closest('#createLibrarySectionBtn');
  if (!btn) return;
  if (!selectedLibIds.size){
    showToast('Selecciona varios elementos de la biblioteca para crear una sección.');
    return;
  }
  createLibrarySection(Array.from(selectedLibIds));
  selectedLibIds.clear();
  updateLibSelectionUI();
});

// ── Renombrar sección (doble clic en la etiqueta) ─────────────

function startSectionRename(scope, sectionId, nameEl){
  const name = scope === 'canvas'
    ? sections.find(s => s.id === sectionId)?.name
    : librarySections.find(s => s.id === sectionId)?.name;
  if (name === undefined) return;

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'sectionNameInput';
  input.value = name;
  nameEl.replaceWith(input);
  input.focus();
  input.select();

  function commit(){
    const v = input.value.trim();
    if (!v || v === name){
      if (scope === 'canvas') renderPageList();
      else renderLibrary();
      return;
    }
    const before = snapshotState();
    if (scope === 'canvas'){
      const sec = sections.find(s => s.id === sectionId);
      if (sec) sec.name = v || sec.name;
      renderPageList();
      commitAction('Renombrar sección del lienzo', before);
    } else {
      const sec = librarySections.find(s => s.id === sectionId);
      if (sec) sec.name = v || sec.name;
      renderLibrary();
      commitAction('Renombrar sección de la biblioteca', before);
    }
  }
  input.addEventListener('blur', commit);
  input.addEventListener('keydown', e=>{
    if (e.key === 'Enter') input.blur();
    if (e.key === 'Escape'){ input.value = name; input.blur(); }
  });
}

// ── Eliminar sección ──────────────────────────────────────────

async function deleteCanvasSection(sectionId){
  const sec = sections.find(s => s.id === sectionId);
  if (!sec) return false;
  const ok = await confirmDialog('¿Mover la sección "' + sec.name + '" (' + sec.pageIds.length + ' página(s)) a la papelera?');
  if (!ok) return false;
  const before = snapshotState();
  sections = sections.filter(s => s.id !== sectionId);
  renderPageList();
  showToast('Sección enviada a la papelera.');
  commitAction('Eliminar sección del lienzo', before);
  return true;
}

async function deleteLibrarySection(sectionId){
  const sec = librarySections.find(s => s.id === sectionId);
  if (!sec) return false;
  const ok = await confirmDialog('¿Mover la sección "' + sec.name + '" (' + sec.libIds.length + ' elemento(s)) a la papelera?');
  if (!ok) return false;
  const before = snapshotState();
  librarySections = librarySections.filter(s => s.id !== sectionId);
  renderLibrary();
  showToast('Sección enviada a la papelera.');
  commitAction('Eliminar sección de la biblioteca', before);
  return true;
}

// ── Exportar sección como PDF independiente ──────────────────

document.addEventListener('click', async e=>{
  const btn = e.target.closest('.sectionExportBtn');
  if (!btn) return;
  const sectionId = btn.dataset.sectionId;
  const sec = sections.find(s => s.id === sectionId);
  if (!sec || !sec.pageIds.length) return;

  const originalLabel = exportBtn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>';
  try{
    const { PDFDocument } = PDFLib;
    const finalDoc = await PDFDocument.create();
    const pdfLibCache = {};
    const secPages = pages.filter(p => sec.pageIds.includes(p.id));

    for (const p of secPages){
      if (p.type === 'pdf'){
        let srcDoc = pdfLibCache[p.sourceId];
        if (!srcDoc){
          srcDoc = await PDFDocument.load(sources[p.sourceId].bytes.slice(0));
          pdfLibCache[p.sourceId] = srcDoc;
        }
        const [copied] = await finalDoc.copyPages(srcDoc, [p.pageIndex]);
        finalDoc.addPage(copied);
      } else {
        const src = sources[p.sourceId];
        const base64 = src.dataUrl.split(',')[1];
        const bytes = Uint8Array.from(atob(base64), c=>c.charCodeAt(0));
        let embedded;
        if (src.mime === 'image/png') embedded = await finalDoc.embedPng(bytes);
        else embedded = await finalDoc.embedJpg(bytes);

        const PX_TO_PT = 72/96;
        let w = p.w * PX_TO_PT;
        let h = p.h * PX_TO_PT;
        const maxDim = 1000;
        if (Math.max(w,h) > maxDim){
          const s = maxDim / Math.max(w,h);
          w *= s; h *= s;
        }
        const page = finalDoc.addPage([w, h]);
        page.drawImage(embedded, { x:0, y:0, width:w, height:h });
      }
    }

    const outBytes = await finalDoc.save();
    const blob = new Blob([outBytes], { type:'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (sec.name.replace(/\s+/g,'_') || 'seccion') + '.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 4000);
    showToast('Sección exportada como PDF.');
  }catch(err){
    console.error(err);
    showToast('Error al exportar la sección: ' + err.message);
}finally{
    btn.disabled = false;
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>';
  }
});

// ── Divisor de sección en el lienzo ──────────────────────────

function makeSectionDivider(sec, pageCount){
  const div = document.createElement('div');
  div.className = 'sectionDivider';
  div.draggable = true;
  div.dataset.sectionId = sec.id;

const label = document.createElement('div');
  label.className = 'secLabel';
  label.textContent = sec.name;
  label.title = 'Doble clic para renombrar';
  label.addEventListener('dblclick', e=>{
    e.stopPropagation();
    startSectionRename('canvas', sec.id, label);
  });

  const count = document.createElement('div');
  count.className = 'secCount';
  count.textContent = pageCount + (pageCount === 1 ? ' página' : ' páginas');

  const actions = document.createElement('div');
  actions.className = 'secActions';

  const collapseBtn = document.createElement('button');
  collapseBtn.className = 'secActionBtn secCollapseBtn';
  collapseBtn.title = 'Colapsar / expandir';
  collapseBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
  collapseBtn.addEventListener('click', e=>{
    e.stopPropagation();
    const card = div.closest('.canvasSectionCard');
    if (card){
      card.classList.toggle('collapsed');
      collapseBtn.innerHTML = card.classList.contains('collapsed')
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
    }
  });
  actions.appendChild(collapseBtn);

  const exportBtnSec = document.createElement('button');
  exportBtnSec.className = 'secActionBtn sectionExportBtn';
  exportBtnSec.dataset.sectionId = sec.id;
  exportBtnSec.title = 'Descargar sección como PDF';
  exportBtnSec.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>';
  actions.appendChild(exportBtnSec);

  const delBtn = document.createElement('button');
  delBtn.className = 'secActionBtn secDelBtn';
  delBtn.title = 'Eliminar sección';
  delBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>';
  delBtn.addEventListener('click', e=>{
    e.stopPropagation();
    deleteCanvasSection(sec.id);
  });
  actions.appendChild(delBtn);

// Línea divisoria elástica entre el conteo y las acciones
  const line = document.createElement('div');
  line.className = 'secLine';
  div.appendChild(label);
  div.appendChild(count);
  div.appendChild(line);
  div.appendChild(actions);

  div.addEventListener('dragstart', e=>{
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', sec.id);
    setTransparentDragImage(e);
    currentDrag = { origin: 'canvas-section', sectionId: sec.id };
    requestAnimationFrame(()=>div.classList.add('dragging'));
  });
  div.addEventListener('dragend', ()=>{
    div.classList.remove('dragging');
    currentDrag = null;
    closeAllGaps();
  });

  return div;
}

// Crea el card de sección en el lienzo (header + páginas)
// Ahora renderiza gaps de inserción entre las páginas de la sección
// para permitir reordenarlas dentro de la propia sección.
function makeCanvasSectionCard(sec){
  const card = document.createElement('div');
  card.className = 'canvasSectionCard';
  card.dataset.sectionId = sec.id;

  const header = makeSectionDivider(sec, sec.pageIds.length);
  card.appendChild(header);

  const body = document.createElement('div');
  body.className = 'canvasSectionBody';

  sec.pageIds.forEach((pId, secIdx)=>{
    const p = pages.find(x=>x.id === pId);
    if (p){
      // Gap de inserción ANTES de esta página (posición = secIdx dentro de la sección)
      const gap = makeGap(secIdx);
      gap.dataset.sectionId = sec.id;
      gap.dataset.sectionPos = secIdx;
      body.appendChild(gap);

      const idx = pages.findIndex(x=>x.id === pId);
      body.appendChild(makeCard(p, idx));
    }
  });

  // Gap final al final de la sección (posición = cantidad de páginas)
  const endGap = makeGap(sec.pageIds.length);
  endGap.dataset.sectionId = sec.id;
  endGap.dataset.sectionPos = sec.pageIds.length;
  body.appendChild(endGap);

  card.appendChild(body);

  return card;
}

// ── Render de secciones de biblioteca ────────────────────────

function renderLibrarySectionBlock(sec){
  const wrap = document.createElement('div');
  wrap.className = 'libSection';
  wrap.dataset.libSectionId = sec.id;

  const header = document.createElement('div');
  header.className = 'libSectionHeader';
  header.draggable = true;

  const selectDot = document.createElement('div');
  selectDot.className = 'libSelectDot';
  selectDot.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
  selectDot.addEventListener('mousedown', e=>e.stopPropagation());
  selectDot.addEventListener('click', e=>{ e.stopPropagation(); toggleLibSectionSelect(sec.id); });
  header.appendChild(selectDot);

  const headerInfo = document.createElement('div');
  headerInfo.className = 'libSecInfo';

  const label = document.createElement('div');
  label.className = 'secLabel';
  label.textContent = sec.name;
  label.title = 'Doble clic para renombrar';
  label.addEventListener('dblclick', e=>{
    e.stopPropagation();
    startSectionRename('library', sec.id, label);
  });

  const count = document.createElement('div');
  count.className = 'secCount';
  count.textContent = sec.libIds.length + (sec.libIds.length === 1 ? ' elemento' : ' elementos');

  headerInfo.appendChild(label);
  headerInfo.appendChild(count);

  const actions = document.createElement('div');
  actions.className = 'secActions';

  const collapseBtn = document.createElement('button');
  collapseBtn.className = 'secActionBtn secCollapseBtn';
  collapseBtn.title = 'Colapsar / expandir';
  collapseBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
  collapseBtn.addEventListener('click', e=>{
    e.stopPropagation();
    wrap.classList.toggle('collapsed');
    collapseBtn.innerHTML = wrap.classList.contains('collapsed')
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
  });
  actions.appendChild(collapseBtn);

  const delBtn = document.createElement('button');
  delBtn.className = 'secActionBtn secDelBtn';
  delBtn.title = 'Eliminar sección';
  delBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>';
  delBtn.addEventListener('click', e=>{
    e.stopPropagation();
    deleteLibrarySection(sec.id);
  });
  actions.appendChild(delBtn);

  header.appendChild(headerInfo);
  header.appendChild(actions);

  header.addEventListener('click', e=>{
    if (e.target.closest('.libSelectDot') || e.target.closest('.secActionBtn')) return;
    if (selectedLibSectionIds.size > 0) toggleLibSectionSelect(sec.id);
  });

header.addEventListener('dragstart', e=>{
    console.log('[SECTIONS] header dragstart', sec.id, sec.name);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', sec.id);
    setTransparentDragImage(e);
    if (selectedLibSectionIds.has(sec.id) && selectedLibSectionIds.size > 1){
      currentDrag = { origin:'library-section-multi', libSectionIds: Array.from(selectedLibSectionIds) };
    } else {
      if (selectedLibSectionIds.size && !selectedLibSectionIds.has(sec.id)){
        selectedLibSectionIds.clear();
        updateLibSectionSelectionUI();
      }
      currentDrag = { origin:'library-section', libSectionId: sec.id };
    }
    console.log('[SECTIONS] currentDrag', JSON.stringify(currentDrag));
    requestAnimationFrame(()=>header.classList.add('dragging'));
  });
  header.addEventListener('dragend', ()=>{
    header.classList.remove('dragging');
    currentDrag = null;
    closeAllGaps();
    canvasArea.classList.remove('dropready');
  });

  wrap.appendChild(header);

  // Contenedor de los ítems de la sección
  const body = document.createElement('div');
  body.className = 'libSectionBody';
  sec.libIds.forEach(libId=>{
    const item = libraryItemsMap[libId];
    if (!item) return;
    const el = makeLibraryItemElement(libId, item);
    if (el) body.appendChild(el);
  });
  wrap.appendChild(body);

  updateLibSectionSelectionUI();
  return wrap;
}

// Crea el elemento DOM de un ítem de biblioteca (reutilizado por renderLibrary)
function makeLibraryItemElement(libId, item){
  const isLoading = item.status === 'loading';
  const isError = item.status === 'error';

  const el = document.createElement('div');
  el.className = 'libItem' + (isLoading ? ' loading' : '');
  el.draggable = !isLoading && !isError;
  el.dataset.libId = libId;

  const thumbWrap = document.createElement('div');
  thumbWrap.className = 'libThumbWrap';
  if (isLoading){
    thumbWrap.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M13 3v6h6"/></svg>';
  } else {
    if (item.kind === 'file' && item.type === 'pdf' && item.pageCount > 1){
      const s1 = document.createElement('div'); s1.className='stack s1';
      const s2 = document.createElement('div'); s2.className='stack s2';
      thumbWrap.appendChild(s1); thumbWrap.appendChild(s2);
    }
    const img = document.createElement('img');
    img.src = item.thumb;
    img.addEventListener('click', e=>{ e.stopPropagation(); openLightbox([item.thumb], 0); });
    thumbWrap.appendChild(img);
  }

  if (!isLoading && !isError){
    const selectDot = document.createElement('div');
    selectDot.className = 'libSelectDot';
    selectDot.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
    selectDot.addEventListener('mousedown', e=>e.stopPropagation());
    selectDot.addEventListener('click', e=>{ e.stopPropagation(); toggleLibSelect(libId); });
    el.appendChild(selectDot);
  }

  const info = document.createElement('div');
  info.className = 'libInfo';

  const name = document.createElement('div');
  name.className = 'name';
  name.textContent = item.name;
  name.title = 'Doble clic para renombrar';
  if (!isLoading && !isError){
    name.addEventListener('dblclick', e=>{
      e.stopPropagation();
      startRename(item, name);
    });
  }
  info.appendChild(name);

  if (isLoading){
    const row = document.createElement('div');
    row.className = 'progressRow';
    const track = document.createElement('div'); track.className = 'progressTrack';
    const fill = document.createElement('div'); fill.className = 'progressFill';
    fill.style.width = (item.progress || 0) + '%';
    track.appendChild(fill);
    const pct = document.createElement('div'); pct.className = 'progressPct';
    pct.textContent = Math.round(item.progress || 0) + '%';
    row.appendChild(track); row.appendChild(pct);
    info.appendChild(row);
  } else if (isError){
    const meta = document.createElement('div');
    meta.className = 'meta'; meta.style.color = 'var(--danger)';
    meta.textContent = 'Error al procesar';
    info.appendChild(meta);
  } else {
    const row = document.createElement('div');
    row.className = 'metaRow';
    const meta = document.createElement('div');
    meta.className = 'meta';
    if (item.kind === 'file'){
      meta.textContent = item.type === 'pdf'
        ? (item.pageCount + (item.pageCount===1?' página':' páginas'))
        : 'Imagen';
    } else {
      meta.textContent = item.type === 'pdf' ? 'Página suelta' : 'Imagen';
    }
    row.appendChild(meta);
    if (item.kind === 'page'){
      const tag = document.createElement('span');
      tag.className = 'kindTag';
      tag.textContent = 'del lienzo';
      row.appendChild(tag);
    }
    info.appendChild(row);
  }

  const del = document.createElement('button');
  del.className = 'libDel';
  del.title = 'Eliminar';
  del.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>';
  del.addEventListener('click', e=>{
    e.stopPropagation();
    trashLibraryItem(libId);
  });

  el.appendChild(thumbWrap);
  el.appendChild(info);
  el.appendChild(del);

  if (!isLoading && !isError){
    el.addEventListener('click', e=>{
      if (e.target.closest('.libSelectDot') || e.target.closest('.libDel')) return;
      if (selectedLibIds.size > 0) toggleLibSelect(libId);
    });
    el.addEventListener('dragstart', e=>{
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData('text/plain', libId);
      setTransparentDragImage(e);
      if (selectedLibIds.has(libId) && selectedLibIds.size > 1){
        currentDrag = { origin:'library-multi', libIds: Array.from(selectedLibIds) };
      } else {
        if (selectedLibIds.size && !selectedLibIds.has(libId)){
          selectedLibIds.clear();
          updateLibSelectionUI();
        }
        currentDrag = { origin:'library', libId };
      }
      requestAnimationFrame(()=>el.classList.add('dragging'));
    });
    el.addEventListener('dragend', ()=>{
      el.classList.remove('dragging');
      currentDrag = null;
      closeAllGaps();
      canvasArea.classList.remove('dropready');
    });
  }

  return el;
}

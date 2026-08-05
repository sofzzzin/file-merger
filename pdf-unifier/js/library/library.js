function renderLibrary(){
  libraryList.innerHTML = '';
  libraryEmpty.style.display = libraryOrder.length === 0 ? 'block' : 'none';
  updateLibSelectionUI();

  libraryOrder.forEach(libId=>{
    const item = libraryItemsMap[libId];
    if (!item) return;
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

    // Dot de selección (solo para ítems listos)
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
        // Clic sobre el cuerpo de la tarjeta: si hay selección activa, lo alterna
        if (e.target.closest('.libSelectDot') || e.target.closest('.libDel')) return;
        if (selectedLibIds.size > 0){
          toggleLibSelect(libId);
        }
      });
      el.addEventListener('dragstart', e=>{
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', libId);
        setTransparentDragImage(e);
        // Si hay selección múltiple y este ítem está seleccionado, arrastra todos
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

    libraryList.appendChild(el);
  });
}

function toggleLibSelect(libId){
  if (selectedLibIds.has(libId)) selectedLibIds.delete(libId);
  else selectedLibIds.add(libId);
  updateLibSelectionUI();
}

function updateLibSelectionUI(){
  const n = selectedLibIds.size;
  libSelectionBar.classList.toggle('show', n > 0);
  libSelCount.textContent = n + (n === 1 ? ' seleccionado' : ' seleccionados');
  document.querySelectorAll('#libraryList .libItem').forEach(el=>{
    el.classList.toggle('selected', selectedLibIds.has(el.dataset.libId));
  });
  // Filtra solo ítems listos (no loading/error)
  const selectable = libraryOrder.filter(libId=>{
    const it = libraryItemsMap[libId];
    return it && it.status === 'ready';
  });
  const allSelected = selectable.length > 0 && n === selectable.length;
  libSelectAllBtn.innerHTML = allSelected
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>Deseleccionar todo'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>Seleccionar todo';
}

function toggleSelectAllLib(){
  const selectable = libraryOrder.filter(libId=>{
    const it = libraryItemsMap[libId];
    return it && it.status === 'ready';
  });
  if (!selectable.length) return;
  if (selectedLibIds.size === selectable.length){
    selectedLibIds.clear();
  } else {
    selectedLibIds = new Set(selectable);
  }
  updateLibSelectionUI();
}

libSelectAllBtn.addEventListener('click', toggleSelectAllLib);
libCancelSelectionBtn.addEventListener('click', ()=>{ selectedLibIds.clear(); updateLibSelectionUI(); });
libDeleteSelectedBtn.addEventListener('click', async ()=>{
  const n = selectedLibIds.size;
  if (!n) return;
  const ok = await confirmDialog(
    '¿Seguro que quieres eliminar ' + n + (n===1 ? ' elemento' : ' elementos') +
    ' de la biblioteca? Podrás recuperarlo' + (n===1?'':'s') + ' desde la papelera de reciclaje.'
  );
  if (!ok) return;
  const idSet = new Set(selectedLibIds);
  const removed = libraryOrder.filter(id=>idSet.has(id));
  removed.forEach(libId=>{
    const item = libraryItemsMap[libId];
    if (!item) return;
    libraryOrder = libraryOrder.filter(id=>id!==libId);
    delete libraryItemsMap[libId];
    addToTrash('library-item', item);
  });
  selectedLibIds.clear();
  updateLibSelectionUI();
  renderLibrary();
  showToast(n === 1 ? 'Elemento movido a la papelera.' : n + ' elementos movidos a la papelera.');
});

function renderLibrary(){
  libraryList.innerHTML = '';
  libraryEmpty.style.display = libraryOrder.length === 0 ? 'block' : 'none';
  updateLibSelectionUI();

  // Ítems que pertenecen a alguna sección de biblioteca
  const sectioned = new Set();
  librarySections.forEach(sec=>{
    sec.libIds.forEach(id=>sectioned.add(id));
  });

  // Renderizar secciones de biblioteca
  librarySections.forEach(sec=>{
    const block = renderLibrarySectionBlock(sec);
    if (block) libraryList.appendChild(block);
  });

// Renderizar ítems sueltos (no pertenecientes a ninguna sección)
  const looseItems = libraryOrder.filter(libId=>{
    const it = libraryItemsMap[libId];
    return it && !sectioned.has(libId);
  });
  if (looseItems.length){
    if (librarySections.length){
      const header = document.createElement('div');
      header.className = 'libSectionFreeHeader';
      libraryList.appendChild(header);
    }
    looseItems.forEach(libId=>{
      const item = libraryItemsMap[libId];
      if (!item) return;
      const el = makeLibraryItemElement(libId, item);
      if (el) libraryList.appendChild(el);
    });
  }
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
  const before = snapshotState();
const idSet = new Set(selectedLibIds);
  const removed = libraryOrder.filter(id=>idSet.has(id));
  removed.forEach(libId=>{
    const item = libraryItemsMap[libId];
    if (!item) return;
    // Quitar de cualquier sección de biblioteca
    librarySections.forEach(sec=>{
      sec.libIds = sec.libIds.filter(id=>id!==libId);
    });
    libraryOrder = libraryOrder.filter(id=>id!==libId);
    delete libraryItemsMap[libId];
    addToTrash('library-item', item);
  });
  librarySections = librarySections.filter(sec=>sec.libIds.length > 0);
  selectedLibIds.clear();
  updateLibSelectionUI();
renderLibrary();
  showToast(n === 1 ? 'Elemento movido a la papelera.' : n + ' elementos movidos a la papelera.');
  commitAction('Eliminar elementos de la biblioteca', before);
});

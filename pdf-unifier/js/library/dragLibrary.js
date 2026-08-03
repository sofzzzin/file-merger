libraryPanel.addEventListener('dragover', e=>{
  const isOsFiles = e.dataTransfer.types && e.dataTransfer.types.includes('Files');
  const isCanvasDrag = currentDrag && (currentDrag.origin === 'canvas' || currentDrag.origin === 'canvas-multi');
  if (isOsFiles || isCanvasDrag){
    e.preventDefault();
    if (isCanvasDrag) e.dataTransfer.dropEffect = 'move';
    libraryPanel.classList.add('dragover');
  }
});
libraryPanel.addEventListener('dragleave', ()=>{ libraryPanel.classList.remove('dragover'); });
libraryPanel.addEventListener('drop', e=>{
  libraryPanel.classList.remove('dragover');
  if (e.dataTransfer.files && e.dataTransfer.files.length){
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
    return;
  }
  if (currentDrag && (currentDrag.origin === 'canvas' || currentDrag.origin === 'canvas-multi')){
    e.preventDefault();
    const ids = currentDrag.origin === 'canvas-multi' ? currentDrag.pageIds : [currentDrag.pageId];
    movePagesToLibrary(ids);
    currentDrag = null;
  }
});

function movePagesToLibrary(pageIds){
  const idSet = new Set(pageIds);
  const moving = pages.filter(p=>idSet.has(p.id));
  if (!moving.length) return;
  pages = pages.filter(p=>!idSet.has(p.id));
  moving.forEach(p=>{
    const libId = 'libpage' + (libPageCounter++);
    libraryItemsMap[libId] = {
      id: libId, kind:'page', sourceId: p.sourceId, pageIndex: p.pageIndex,
      type: p.type, name: p.label, thumb: p.thumb, w: p.w, h: p.h, status:'ready'
    };
    libraryOrder.push(libId);
  });
  selectedIds.clear();
  updateSelectionUI();
  renderLibrary();
  renderPageList();
  showToast(moving.length === 1 ? 'Página enviada a la biblioteca.' : moving.length + ' páginas enviadas a la biblioteca.');
}

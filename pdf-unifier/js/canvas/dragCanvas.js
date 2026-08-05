canvasArea.addEventListener('dragover', e=>{
  if (!currentDrag) return;
  e.preventDefault();
e.dataTransfer.dropEffect = (currentDrag.origin === 'library' || currentDrag.origin === 'library-multi') ? 'copy' : 'move';
  canvasArea.classList.add('dropready');

  if (pageList.classList.contains('grid-mode')){
    clearDropTargets();
    const nearest = findNearestCard(e);
    if (nearest) nearest.classList.add('dropTarget');
    return;
  }

  const gaps = Array.from(document.querySelectorAll('.gap'));
  if (!gaps.length) return;
  let closest = null, closestDist = Infinity;
  for (const g of gaps){
    const rect = g.getBoundingClientRect();
    const dist = Math.abs(e.clientY - rect.top);
    if (dist < closestDist){ closestDist = dist; closest = g; }
  }
  closeAllGaps();
  if (closest) closest.classList.add('open');
});

canvasArea.addEventListener('dragleave', e=>{
  if (e.target === canvasArea) canvasArea.classList.remove('dropready');
});

// En js/canvas/dragCanvas.js - dentro del evento drop de canvasArea
canvasArea.addEventListener('drop', e=>{
  e.preventDefault();
  canvasArea.classList.remove('dropready');
  if (!currentDrag) return;

  let targetIndex;
  if (pageList.classList.contains('grid-mode')){
    const hovered = document.querySelector('.pageCard.dropTarget');
    clearDropTargets();
    if (hovered){
      const hi = pages.findIndex(p=>p.id === hovered.dataset.id);
      targetIndex = hi === -1 ? pages.length : hi;
    } else {
      targetIndex = pages.length;
    }
  } else {
    const openGap = document.querySelector('.gap.open');
    targetIndex = openGap ? parseInt(openGap.dataset.index, 10) : pages.length;
    closeAllGaps();
  }

if (currentDrag.origin === 'library' || currentDrag.origin === 'library-multi'){
    const libIds = currentDrag.origin === 'library-multi'
      ? (Array.isArray(currentDrag.libIds) ? currentDrag.libIds : [currentDrag.libIds])
      : [currentDrag.libId];
    let newItems = [];
    libIds.forEach(libId=>{
      const item = libraryItemsMap[libId];
      if (!item) return;
      if (item.kind === 'file'){
        if (item.type === 'pdf'){
          const src = sources[item.sourceId];
          if (src && src.pageThumbs){
            src.pageThumbs.forEach((pt, i)=>{
              newItems.push({
                id: 'p' + (idCounter++),
                sourceId: item.sourceId,
                type:'pdf',
                pageIndex: i,
                thumb: pt.thumb,
                label: item.name,
                w: pt.w, h: pt.h
              });
            });
          }
        } else {
          const src = sources[item.sourceId];
          newItems.push({
            id: 'p' + (idCounter++),
            sourceId: item.sourceId,
            type:'image',
            thumb: src.dataUrl,
            label: item.name,
            w: src.w, h: src.h
          });
        }
      } else {
        newItems.push({
          id: 'p' + (idCounter++),
          sourceId: item.sourceId,
          type: item.type,
          pageIndex: item.pageIndex,
          thumb: item.thumb,
          label: item.name,
          w: item.w, h: item.h
        });
      }
    });
    pages.splice(targetIndex, 0, ...newItems);
    if (currentDrag.origin === 'library-multi'){
      selectedLibIds.clear();
      updateLibSelectionUI();
    }
} else if (currentDrag.origin === 'canvas'){
   const fromIndex = pages.findIndex(p=>p.id === currentDrag.pageId);
    if (fromIndex === -1) return;
    const [moved] = pages.splice(fromIndex, 1);
    let insertAt = targetIndex;
    if (fromIndex < targetIndex) insertAt -= 1;
    pages.splice(insertAt, 0, moved);
  } else if (currentDrag.origin === 'canvas-multi'){
    console.log('Procesando drop múltiple:', currentDrag.pageIds);
    const pageIds = Array.isArray(currentDrag.pageIds) ? currentDrag.pageIds : [currentDrag.pageIds];
    const idSet = new Set(pageIds);
    const existingPages = pages.filter(p => idSet.has(p.id));
    if (existingPages.length !== pageIds.length) {
      console.warn('Algunas páginas no existen:', pageIds.filter(id => !pages.some(p => p.id === id)));
      const validIds = existingPages.map(p => p.id);
      const validIdSet = new Set(validIds);
      
      if (validIds.length === 0) return;
      
      // Recalcular targetIndex
      let removedBefore = 0;
      pages.forEach((p, i) => { 
        if (validIdSet.has(p.id) && i < targetIndex) removedBefore++; 
      });
      
      const movedItems = pages.filter(p => validIdSet.has(p.id));
      const remaining = pages.filter(p => !validIdSet.has(p.id));
      const insertAt = targetIndex - removedBefore;
      
      remaining.splice(insertAt, 0, ...movedItems);
      pages = remaining;
    } else {
      // Todas las páginas existen
      let removedBefore = 0;
      pages.forEach((p, i) => { 
        if (idSet.has(p.id) && i < targetIndex) removedBefore++; 
      });
      const movedItems = pages.filter(p => idSet.has(p.id));
      const remaining = pages.filter(p => !idSet.has(p.id));
      const insertAt = targetIndex - removedBefore;
      remaining.splice(insertAt, 0, ...movedItems);
      pages = remaining;
    }
selectedIds.clear();
  } else if (currentDrag.origin === 'canvas-section'){
    // Arrastrar un divisor de sección: mueve todas sus páginas juntas
    const sec = sections.find(s=>s.id === currentDrag.sectionId);
    if (!sec) return;
    const secPageIds = new Set(sec.pageIds);
    const movedItems = pages.filter(p=>secPageIds.has(p.id));
    if (!movedItems.length) return;
    const remaining = pages.filter(p=>!secPageIds.has(p.id));
    remaining.splice(targetIndex, 0, ...movedItems);
    pages = remaining;
  }

  currentDrag = null;
  renderPageList();
});

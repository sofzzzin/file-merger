canvasArea.addEventListener('dragover', e=>{
  if (!currentDrag) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = currentDrag.origin === 'library' ? 'copy' : 'move';
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

  if (currentDrag.origin === 'library'){
    const item = libraryItemsMap[currentDrag.libId];
    if (!item) return;
    let newItems = [];
    if (item.kind === 'file'){
      if (item.type === 'pdf'){
        const src = sources[item.sourceId];
        newItems = src.pageThumbs.map((pt, i)=>(
          {
            id: 'p' + (idCounter++),
            sourceId: item.sourceId,
            type:'pdf',
            pageIndex: i,
            thumb: pt.thumb,
            label: item.name,
            w: pt.w, h: pt.h
          }
        ));
      } else {
        const src = sources[item.sourceId];
        newItems = [{
          id: 'p' + (idCounter++),
          sourceId: item.sourceId,
          type:'image',
          thumb: src.dataUrl,
          label: item.name,
          w: src.w, h: src.h
        }];
      }
    } else {
      newItems = [{
        id: 'p' + (idCounter++),
        sourceId: item.sourceId,
        type: item.type,
        pageIndex: item.pageIndex,
        thumb: item.thumb,
        label: item.name,
        w: item.w, h: item.h
      }];
    }
    pages.splice(targetIndex, 0, ...newItems);
  } else if (currentDrag.origin === 'canvas'){
    const fromIndex = pages.findIndex(p=>p.id === currentDrag.pageId);
    if (fromIndex === -1) return;
    const [moved] = pages.splice(fromIndex, 1);
    let insertAt = targetIndex;
    if (fromIndex < targetIndex) insertAt -= 1;
    pages.splice(insertAt, 0, moved);
  } else if (currentDrag.origin === 'canvas-multi'){
    const idSet = new Set(currentDrag.pageIds);
    let removedBefore = 0;
    pages.forEach((p, i)=>{ if (idSet.has(p.id) && i < targetIndex) removedBefore++; });
    const movedItems = pages.filter(p=>idSet.has(p.id));
    const remaining = pages.filter(p=>!idSet.has(p.id));
    const insertAt = targetIndex - removedBefore;
    remaining.splice(insertAt, 0, ...movedItems);
    pages = remaining;
    selectedIds.clear();
  }

  currentDrag = null;
  renderPageList();
});

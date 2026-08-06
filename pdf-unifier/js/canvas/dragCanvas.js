// Devuelve el card de sección del lienzo que contiene al cursor, o null
function getSectionCardAt(e){
  return Array.from(document.querySelectorAll('.canvasSectionCard')).find(c=>{
    const r = c.getBoundingClientRect();
    return e.clientX >= r.left && e.clientX <= r.right &&
           e.clientY >= r.top && e.clientY <= r.bottom;
  });
}

canvasArea.addEventListener('dragover', e=>{
if (!currentDrag) return;
  e.preventDefault();
  const copyOrigins = ['library','library-multi','library-section','library-section-multi'];
  e.dataTransfer.dropEffect = copyOrigins.includes(currentDrag.origin) ? 'copy' : 'move';
  canvasArea.classList.add('dropready');

// Limpiar indicadores de arrastre sobre cards de sección
  document.querySelectorAll('.canvasSectionCard').forEach(c=>c.classList.remove('drag-inside','drag-outside'));

  if (pageList.classList.contains('grid-mode')){
    clearDropTargets();
    const nearest = findNearestCard(e);
    if (nearest) nearest.classList.add('dropTarget');
    return;
  }

  // Indicador dentro del card de sección (para mover entre secciones)
  const card = getSectionCardAt(e);
  if (card){
    card.classList.add('drag-inside');
    // Si cae dentro de una sección, mostramos todas las demás como "fuera"
    document.querySelectorAll('.canvasSectionCard').forEach(c=>{
      if (c !== card) c.classList.add('drag-outside');
    });
  } else {
    document.querySelectorAll('.canvasSectionCard').forEach(c=>c.classList.add('drag-outside'));
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
canvasArea.addEventListener('drop', async e=>{
  e.preventDefault();
  canvasArea.classList.remove('dropready');
  if (!currentDrag) return;

  // ── Detectar suelta DENTRO de una sección del lienzo ──
  const sectionCardAt = getSectionCardAt(e);
  document.querySelectorAll('.canvasSectionCard').forEach(c=>c.classList.remove('drag-inside','drag-outside'));

  if (sectionCardAt){
    if (currentDrag.origin === 'canvas' || currentDrag.origin === 'canvas-multi'){
      // Mover página(s) del lienzo a otra sección
      let moveIds = currentDrag.origin === 'canvas-multi'
        ? (Array.isArray(currentDrag.pageIds) ? currentDrag.pageIds : [currentDrag.pageIds])
        : [currentDrag.pageId];
      const idSet = new Set(moveIds);
      const targetSec = sections.find(s=>s.id === sectionCardAt.dataset.sectionId);
      const srcSec = sections.find(s=> s.pageIds.some(id=>idSet.has(id)) && s.id !== (targetSec ? targetSec.id : null));
      if (targetSec){
        // Quitar de la sección origen (si era una sección distinta)
        if (srcSec){
          srcSec.pageIds = srcSec.pageIds.filter(id=>!idSet.has(id));
        }
        // Añadir al final de la sección objetivo
        moveIds.forEach(id=>{
          if (!targetSec.pageIds.includes(id)) targetSec.pageIds.push(id);
        });
        sections = sections.filter(sec=>sec.pageIds.length > 0);
        resequencePages();
        selectedIds.clear();
        updateSelectionUI();
        currentDrag = null;
        renderPageList();
        return;
      }
    }

    if (currentDrag.origin === 'canvas-section'){
      // Mover una sección entera a otra sección → preguntar antes
      const srcSec = sections.find(s=>s.id === currentDrag.sectionId);
      const targetSec = sections.find(s=>s.id === sectionCardAt.dataset.sectionId);
      if (srcSec && targetSec && srcSec.id !== targetSec.id){
        const ok = await confirmDialog('¿Mover la sección "' + srcSec.name + '" a la sección "' + targetSec.name + '"?');
        if (ok){
          // Fusionar: todos los ítems del origen pasan al destino
          srcSec.pageIds.forEach(id=>{
            if (!targetSec.pageIds.includes(id)) targetSec.pageIds.push(id);
          });
          sections = sections.filter(sec=>sec.id !== srcSec.id);
          resequencePages();
          showToast('Sección "' + srcSec.name + '" movida a "' + targetSec.name + '".');
        }
        currentDrag = null;
        renderPageList();
        return;
      }
    }
  }

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
} else if (currentDrag.origin === 'library-section' || currentDrag.origin === 'library-section-multi'){
    // Arrastrar una o varias secciones de biblioteca al lienzo
    const isMulti = currentDrag.origin === 'library-section-multi';
    const secIds = isMulti
      ? (Array.isArray(currentDrag.libSectionIds) ? currentDrag.libSectionIds : [currentDrag.libSectionIds])
      : [currentDrag.libSectionId];
    const secs = secIds.map(id => librarySections.find(s => s.id === id)).filter(Boolean);
    if (!secs.length) return;

    // Convertir todos los ítems de las secciones en páginas del lienzo
    let newPages = [];
    secs.forEach(sec=>{
      newPages = newPages.concat(buildPagesFromLibSection(sec));
    });

    // Preguntar al usuario si quiere conservar la(s) sección(es)
    const keep = await sectionKeepDialog(secs.length === 1 ? secs[0].name : 'las secciones seleccionadas');

    if (keep){
      // Agrupar todas las páginas en una nueva sección del lienzo
      const pageIds = newPages.map(p=>p.id);
      const sec = {
        id: 'sec' + (sectionCounter++),
        name: secs.length === 1 ? secs[0].name : getNextCanvasSectionName(),
        pageIds
      };
      sections.push(sec);
      armUndo('canvas', sec.id);
      pages.splice(targetIndex, 0, ...newPages);
      showToast('Sección creada en el lienzo. Puedes deshacerla con Ctrl+Z durante 20 segundos.');
    } else {
      // Solo insertar las páginas sueltas
      pages.splice(targetIndex, 0, ...newPages);
      showToast('Páginas agregadas al lienzo.');
    }

    if (isMulti){
      selectedLibSectionIds.clear();
      updateLibSectionSelectionUI();
    }
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

// Devuelve el card de sección del lienzo que contiene al cursor, o null
function getSectionCardAt(e){
  return Array.from(document.querySelectorAll('.canvasSectionCard')).find(c=>{
    const r = c.getBoundingClientRect();
    return e.clientX >= r.left && e.clientX <= r.right &&
           e.clientY >= r.top && e.clientY <= r.bottom;
  });
}

// Devuelve true si el puntero está sobre la mitad IZQUIERDA de la tarjeta dada
function isPointerLeftHalf(e, el){
  if (!el) return true;
  const r = el.getBoundingClientRect();
  return e.clientX < r.left + r.width / 2;
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
    document.querySelectorAll('.pageCard').forEach(c=>c.classList.remove('drop-left','drop-right'));
    // Detectar cards de sección también en modo grid
    const gcard = getSectionCardAt(e);
    const inSection = !!gcard;
    if (gcard){
      gcard.classList.add('drag-inside');
      document.querySelectorAll('.canvasSectionCard').forEach(c=>{
        if (c !== gcard) c.classList.add('drag-outside');
      });
    } else {
      document.querySelectorAll('.canvasSectionCard').forEach(c=>c.classList.add('drag-outside'));
    }

    // Solo mostrar el indicador lado (izquierda/derecha) en las cards correspondientes:
    // - si el puntero está DENTRO de una sección → indicar sobre las cards de ESA sección
    // - si el puntero está FUERA (lienzo suelto) → indicar sobre las cards sueltas (no de sección)
    const cards = Array.from(pageList.querySelectorAll('.pageCard')).filter(card=>{
      const inside = !!card.closest('.canvasSectionCard');
      return inSection ? inside : !inside;
    });
    let nearest = null, closestDist = Infinity;
    for (const c of cards){
      const r = c.getBoundingClientRect();
      const cx = r.left + r.width/2, cy = r.top + r.height/2;
      const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
      if (dist < closestDist){ closestDist = dist; nearest = c; }
    }
    if (nearest){
      nearest.classList.add('dropTarget');
      // Indicar si se inserta a la izquierda o derecha según la mitad del puntero
      nearest.classList.add(isPointerLeftHalf(e, nearest) ? 'drop-left' : 'drop-right');
    }
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
  const dropBefore = snapshotState();

  // ── Detectar suelta DENTRO de una sección del lienzo ──
  const sectionCardAt = getSectionCardAt(e);
  document.querySelectorAll('.canvasSectionCard').forEach(c=>c.classList.remove('drag-inside','drag-outside'));

// Contexto de soltado dentro de una sección (a partir del gap abierto del cuerpo de la sección)
  const openGap = document.querySelector('.gap.open');
  let sectionContext = null;
  if (openGap && openGap.dataset.sectionId){
    const tSec = sections.find(s=>s.id === openGap.dataset.sectionId);
    if (tSec) sectionContext = { sec: tSec, pos: parseInt(openGap.dataset.sectionPos, 10) };
  }

  // En modo grid los gaps están ocultos: derivar el contexto según la posición del cursor.
  // Si el puntero está dentro de un card de sección → se suelta dentro de esa sección.
  // Si NO está dentro de ninguna sección → se suelta como página suelta del lienzo.
if (!sectionContext && pageList.classList.contains('grid-mode')){
    const sCard = getSectionCardAt(e);
    if (sCard){
      const tSec = sections.find(s=>s.id === sCard.dataset.sectionId);
      if (tSec){
        const hovered = document.querySelector('.pageCard.dropTarget');
        let pos = tSec.pageIds.length; // por defecto, al final de la sección
        if (hovered){
          const hId = hovered.dataset.id;
          if (tSec.pageIds.includes(hId)){
            pos = tSec.pageIds.indexOf(hId);
            // Si el puntero está en la mitad derecha de la tarjeta → insertar DESPUÉS de ella
            if (!isPointerLeftHalf(e, hovered)) pos += 1;
          }
        }
        sectionContext = { sec: tSec, pos };
      }
    }
  }

  // Mover una sección entera a otra sección → preguntar antes
  if (sectionCardAt && !sectionContext && currentDrag.origin === 'canvas-section'){
    const srcSec = sections.find(s=>s.id === currentDrag.sectionId);
    const targetSec = sections.find(s=>s.id === sectionCardAt.dataset.sectionId);
    if (srcSec && targetSec && srcSec.id !== targetSec.id){
      const ok = await confirmDialog('¿Mover la sección "' + srcSec.name + '" a la sección "' + targetSec.name + '"?');
      if (ok){
        srcSec.pageIds.forEach(id=>{
          if (!targetSec.pageIds.includes(id)) targetSec.pageIds.push(id);
        });
        sections = sections.filter(sec=>sec.id !== srcSec.id);
        resequencePages();
        showToast('Sección "' + srcSec.name + '" movida a "' + targetSec.name + '".');
        commitAction('Mover sección dentro del lienzo', dropBefore);
      }
      currentDrag = null;
      renderPageList();
      return;
    }
  }

  // ── Soltado DENTRO de una sección: reordenar a una posición específica ──
  if (sectionContext){
    const targetSec = sectionContext.sec;
    let pos = sectionContext.pos;

    if (currentDrag.origin === 'canvas'){
      // Mover una página (dentro de la misma sección o desde otra/páginas sueltas)
      if (!pages.some(p=>p.id === currentDrag.pageId)) return;
      const srcSec = sections.find(s=>s.pageIds.includes(currentDrag.pageId));
      if (srcSec){
        const oldIdx = srcSec.pageIds.indexOf(currentDrag.pageId);
        srcSec.pageIds = srcSec.pageIds.filter(id=>id !== currentDrag.pageId);
        if (srcSec.id === targetSec.id && oldIdx < pos) pos -= 1;
      }
      sections = sections.filter(sec=>sec.pageIds.length > 0);
      targetSec.pageIds.splice(Math.min(pos, targetSec.pageIds.length), 0, currentDrag.pageId);
resequencePages();
      selectedIds.clear();
      updateSelectionUI();
      currentDrag = null;
      renderPageList();
      commitAction('Mover página dentro de sección', dropBefore);
      return;
    }

    if (currentDrag.origin === 'canvas-multi'){
      const ids = Array.isArray(currentDrag.pageIds) ? currentDrag.pageIds : [currentDrag.pageIds];
      const idSet = new Set(ids.filter(id=>pages.some(p=>p.id===id)));
      if (!idSet.size) return;
      // Quitar de todas las secciones
      sections.forEach(s=>{ s.pageIds = s.pageIds.filter(id=>!idSet.has(id)); });
      sections = sections.filter(sec=>sec.pageIds.length > 0);
      targetSec.pageIds.splice(Math.min(pos, targetSec.pageIds.length), 0, ...Array.from(idSet));
resequencePages();
      selectedIds.clear();
      updateSelectionUI();
      currentDrag = null;
      renderPageList();
      commitAction('Mover páginas dentro de sección', dropBefore);
      return;
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
                  id: 'p' + (idCounter++), sourceId: item.sourceId, type:'pdf',
                  pageIndex: i, thumb: pt.thumb, label: item.name, w: pt.w, h: pt.h
                });
              });
            }
          } else {
            const src = sources[item.sourceId];
            newItems.push({
              id: 'p' + (idCounter++), sourceId: item.sourceId, type:'image',
              thumb: src.dataUrl, label: item.name, w: src.w, h: src.h
            });
          }
        } else {
          newItems.push({
            id: 'p' + (idCounter++), sourceId: item.sourceId, type: item.type,
            pageIndex: item.pageIndex, thumb: item.thumb, label: item.name, w: item.w, h: item.h
          });
        }
      });
      if (!newItems.length) return;
      pages.push(...newItems);
      const newIds = newItems.map(p=>p.id);
      targetSec.pageIds.splice(Math.min(pos, targetSec.pageIds.length), 0, ...newIds);
      resequencePages();
      if (currentDrag.origin === 'library-multi'){ selectedLibIds.clear(); updateLibSelectionUI(); }
      currentDrag = null;
      renderPageList();
      return;
    }
  }

  // ── Soltado general (fuera de secciones) ──
let targetIndex;
  if (pageList.classList.contains('grid-mode')){
    const hovered = document.querySelector('.pageCard.dropTarget');
    clearDropTargets();
    if (hovered){
      const hi = pages.findIndex(p=>p.id === hovered.dataset.id);
      targetIndex = hi === -1 ? pages.length : hi;
      // Si el puntero está en la mitad derecha de la tarjeta → insertar DESPUÉS de ella
      if (!isPointerLeftHalf(e, hovered)) targetIndex += 1;
    } else {
      targetIndex = pages.length;
    }
  } else {
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
    commitAction('Agregar elementos de biblioteca al lienzo', dropBefore);
} else if (currentDrag.origin === 'canvas'){
   const fromIndex = pages.findIndex(p=>p.id === currentDrag.pageId);
    if (fromIndex === -1) return;
    // Quitar la página de su sección si se suelta fuera de cualquier sección
    sections.forEach(s=>{ s.pageIds = s.pageIds.filter(id=>id !== currentDrag.pageId); });
    sections = sections.filter(sec=>sec.pageIds.length > 0);
    const [moved] = pages.splice(fromIndex, 1);
    let insertAt = targetIndex;
    if (fromIndex < targetIndex) insertAt -= 1;
    pages.splice(insertAt, 0, moved);
    commitAction('Mover página en el lienzo', dropBefore);
} else if (currentDrag.origin === 'canvas-multi'){
    console.log('Procesando drop múltiple:', currentDrag.pageIds);
    const pageIds = Array.isArray(currentDrag.pageIds) ? currentDrag.pageIds : [currentDrag.pageIds];
    const idSet = new Set(pageIds);
    // Quitar las páginas movidas de sus secciones (si se sueltan fuera de toda sección)
    sections.forEach(s=>{ s.pageIds = s.pageIds.filter(id=>!idSet.has(id)); });
    sections = sections.filter(sec=>sec.pageIds.length > 0);
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
    commitAction('Mover páginas en el lienzo', dropBefore);
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
      pages.splice(targetIndex, 0, ...newPages);
      showToast('Sección creada en el lienzo.');
      commitAction('Agregar sección de biblioteca al lienzo', dropBefore);
    } else {
      // Solo insertar las páginas sueltas
      pages.splice(targetIndex, 0, ...newPages);
      showToast('Páginas agregadas al lienzo.');
      commitAction('Agregar páginas al lienzo', dropBefore);
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
    commitAction('Mover sección en el lienzo', dropBefore);
  }

  currentDrag = null;
  renderPageList();
});

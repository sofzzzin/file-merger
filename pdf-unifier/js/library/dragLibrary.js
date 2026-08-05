const dragStackOverlay = document.getElementById('dragStackOverlay');
const stackCountNum = document.querySelector('#dragStackOverlay .stackCountNum');
const stackCountLabel = document.querySelector('#dragStackOverlay .stackCountLabel');

function getDragCount(e){
  // Archivos del sistema (OS files)
  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length){
    return e.dataTransfer.files.length;
  }
  // Múltiples páginas del lienzo
  if (currentDrag && currentDrag.origin === 'canvas-multi'){
    return Array.isArray(currentDrag.pageIds) ? currentDrag.pageIds.length : 1;
  }
  // Página individual del lienzo
  if (currentDrag && currentDrag.origin === 'canvas'){
    return 1;
  }
  // Múltiples ítems de la biblioteca
  if (currentDrag && currentDrag.origin === 'library-multi'){
    return Array.isArray(currentDrag.libIds) ? currentDrag.libIds.length : 1;
  }
  return 0;
}

function showDragStack(e){
  const count = getDragCount(e);
  if (count <= 0) return;

  stackCountNum.textContent = count;
  stackCountLabel.textContent = 'elemento' + (count === 1 ? '' : 's');

  // Posicionar en el cursor
  dragStackOverlay.style.left = e.clientX + 'px';
  dragStackOverlay.style.top = e.clientY + 'px';

  // Forzar re-animación del bump cuando cambia el conteo
  if (dragStackOverlay.dataset.lastCount && dragStackOverlay.dataset.lastCount !== String(count)){
    dragStackOverlay.classList.remove('bump');
    void dragStackOverlay.offsetWidth;
    dragStackOverlay.classList.add('bump');
  }
  dragStackOverlay.dataset.lastCount = String(count);

  dragStackOverlay.classList.add('visible');
}

function hideDragStack(){
  dragStackOverlay.classList.remove('visible');
}

// Oculta la imagen fantasma nativa del navegador al arrastrar
// para que solo se vea la pila de tarjetas personalizada.
function setTransparentDragImage(e){
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    e.dataTransfer.setDragImage(canvas, 0, 0);
  } catch(err){ /* en algunos navegadores no está soportado */ }
}

libraryPanel.addEventListener('dragover', e=>{
  const isOsFiles = e.dataTransfer.types && e.dataTransfer.types.includes('Files');
  const isCanvasDrag = currentDrag && (currentDrag.origin === 'canvas' || currentDrag.origin === 'canvas-multi');
  if (isOsFiles || isCanvasDrag){
    e.preventDefault();
    if (isCanvasDrag) e.dataTransfer.dropEffect = 'move';
    libraryPanel.classList.add('dragover');
    showDragStack(e);
  }
});
libraryPanel.addEventListener('dragleave', ()=>{
  libraryPanel.classList.remove('dragover');
  hideDragStack();
});

// Seguridad: ocultar el overlay si el arrastre termina fuera del panel
document.addEventListener('dragend', hideDragStack);
document.addEventListener('drop', ()=>{
  libraryPanel.classList.remove('dragover');
  hideDragStack();
});
// En js/library/dragLibrary.js
libraryPanel.addEventListener('drop', e=>{
  libraryPanel.classList.remove('dragover');
  hideDragStack();
  
  if (e.dataTransfer.files && e.dataTransfer.files.length){
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
    return;
  }
  
  if (currentDrag && (currentDrag.origin === 'canvas' || currentDrag.origin === 'canvas-multi')){
    e.preventDefault();
    
    // 🔴 CAMBIO AQUÍ: Manejar tanto single como multi
    let ids;
if (currentDrag.origin === 'canvas-multi') {
      // Asegurar que pageIds es un array
      ids = Array.isArray(currentDrag.pageIds) ? currentDrag.pageIds : [currentDrag.pageIds];
      console.log('Moviendo múltiples páginas a biblioteca:', ids);
    } else {
      ids = [currentDrag.pageId];
      console.log('Moviendo una página a biblioteca:', ids);
    }
    
    // Si se arrastran múltiples páginas juntas, se crea una sección en la biblioteca
    const groupAsSection = currentDrag.origin === 'canvas-multi' && ids.length > 1;
    movePagesToLibrary(ids, groupAsSection);
    currentDrag = null;
  }
});

function movePagesToLibrary(pageIds, groupAsSection){
  // Asegurar que pageIds es un array
  const ids = Array.isArray(pageIds) ? pageIds : [pageIds];
  const idSet = new Set(ids);
  const moving = pages.filter(p => idSet.has(p.id));
  
  if (!moving.length) {
    showToast('No hay páginas para mover.');
    return;
  }
  
  // Guardar los IDs de las páginas que se van a mover
  const pageIdsToRemove = new Set(moving.map(p => p.id));
  
  // Filtrar las páginas que NO están en el set
  pages = pages.filter(p => !pageIdsToRemove.has(p.id));
  
  // Procesar cada página movida
  const newLibIds = [];
  moving.forEach(p => {
    const libId = 'libpage' + (libPageCounter++);
    libraryItemsMap[libId] = {
      id: libId, 
      kind:'page', 
      sourceId: p.sourceId, 
      pageIndex: p.pageIndex,
      type: p.type, 
      name: p.label, 
      thumb: p.thumb, 
      w: p.w, 
      h: p.h, 
      status:'ready'
    };
    libraryOrder.push(libId);
    newLibIds.push(libId);
  });
  
  // Si se movieron varias páginas juntas, agruparlas en una sección de biblioteca
  if (groupAsSection && newLibIds.length > 1){
    librarySections.push({
      id: 'libsec' + (libSectionCounter++),
      name: getNextLibSectionName(),
      libIds: newLibIds
    });
    armUndo('library', librarySections[librarySections.length-1].id);
  }
  
  // Limpiar selección SOLO si estamos moviendo desde canvas
  selectedIds.clear();
  updateSelectionUI();
  renderLibrary();
  renderPageList();
  
  const count = moving.length;
  if (groupAsSection && newLibIds.length > 1){
    showToast('Sección creada en la biblioteca. Puedes deshacerla con Ctrl+Z durante 20 segundos.');
  } else {
    showToast(count === 1 ? 'Página enviada a la biblioteca.' : count + ' páginas enviadas a la biblioteca.');
  }
}

function updateCurrentPageIndicator(){
  const total = pages.length;
  const cards = Array.from(document.querySelectorAll('.pageCard'));
  const areaRect = canvasArea.getBoundingClientRect();
  const threshold = areaRect.top + 90;
  let current = 1;

  if (!total){
    pageCountInput.value = '0';
    pageCountInput.disabled = true;
    pageCountTotal.textContent = '0';
    return;
  }

  for (let i=0;i<cards.length;i++){
    const r = cards[i].getBoundingClientRect();
    if (r.top <= threshold) current = i+1;
  }

  pageCountInput.disabled = false;
  pageCountInput.value = Math.min(current, total);
  pageCountInput.max = total;
  pageCountTotal.textContent = total;
}

function jumpToPageByInput(){
  const total = pages.length;
  if (!total) return;

  let target = parseInt(pageCountInput.value, 10);
  if (Number.isNaN(target)) target = 1;
  target = Math.max(1, Math.min(total, target));
  pageCountInput.value = target;

  const cards = Array.from(document.querySelectorAll('.pageCard'));
  const card = cards[target - 1];
  if (card) {
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

pageCountInput.addEventListener('change', jumpToPageByInput);
pageCountInput.addEventListener('keydown', e=>{
  if (e.key === 'Enter') {
    e.preventDefault();
    jumpToPageByInput();
  }
});
canvasArea.addEventListener('scroll', updateCurrentPageIndicator, { passive:true });

function toggleSelectAll(){
  if (!pages.length) return;
  if (selectedIds.size === pages.length){
    selectedIds.clear();
  } else {
    selectedIds = new Set(pages.map(p=>p.id));
  }
  updateSelectionUI();
}
selectAllBtn.addEventListener('click', toggleSelectAll);

function renderPageList(){
  pageList.innerHTML = '';
  exportBtn.disabled = pages.length === 0;
  emptyState.style.display = pages.length === 0 ? 'flex' : 'none';
  emptyState.style.flexDirection = 'column';
  emptyState.style.alignItems = 'center';

  // Construir el orden de render con divisores de sección
  const ordered = [];
  const placed = new Set();

  // Primero las secciones (en el orden global de secciones)
  sections.forEach(sec=>{
    const secPages = pages.filter(p => sec.pageIds.includes(p.id));
    if (secPages.length){
      ordered.push({ type:'divider', sec });
      secPages.forEach(p=>{
        ordered.push({ type:'page', page: p });
        placed.add(p.id);
      });
    }
  });

  // Luego las páginas sueltas (no pertenecientes a ninguna sección)
  pages.forEach(p=>{
    if (!placed.has(p.id)){
      ordered.push({ type:'page', page: p });
    }
  });

  // Si no hay secciones, mantener el comportamiento original (gaps entre todas)
  pageList.appendChild(makeGap(0));
  let flatIdx = 0;
  ordered.forEach(entry=>{
    if (entry.type === 'divider'){
      pageList.appendChild(makeSectionDivider(entry.sec, entry.sec.pageIds.length));
    } else {
      pageList.appendChild(makeCard(entry.page, flatIdx));
      pageList.appendChild(makeGap(flatIdx + 1));
      flatIdx++;
    }
  });
  updateSelectionUI();
  updateCurrentPageIndicator();
}

function makeGap(index){
  const gap = document.createElement('div');
  gap.className = 'gap';
  gap.dataset.index = index;
  const line = document.createElement('div'); line.className='line';
  const caret = document.createElement('div'); caret.className='caret';
  gap.appendChild(line); gap.appendChild(caret);
  return gap;
}

function makeCard(p, idx){
  const card = document.createElement('div');
  card.className = 'pageCard';
  card.draggable = true;
  card.dataset.id = p.id;

  const selectDot = document.createElement('div');
  selectDot.className = 'selectDot';
  selectDot.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
  selectDot.addEventListener('mousedown', e=>e.stopPropagation());
  selectDot.addEventListener('click', e=>{ e.stopPropagation(); toggleSelect(p.id); });
  card.appendChild(selectDot);

  const tab = document.createElement('div');
  tab.className = 'tab';
  tab.textContent = String(idx+1).padStart(2,'0') + ' · ' + p.label;
  card.appendChild(tab);

  const overlay = document.createElement('div');
  overlay.className = 'overlay';

  const zoomBtn = document.createElement('button');
  zoomBtn.className = 'iconBtn zoomBtn';
  zoomBtn.title = 'Ver en grande';
  zoomBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/><path d="M11 8v6M8 11h6"/></svg>';
  zoomBtn.addEventListener('click', e=>{
    e.stopPropagation();
    openLightbox(pages.map(pp=>pp.thumb), idx);
  });

  const delBtn = document.createElement('button');
  delBtn.className = 'iconBtn delBtn';
  delBtn.title = 'Eliminar';
  delBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>';
  delBtn.addEventListener('click', (e)=>{
    e.stopPropagation();
    pages = pages.filter(x=>x.id !== p.id);
    addToTrash('canvas-page', p);
    selectedIds.delete(p.id);
    renderPageList();
    showToast('Página movida a la papelera.');
  });
  overlay.appendChild(zoomBtn);
  overlay.appendChild(delBtn);
  card.appendChild(overlay);

  const img = document.createElement('img');
  img.src = p.thumb;
  img.addEventListener('click', e=>{
    e.stopPropagation();
    openLightbox(pages.map(pp=>pp.thumb), idx);
  });
  card.appendChild(img);

  const pageNum = document.createElement('div');
  pageNum.className = 'pageNum';
  pageNum.textContent = idx + 1;
  card.appendChild(pageNum);

card.addEventListener('dragstart', e=>{
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', p.id);
    setTransparentDragImage(e);
    
    if (selectedIds.has(p.id) && selectedIds.size > 1) {
      const selectedIdsArray = Array.from(selectedIds);
      currentDrag = { 
        origin: 'canvas-multi', 
        pageIds: selectedIdsArray 
      };
      console.log('Moviendo múltiples páginas:', selectedIdsArray.length);
    } else {
      if (selectedIds.size && !selectedIds.has(p.id)) {
        selectedIds.clear(); 
        updateSelectionUI(); 
      }
      currentDrag = { 
        origin: 'canvas', 
        pageId: p.id 
      };
      console.log('Moviendo una página:', p.id);
    }
  
  requestAnimationFrame(() => card.classList.add('dragging'));
});
  card.addEventListener('dragend', ()=>{
    card.classList.remove('dragging');
    currentDrag = null;
    closeAllGaps();
  });

  return card;
}

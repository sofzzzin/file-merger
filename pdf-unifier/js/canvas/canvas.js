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

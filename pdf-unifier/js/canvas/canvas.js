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
  let secIdx = 0;
  ordered.forEach(entry=>{
    if (entry.type === 'divider'){
      // Gap para reordenar secciones (antes de la sección). Al soltar un divisor
      // de sección sobre este gap se reordena el array `sections` (mover arriba/abajo).
      const sGap = makeGap(flatIdx);
      sGap.dataset.sectionGap = '1';
      sGap.dataset.sectionOrder = secIdx;
      pageList.appendChild(sGap);

      // Agrupar las páginas de la sección en un card con cabecera
      const card = makeCanvasSectionCard(entry.sec);
      pageList.appendChild(card);
      pageList.appendChild(makeGap(flatIdx + entry.sec.pageIds.length));
      flatIdx += entry.sec.pageIds.length;
      secIdx++;
    } else {
      // Saltar las páginas que ya se renderizaron dentro de su card de sección
      if (placed.has(entry.page.id)) return;
      pageList.appendChild(makeCard(entry.page, flatIdx));
      pageList.appendChild(makeGap(flatIdx + 1));
      flatIdx++;
    }
  });
  updateSelectionUI();
  updateCurrentPageIndicator();
}

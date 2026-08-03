function updateSelectionUI(){
  const n = selectedIds.size;
  selectionBar.classList.toggle('show', n > 0);
  selCount.textContent = n + (n === 1 ? ' seleccionada' : ' seleccionadas');
  document.querySelectorAll('.pageCard').forEach(card=>{
    card.classList.toggle('selected', selectedIds.has(card.dataset.id));
  });
  const allSelected = pages.length > 0 && n === pages.length;
  selectAllBtn.innerHTML = allSelected
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>Deseleccionar todo'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>Seleccionar todo';
}
function toggleSelect(id){
  if (selectedIds.has(id)) selectedIds.delete(id);
  else selectedIds.add(id);
  updateSelectionUI();
}
cancelSelectionBtn.addEventListener('click', ()=>{ selectedIds.clear(); updateSelectionUI(); });
sendToLibraryBtn.addEventListener('click', ()=>{
  movePagesToLibrary([...selectedIds]);
});
deleteSelectedBtn.addEventListener('click', async ()=>{
  const n = selectedIds.size;
  if (!n) return;
  const ok = await confirmDialog(
    '¿Seguro que quieres eliminar ' + n + (n===1 ? ' página' : ' páginas') +
    ' del lienzo? Podrás recuperarla' + (n===1?'':'s') + ' desde la papelera de reciclaje.'
  );
  if (!ok) return;
  const idSet = new Set(selectedIds);
  const removed = pages.filter(p=>idSet.has(p.id));
  pages = pages.filter(p=>!idSet.has(p.id));
  removed.forEach(p=>addToTrash('canvas-page', p));
  selectedIds.clear();
  updateSelectionUI();
  renderPageList();
  showToast(n === 1 ? 'Página movida a la papelera.' : n + ' páginas movidas a la papelera.');
});

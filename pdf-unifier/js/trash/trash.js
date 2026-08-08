function addToTrash(kind, data){
  const id = 'trash' + (trashCounter++);
  trash.push({ id, kind, data, removedAt: Date.now() });
  updateTrashBadge();
}
function updateTrashBadge(){
  trashBadge.style.display = trash.length ? 'flex' : 'none';
  trashBadge.textContent = trash.length;
}
function renderTrashPanel(){
  trashList.innerHTML = '';
  trashEmpty.style.display = trash.length === 0 ? 'block' : 'none';
  trash.slice().reverse().forEach(entry=>{
    const row = document.createElement('div');
    row.className = 'trashRow';
    const thumbSrc = entry.data.thumb;
    const img = document.createElement('img');
    img.className = 'thumb';
    img.src = thumbSrc || '';
    const info = document.createElement('div');
    info.className = 'info';
    const n = document.createElement('div'); n.className = 'n';
    n.textContent = entry.kind === 'canvas-page' ? entry.data.label : entry.data.name;
    const k = document.createElement('div'); k.className = 'k';
    k.textContent = entry.kind === 'canvas-page' ? 'Página del lienzo' : 'Elemento de biblioteca';
    info.appendChild(n); info.appendChild(k);

    const actions = document.createElement('div');
    actions.className = 'rActions';
    const restoreBtn = document.createElement('button');
    restoreBtn.className = 'restoreBtn';
    restoreBtn.textContent = 'Restaurar';
    restoreBtn.addEventListener('click', ()=>restoreFromTrash(entry.id));
    const purgeBtn = document.createElement('button');
    purgeBtn.className = 'purgeBtn';
    purgeBtn.textContent = 'Eliminar';
    purgeBtn.addEventListener('click', ()=>{
      trash = trash.filter(t=>t.id !== entry.id);
      updateTrashBadge();
      renderTrashPanel();
    });
    actions.appendChild(restoreBtn);
    actions.appendChild(purgeBtn);

    row.appendChild(img); row.appendChild(info); row.appendChild(actions);
    trashList.appendChild(row);
  });
}
function restoreFromTrash(entryId){
  const entry = trash.find(t=>t.id === entryId);
  if (!entry) return;
  const before = snapshotState();
  trash = trash.filter(t=>t.id !== entryId);
  if (entry.kind === 'canvas-page'){
    pages.push(entry.data);
    renderPageList();
  } else if (entry.kind === 'library-item'){
    libraryItemsMap[entry.data.id] = entry.data;
    libraryOrder.push(entry.data.id);
    renderLibrary();
  }
  updateTrashBadge();
  renderTrashPanel();
  showToast('Elemento restaurado.');
  commitAction('Restaurar elemento de la papelera', before);
}
trashBtn.addEventListener('click', ()=>{
  renderTrashPanel();
  trashPanel.classList.add('show');
});
closeTrashBtn.addEventListener('click', ()=>trashPanel.classList.remove('show'));
trashPanel.addEventListener('click', e=>{ if (e.target === trashPanel) trashPanel.classList.remove('show'); });
clearTrashBtn.addEventListener('click', async ()=>{
  if (!trash.length) return;
  const ok = await confirmDialog('Esto eliminará definitivamente ' + trash.length + ' elemento(s) de la papelera. Esta acción no se puede deshacer.');
  if (!ok) return;
  trash = [];
  updateTrashBadge();
  renderTrashPanel();
});

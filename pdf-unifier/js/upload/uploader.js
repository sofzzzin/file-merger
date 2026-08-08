async function handleFiles(fileListRaw){
  const list = Array.from(fileListRaw);
  // Detectar archivos de proyecto guardado (.json). Si se sueltan/seleccionan,
  // se abren directamente como proyecto en lugar de procesarse como PDF/imagen.
  const projectFiles = list.filter(f=>{
    const t = f.type;
    const n = f.name.toLowerCase();
    return t === 'application/json' || n.endsWith('.json');
  });
  if (projectFiles.length){
    for (const pf of projectFiles) await loadProjectFile(pf);
    // Resetear los inputs para poder volver a abrir el mismo archivo
    if (fileInput && fileInput.value) fileInput.value = '';
    if (addMoreInput && addMoreInput.value) addMoreInput.value = '';
    return;
  }

  const files = list.filter(f=>{
    const t = f.type;
    const n = f.name.toLowerCase();
    return t === 'application/pdf' || t === 'image/png' || t === 'image/jpeg' ||
           n.endsWith('.pdf') || n.endsWith('.png') || n.endsWith('.jpg') || n.endsWith('.jpeg');
  });
  if (!files.length) return;

  activateWorkspace();

  const jobs = files.map(file=>{
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const libId = 'src' + (sourceCounter++);
    libraryItemsMap[libId] = {
      id: libId, kind:'file', sourceId: libId,
      type: isPdf ? 'pdf' : 'image', name: file.name,
      status:'loading', progress:0
    };
    libraryOrder.push(libId);
    return { file, libId, isPdf };
  });
  renderLibrary();
  showToast('Procesando ' + files.length + ' archivo(s)...');

  await Promise.all(jobs.map(({file, libId, isPdf})=>{
    const task = isPdf ? processPdf(file, libId) : processImage(file, libId);
    return task.catch(err=>{
      console.error(err);
      libraryItemsMap[libId].status = 'error';
      renderLibrary();
      showToast('Error al procesar ' + file.name);
    });
  }));

  renderLibrary();
  showToast('Listo. Revisa tu biblioteca y arrastra al lienzo.');
}

function setProgress(libId, pct){
  const item = libraryItemsMap[libId];
  if (item) item.progress = pct;
  const bar = libraryList.querySelector('.libItem[data-lib-id="'+libId+'"] .progressFill');
  const label = libraryList.querySelector('.libItem[data-lib-id="'+libId+'"] .progressPct');
  if (bar) bar.style.width = Math.min(100, Math.max(0, pct)) + '%';
  if (label) label.textContent = Math.round(pct) + '%';
}

dropZone.addEventListener('click', ()=>fileInput.click());
fileInput.addEventListener('change', e=>handleFiles(e.target.files));
addMoreInput.addEventListener('change', e=>handleFiles(e.target.files));
document.getElementById('addMoreBtn').addEventListener('click', ()=>addMoreInput.click());
document.getElementById('floatingAdd').addEventListener('click', ()=>{
  if (workspace.classList.contains('active')) addMoreInput.click();
  else fileInput.click();
});

['dragenter','dragover'].forEach(evt=>{
  dropZone.addEventListener(evt, e=>{ e.preventDefault(); dropZone.classList.add('dragover'); });
});
['dragleave','drop'].forEach(evt=>{
  dropZone.addEventListener(evt, e=>{ e.preventDefault(); dropZone.classList.remove('dragover'); });
});
dropZone.addEventListener('drop', e=>{
  if (e.dataTransfer.files && e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
});
document.body.addEventListener('dragover', e=>{ if(!workspace.classList.contains('active')) e.preventDefault(); });
document.body.addEventListener('drop', e=>{
  if(!workspace.classList.contains('active')){
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  }
});

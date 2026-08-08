// ─────────────────────────────────────────────────────────────
//  MÓDULO DE PROYECTO (Guardar / Abrir)
//  Serializa todo el estado de la aplicación (sources con los
//  bytes de PDFs/imágenes, biblioteca, lienzo, secciones y
//  papelera) en un único archivo JSON local y permite reabrirlo
//  restaurando por completo el proyecto tal cual quedó.
// ─────────────────────────────────────────────────────────────

// Convierte un ArrayBuffer a string base64.
function arrayBufferToBase64(buffer){
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk){
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

// Convierte una string base64 a ArrayBuffer (usado al abrir PDFs).
function base64ToArrayBuffer(base64){
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++){
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Serializa `sources` (los bytes de PDFs e imágenes) a formato plano.
// - PDF: convierte `bytes` (ArrayBuffer) a base64.
// - Imagen: ya está como dataURL, se conserva tal cual.
function serializeSources(){
  const result = {};
  for (const key of Object.keys(sources)){
    const src = sources[key];
    if (!src) continue;
    if (src.type === 'pdf'){
      result[key] = {
        type: 'pdf',
        name: src.name,
        bytesB64: arrayBufferToBase64(src.bytes),
        pageThumbs: src.pageThumbs,
        mime: src.mime
      };
    } else {
      result[key] = {
        type: 'image',
        name: src.name,
        dataUrl: src.dataUrl,
        mime: src.mime,
        w: src.w,
        h: src.h
      };
    }
  }
  return result;
}

// Reconvierte un source plano guardado de vuelta a su forma viva.
function deserializeSource(raw){
  if (!raw) return null;
  if (raw.type === 'pdf'){
    return {
      type: 'pdf',
      name: raw.name,
      bytes: base64ToArrayBuffer(raw.bytesB64),
      pageThumbs: raw.pageThumbs || []
    };
  }
  return {
    type: 'image',
    name: raw.name,
    dataUrl: raw.dataUrl,
    mime: raw.mime,
    w: raw.w,
    h: raw.h
  };
}

// ── Guardar proyecto ─────────────────────────────────────────
function saveProject(){
  const payload = {
    app: 'unificador',
    version: 1,
    savedAt: new Date().toISOString(),
    sources: serializeSources(),
    pages: pages,
    sections: sections,
    libraryItemsMap: libraryItemsMap,
    libraryOrder: libraryOrder,
    librarySections: librarySections,
    trash: trash,
    // Contadores para regenerar IDs únicos al continuar trabajando
    idCounter,
    sourceCounter,
    sectionCounter,
    libSectionCounter,
    libPageCounter,
    trashCounter
  };

  const json = JSON.stringify(payload);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'proyecto_unificador.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 4000);
  showToast('Proyecto guardado en tu dispositivo.');
}

// ── Abrir proyecto ───────────────────────────────────────────
async function loadProjectFile(file){
  try {
    const text = await file.text();
    const payload = JSON.parse(text);

    if (!payload || typeof payload !== 'object' || payload.app !== 'unificador'){
      throw new Error('El archivo no es un proyecto válido de Unificador.');
    }

    // Restaurar sources (los bytes de PDFs se reconvierten desde base64).
    const newSources = {};
    for (const key of Object.keys(payload.sources || {})){
      const src = deserializeSource(payload.sources[key]);
      if (src) newSources[key] = src;
    }
    Object.keys(sources).forEach(k => delete sources[k]);
    Object.assign(sources, newSources);

    // Restaurar estado (biblioteca, lienzo, secciones, papelera).
    pages = payload.pages || [];
    sections = payload.sections || [];
    libraryItemsMap = payload.libraryItemsMap || {};
    libraryOrder = payload.libraryOrder || [];
    librarySections = payload.librarySections || [];
    trash = payload.trash || [];

    // Restaurar contadores para seguir generando IDs únicos.
    idCounter = payload.idCounter || 0;
    sourceCounter = payload.sourceCounter || 0;
    sectionCounter = payload.sectionCounter || 0;
    libSectionCounter = payload.libSectionCounter || 0;
    libPageCounter = payload.libPageCounter || 0;
    trashCounter = payload.trashCounter || 0;

    // Resetear selecciones e historial.
    selectedIds.clear();
    selectedLibIds.clear();
    selectedLibSectionIds.clear();
    clearHistory();

    // Refrescar la interfaz.
    activateWorkspace();
    updateSelectionUI();
    updateLibSelectionUI();
    updateTrashBadge();
    renderPageList();
    if (typeof renderLibrary === 'function') renderLibrary();
    if (trashPanel && trashPanel.classList.contains('show')) renderTrashPanel();

    showToast('Proyecto abierto correctamente.');
  } catch (err) {
    console.error(err);
    showToast('Error al abrir el proyecto: ' + (err.message || 'archivo inválido'));
  }
}

// ── Listeners ───────────────────────────────────────────────
function openProjectPicker(){
  projectFileInput.click();
}

const saveBtn = document.getElementById('saveBtn');
const openBtn = document.getElementById('openBtn');
const projectFileInput = document.getElementById('projectFileInput');

if (saveBtn) saveBtn.addEventListener('click', saveProject);
if (openBtn) openBtn.addEventListener('click', openProjectPicker);
if (projectFileInput) projectFileInput.addEventListener('change', e=>{
  const file = e.target.files && e.target.files[0];
  if (file) loadProjectFile(file);
  e.target.value = '';
});


// ─────────────────────────────────────────────────────────────
//  MÓDULO DE HISTORIAL (Deshacer / Rehacer)
//  Implementa pilas de undo/redo usando snapshots de estado
//  completo (páginas, secciones, biblioteca, papelera y
//  contadores de IDs). De esta forma cubre TODAS las acciones.
// ─────────────────────────────────────────────────────────────

let historyStack = [];      // Pila de acciones deshacer
let redoStack = [];         // Pila de acciones rehacer
const MAX_HISTORY = 50;     // Límite de acciones de deshacer

// ── Snapshot del estado global ────────────────────────────────
// Devuelve una copia profunda JSON del estado relevante.
function snapshotState(){
  return {
    pages: JSON.stringify(pages),
    sections: JSON.stringify(sections),
    libraryItemsMap: JSON.stringify(libraryItemsMap),
    libraryOrder: JSON.stringify(libraryOrder),
    librarySections: JSON.stringify(librarySections),
    trash: JSON.stringify(trash),
    idCounter,
    sourceCounter,
    sectionCounter,
    libSectionCounter,
    libPageCounter,
    trashCounter
  };
}

// Restaura un snapshot capturado y refresca la interfaz.
function restoreSnapshot(snap){
  pages = JSON.parse(snap.pages);
  sections = JSON.parse(snap.sections);
  libraryItemsMap = JSON.parse(snap.libraryItemsMap);
  libraryOrder = JSON.parse(snap.libraryOrder);
  librarySections = JSON.parse(snap.librarySections);
  trash = JSON.parse(snap.trash);
  idCounter = snap.idCounter;
  sourceCounter = snap.sourceCounter;
  sectionCounter = snap.sectionCounter;
  libSectionCounter = snap.libSectionCounter;
  libPageCounter = snap.libPageCounter;
  trashCounter = snap.trashCounter;

  selectedIds.clear();
  selectedLibIds.clear();
  selectedLibSectionIds.clear();

  updateSelectionUI();
  updateLibSelectionUI();
  updateTrashBadge();
  renderPageList();
  if (typeof renderLibrary === 'function') renderLibrary();
  if (trashPanel && trashPanel.classList.contains('show')) renderTrashPanel();
}

// ── Registro de acciones ─────────────────────────────────────
// `before` es un snapshot de antes de la mutación.
// Se captura el snapshot posterior automáticamente al ejecutar.
// undo() y redo() intercambian ambos snapshots (Command pattern
// con estado conmutativo).
function commitAction(label, before){
  const after = snapshotState();
  // Si no hubo cambios reales, no registrar la acción
  if (before.pages === after.pages &&
      before.sections === after.sections &&
      before.libraryItemsMap === after.libraryItemsMap &&
      before.libraryOrder === after.libraryOrder &&
      before.librarySections === after.librarySections &&
      before.trash === after.trash){
    return;
  }

  historyStack.push({ label, before, after });
  if (historyStack.length > MAX_HISTORY) historyStack.shift();
  redoStack = [];
}

// ── Deshacer ─────────────────────────────────────────────────
function undo(){
  if (!historyStack.length){
    showToast('No hay acciones que deshacer.');
    return false;
  }
  const action = historyStack.pop();
  // El estado actual debe coincidir con `after` para restaurar `before`.
  redoStack.push(action);
  restoreSnapshot(action.before);
  showToast('Deshecho: ' + action.label);
  return true;
}

// ── Rehacer ─────────────────────────────────────────────────
function redo(){
  if (!redoStack.length){
    showToast('No hay acciones que rehacer.');
    return false;
  }
  const action = redoStack.pop();
  historyStack.push(action);
  restoreSnapshot(action.after);
  showToast('Rehecho: ' + action.label);
  return true;
}

// ── Limpiar historial ────────────────────────────────────────
function clearHistory(){
  historyStack = [];
  redoStack = [];
}

// ── Atajos de teclado ────────────────────────────────────────
document.addEventListener('keydown', e=>{
  if (e.ctrlKey || e.metaKey){
    const key = e.key.toLowerCase();
    if (key === 'z'){
      e.preventDefault();
      if (e.shiftKey){
        redo();
      } else {
        undo();
      }
    } else if (key === 'y'){
      e.preventDefault();
      redo();
    }
  }
});


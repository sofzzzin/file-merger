// ─────────────────────────────────────────────────────────────
//  EXPORTACIÓN PDF
//  Genera y descarga el PDF final. Soporta:
//   - PDF unido (todas las páginas en un solo archivo)
//   - Descarga por lotes (un PDF por sección + páginas sueltas,
//     empaquetados en un ZIP)
// ─────────────────────────────────────────────────────────────

// Construye un PDFDocument a partir de una lista de páginas del lienzo.
async function buildPdfFromPages(pageList){
  const { PDFDocument } = PDFLib;
  const finalDoc = await PDFDocument.create();
  const pdfLibCache = {};

  for (const p of pageList){
    if (p.type === 'pdf'){
      let srcDoc = pdfLibCache[p.sourceId];
      if (!srcDoc){
        srcDoc = await PDFDocument.load(sources[p.sourceId].bytes.slice(0));
        pdfLibCache[p.sourceId] = srcDoc;
      }
      const [copied] = await finalDoc.copyPages(srcDoc, [p.pageIndex]);
      finalDoc.addPage(copied);
    } else {
      const src = sources[p.sourceId];
      if (!src || !src.dataUrl) {
        console.warn(`Fuente de imagen no encontrada para la página ${p.id}`);
        continue;
      }
      try {
        const base64 = src.dataUrl.includes(',') ? src.dataUrl.split(',')[1] : src.dataUrl;
        const bytes = Uint8Array.from(atob(base64), c=>c.charCodeAt(0));
        let embedded;
        if (src.mime === 'image/png') embedded = await finalDoc.embedPng(bytes);
        else embedded = await finalDoc.embedJpg(bytes);

        const PX_TO_PT = 72/96;
        let w = p.w * PX_TO_PT;
        let h = p.h * PX_TO_PT;
        const maxDim = 1000;
        if (Math.max(w,h) > maxDim){
          const s = maxDim / Math.max(w,h);
          w *= s; h *= s;
        }
        const page = finalDoc.addPage([w, h]);
        page.drawImage(embedded, { x:0, y:0, width:w, height:h });
      } catch (err) {
        console.error(`Error al decodificar la imagen de la página ${p.id}:`, err);
      }
    }
  }

  return finalDoc;
}

// Descarga un Blob con el nombre indicado.
function triggerDownload(blob, filename){
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 4000);
}

// Sanitiza un nombre para usarlo como nombre de archivo.
function sanitizeFileName(name){
  return (name || '').replace(/[^\w\-_]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'seccion';
}

// Descarga el PDF unido (todas las páginas en orden).
async function exportUnified(){
  const { PDFDocument } = PDFLib;
  const finalDoc = await buildPdfFromPages(pages);
  const outBytes = await finalDoc.save();
  const blob = new Blob([outBytes], { type:'application/pdf' });
  triggerDownload(blob, 'documento_unido.pdf');
}

// Descarga por lotes: un PDF por cada sección del lienzo + un PDF
// con las páginas sueltas (las que no pertenecen a ninguna sección),
// todo empaquetado en un ZIP.
async function exportBatch(){
  const zip = new JSZip();
  const usedNames = new Set();

  // 1) Un PDF por cada sección del lienzo
  for (const sec of sections){
    const secPages = pages.filter(p => sec.pageIds.includes(p.id));
    if (!secPages.length) continue;
    const doc = await buildPdfFromPages(secPages);
    const outBytes = await doc.save();
    let base = sanitizeFileName(sec.name);
    let fileName = base + '.pdf';
    let n = 2;
    while (usedNames.has(fileName.toLowerCase())){
      fileName = base + '_' + n + '.pdf';
      n++;
    }
    usedNames.add(fileName.toLowerCase());
    zip.file(fileName, outBytes);
  }

  // 2) Páginas sueltas (fuera de cualquier sección) en un solo PDF
  const placed = new Set();
  sections.forEach(sec => sec.pageIds.forEach(id => placed.add(id)));
  const loosePages = pages.filter(p => !placed.has(p.id));
  if (loosePages.length){
    const doc = await buildPdfFromPages(loosePages);
    const outBytes = await doc.save();
    let fileName = 'paginas_sueltas.pdf';
    let n = 2;
    while (usedNames.has(fileName.toLowerCase())){
      fileName = 'paginas_sueltas_' + n + '.pdf';
      n++;
    }
    usedNames.add(fileName.toLowerCase());
    zip.file(fileName, outBytes);
  }

  const zipBlob = await zip.generateAsync({ type:'blob' });
  triggerDownload(zipBlob, 'documento_unido_lote.zip');
}

// ── Modal de exportación ──
function openExportModal(){
  exportModal.classList.add('show');
}
function closeExportModal(){
  exportModal.classList.remove('show');
}

exportBtn.addEventListener('click', ()=>{
  if (!pages.length) return;
  // Si existen secciones en el lienzo, preguntar cómo exportar.
  if (sections.length > 0){
    openExportModal();
  } else {
    runExport(exportUnified);
  }
});

// Ejecuta una función de exportación gestionando el estado del botón.
async function runExport(fn){
  exportBtn.disabled = true;
  const originalLabel = exportBtn.innerHTML;
  exportBtn.innerHTML = 'Generando...';
  try{
    await fn();
    showToast('Exportación completada correctamente.');
  }catch(err){
    console.error(err);
    showToast('Error al exportar: ' + err.message);
  }finally{
    exportBtn.disabled = false;
    exportBtn.innerHTML = originalLabel;
  }
}

exportUnifiedBtn.addEventListener('click', ()=>{
  closeExportModal();
  runExport(exportUnified);
});

exportBatchBtn.addEventListener('click', ()=>{
  closeExportModal();
  runExport(exportBatch);
});

exportCancelBtn.addEventListener('click', closeExportModal);
exportModal.addEventListener('click', e=>{
  if (e.target === exportModal) closeExportModal();
});

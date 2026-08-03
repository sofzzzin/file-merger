exportBtn.addEventListener('click', async ()=>{
  if (!pages.length) return;
  exportBtn.disabled = true;
  const originalLabel = exportBtn.innerHTML;
  exportBtn.innerHTML = 'Generando...';
  try{
    const { PDFDocument } = PDFLib;
    const finalDoc = await PDFDocument.create();
    const pdfLibCache = {};

    for (const p of pages){
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
        const base64 = src.dataUrl.split(',')[1];
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
      }
    }

    const outBytes = await finalDoc.save();
    const blob = new Blob([outBytes], { type:'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'documento_unido.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 4000);
    showToast('PDF exportado correctamente.');
  }catch(err){
    console.error(err);
    showToast('Error al exportar: ' + err.message);
  }finally{
    exportBtn.disabled = false;
    exportBtn.innerHTML = originalLabel;
  }
});

async function processPdf(file, libId){
  setProgress(libId, 2);
  const buf = await file.arrayBuffer();
  setProgress(libId, 8);
  const pageThumbs = [];

  try {
    const loadingTask = pdfjsLib.getDocument({ data: buf.slice(0) });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    for (let i=1;i<=numPages;i++){
      const page = await pdfDoc.getPage(i);
      const viewport = page.getViewport({ scale: 1 });
      const targetWidth = 1200;
      const scale = targetWidth / viewport.width;
      const scaledViewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
      pageThumbs.push({ thumb: canvas.toDataURL('image/jpeg', 0.88), w: viewport.width, h: viewport.height });
      setProgress(libId, 8 + Math.round((i / numPages) * 92));
    }

    sources[libId] = { type:'pdf', name:file.name, bytes: buf, pageThumbs };
    const item = libraryItemsMap[libId];
    if (item) {
      item.pageCount = pageThumbs.length;
      item.thumb = pageThumbs[0].thumb;
      item.status = 'ready';
      item.progress = 100;
    }
  } catch (err) {
    console.error(`Error procesando PDF ${file.name}:`, err);
    const item = libraryItemsMap[libId];
    if (item) {
      item.status = 'error';
    }
    showToast(`Error al procesar ${file.name}: ${err.message || 'Error al procesar PDF'}`);
  }
}

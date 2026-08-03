function processImage(file, libId){
  return new Promise((resolve, reject)=>{
    const reader = new FileReader();
    reader.onprogress = (e)=>{
      if (e.lengthComputable) setProgress(libId, (e.loaded / e.total) * 70);
    };
    reader.onload = ()=>{
      setProgress(libId, 75);
      const dataUrl = reader.result;
      const img = new Image();
      img.onload = ()=>{
        setProgress(libId, 95);
        sources[libId] = {
          type:'image', name:file.name, dataUrl,
          mime: file.type || (file.name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'),
          w: img.naturalWidth, h: img.naturalHeight
        };
        const item = libraryItemsMap[libId];
        item.thumb = dataUrl;
        item.w = img.naturalWidth;
        item.h = img.naturalHeight;
        item.status = 'ready';
        item.progress = 100;
        resolve();
      };
      img.onerror = reject;
      img.src = dataUrl;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

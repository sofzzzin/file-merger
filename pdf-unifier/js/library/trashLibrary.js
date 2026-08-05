function trashLibraryItem(libId){
  const item = libraryItemsMap[libId];
  if (!item) return;
  // Quitar el ítem de cualquier sección de biblioteca a la que pertenezca
  librarySections.forEach(sec=>{
    sec.libIds = sec.libIds.filter(id=>id!==libId);
  });
  librarySections = librarySections.filter(sec=>sec.libIds.length > 0);
  libraryOrder = libraryOrder.filter(id=>id!==libId);
  delete libraryItemsMap[libId];
  addToTrash('library-item', item);
  renderLibrary();
}

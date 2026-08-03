function trashLibraryItem(libId){
  const item = libraryItemsMap[libId];
  if (!item) return;
  libraryOrder = libraryOrder.filter(id=>id!==libId);
  delete libraryItemsMap[libId];
  addToTrash('library-item', item);
  renderLibrary();
}

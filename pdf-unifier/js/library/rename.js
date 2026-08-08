function startRename(item, nameEl){
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'nameInput';
  input.value = item.name;
  nameEl.replaceWith(input);
  input.focus();
  input.select();
function commit(){
    const v = input.value.trim();
    if (!v || v === item.name) return;
    const before = snapshotState();
    item.name = v || item.name;
    renderLibrary();
    commitAction('Renombrar elemento de la biblioteca', before);
  }
  input.addEventListener('blur', commit);
  input.addEventListener('keydown', e=>{
    if (e.key === 'Enter') input.blur();
    if (e.key === 'Escape'){ input.value = item.name; input.blur(); }
  });
}

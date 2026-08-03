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
    item.name = v || item.name;
    renderLibrary();
  }
  input.addEventListener('blur', commit);
  input.addEventListener('keydown', e=>{
    if (e.key === 'Enter') input.blur();
    if (e.key === 'Escape'){ input.value = item.name; input.blur(); }
  });
}

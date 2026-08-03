function makeGap(index){
  const gap = document.createElement('div');
  gap.className = 'gap';
  gap.dataset.index = index;
  const line = document.createElement('div'); line.className='line';
  const caret = document.createElement('div'); caret.className='caret';
  gap.appendChild(line); gap.appendChild(caret);
  return gap;
}

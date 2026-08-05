function updateCurrentPageIndicator(){
  const total = pages.length;
  const cards = Array.from(document.querySelectorAll('.pageCard'));
  const areaRect = canvasArea.getBoundingClientRect();
  const threshold = areaRect.top + 90;
  let current = 1;

  if (!total){
    pageCountInput.value = '0';
    pageCountInput.disabled = true;
    pageCountTotal.textContent = '0';
    return;
  }

  for (let i=0;i<cards.length;i++){
    const r = cards[i].getBoundingClientRect();
    if (r.top <= threshold) current = i+1;
  }

  pageCountInput.disabled = false;
  pageCountInput.value = Math.min(current, total);
  pageCountInput.max = total;
  pageCountTotal.textContent = total;
}

function jumpToPageByInput(){
  const total = pages.length;
  if (!total) return;

  let target = parseInt(pageCountInput.value, 10);
  if (Number.isNaN(target)) target = 1;
  target = Math.max(1, Math.min(total, target));
  pageCountInput.value = target;

  const cards = Array.from(document.querySelectorAll('.pageCard'));
  const card = cards[target - 1];
  if (card) {
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

pageCountInput.addEventListener('change', jumpToPageByInput);
pageCountInput.addEventListener('keydown', e=>{
  if (e.key === 'Enter') {
    e.preventDefault();
    jumpToPageByInput();
  }
});
canvasArea.addEventListener('scroll', updateCurrentPageIndicator, { passive:true });

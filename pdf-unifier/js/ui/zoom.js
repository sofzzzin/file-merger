const zoomStep = 10;
const minZoom = 50;
const maxZoom = 160;

function applyZoom(percent){
  const val = Math.min(maxZoom, Math.max(minZoom, parseInt(percent, 10) || 100));
  zoomSlider.value = String(val);
  pageList.style.setProperty('--zoom', (val/100).toFixed(2));
  zoomPct.textContent = val + '%';
  pageList.classList.toggle('grid-mode', val <= 70);
}

zoomSlider.addEventListener('input', ()=>{
  applyZoom(zoomSlider.value);
});

canvasArea.addEventListener('wheel', (event)=>{
  if (!event.ctrlKey && !event.metaKey) return;
  event.preventDefault();
  const delta = event.deltaY > 0 ? -zoomStep : zoomStep;
  const current = parseInt(zoomSlider.value, 10) || 100;
  applyZoom(current + delta);
}, { passive:false });

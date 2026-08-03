zoomSlider.addEventListener('input', ()=>{
  const val = parseInt(zoomSlider.value, 10);
  pageList.style.setProperty('--zoom', (val/100).toFixed(2));
  zoomPct.textContent = val + '%';
  pageList.classList.toggle('grid-mode', val <= 70);
});

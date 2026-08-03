let lb = { scale:1, x:0, y:0, dragging:false, startX:0, startY:0, moved:false };
let lbSequence = [];
let lbIndex = 0;

function applyLbTransform(){
  lightboxImg.style.transform = `translate(${lb.x}px, ${lb.y}px) scale(${lb.scale})`;
  lbZoomLevel.textContent = Math.round(lb.scale*100) + '%';
}

function fitLightbox(){
  const stageRect = lightboxStage.getBoundingClientRect();
  const iw = lightboxImg.naturalWidth || 1;
  const ih = lightboxImg.naturalHeight || 1;
  const fitScale = Math.min((stageRect.width*0.94)/iw, (stageRect.height*0.94)/ih);
  lb.scale = clampScale(Math.min(fitScale, 3));
  lb.x = 0; lb.y = 0;
  applyLbTransform();
}

function updateLbNav(){
  const total = lbSequence.length;
  lbPageInput.value = lbIndex + 1;
  lbPageInput.max = total;
  lbPageTotal.textContent = total;
  lbPrev.disabled = lbIndex <= 0;
  lbNext.disabled = lbIndex >= total - 1;
}

function showLbImage(){
  const src = lbSequence[lbIndex];
  lightboxImg.onload = fitLightbox;
  lightboxImg.src = src;
  updateLbNav();
}

function openLightbox(sequence, index){
  lbSequence = sequence;
  lbIndex = Math.max(0, Math.min(index, sequence.length-1));
  showLbImage();
  lightbox.classList.add('show');
}
function closeLightbox(){ lightbox.classList.remove('show'); }
function lbNavigate(delta){
  const ni = lbIndex + delta;
  if (ni < 0 || ni >= lbSequence.length) return;
  lbIndex = ni;
  showLbImage();
}

lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', e=>{ if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', e=>{
  if (!lightbox.classList.contains('show')) return;
  if (e.key === 'Escape') closeLightbox();
  else if (e.key === 'ArrowLeft') lbNavigate(-1);
  else if (e.key === 'ArrowRight') lbNavigate(1);
});
lbPrev.addEventListener('click', ()=>lbNavigate(-1));
lbNext.addEventListener('click', ()=>lbNavigate(1));
lbZoomIn.addEventListener('click', ()=>{ lb.scale = clampScale(lb.scale * 1.25); applyLbTransform(); });
lbZoomOut.addEventListener('click', ()=>{ lb.scale = clampScale(lb.scale / 1.25); applyLbTransform(); });
lbFit.addEventListener('click', fitLightbox);
lbPageInput.addEventListener('change', ()=>{
  let n = parseInt(lbPageInput.value, 10);
  if (isNaN(n)) n = lbIndex + 1;
  n = Math.max(1, Math.min(lbSequence.length, n));
  lbIndex = n - 1;
  showLbImage();
});
lbPageInput.addEventListener('click', e=>e.stopPropagation());
lbPageInput.addEventListener('keydown', e=>{ if (e.key === 'Enter') lbPageInput.blur(); });

lightboxStage.addEventListener('wheel', e=>{
  e.preventDefault();
  const delta = -e.deltaY * 0.0016;
  lb.scale = clampScale(lb.scale * (1 + delta));
  applyLbTransform();
}, { passive:false });

lightboxStage.addEventListener('pointerdown', e=>{
  if (e.target !== lightboxImg && e.target !== lightboxStage) return;
  lb.dragging = true;
  lb.moved = false;
  lb.startX = e.clientX - lb.x;
  lb.startY = e.clientY - lb.y;
  lightboxStage.classList.add('grabbing');
  lightboxStage.setPointerCapture(e.pointerId);
});
lightboxStage.addEventListener('pointermove', e=>{
  if (!lb.dragging) return;
  lb.moved = true;
  lb.x = e.clientX - lb.startX;
  lb.y = e.clientY - lb.startY;
  applyLbTransform();
});
['pointerup','pointercancel'].forEach(evt=>{
  lightboxStage.addEventListener(evt, ()=>{
    lb.dragging = false;
    lightboxStage.classList.remove('grabbing');
  });
});
lightboxStage.addEventListener('dblclick', fitLightbox);

function clampScale(s){ return Math.min(8, Math.max(0.15, s)); }

function showToast(msg){
  toastMsg.textContent = msg;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=>toast.classList.remove('show'), 2600);
}

function activateWorkspace(){
  dropScreen.style.opacity = '0';
  setTimeout(()=>{ dropScreen.style.display = 'none'; }, 350);
  workspace.classList.add('active');
}

function closeAllGaps(){
  document.querySelectorAll('.gap').forEach(g=>g.classList.remove('open'));
}

function clearDropTargets(){
  document.querySelectorAll('.pageCard.dropTarget').forEach(c=>c.classList.remove('dropTarget'));
}

function findNearestCard(e){
  const cards = Array.from(pageList.querySelectorAll('.pageCard'));
  if (!cards.length) return null;
  let closest = null, closestDist = Infinity;
  for (const c of cards){
    const r = c.getBoundingClientRect();
    const cx = r.left + r.width/2, cy = r.top + r.height/2;
    const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
    if (dist < closestDist){ closestDist = dist; closest = c; }
  }
  return closest;
}

function renderPageList(){
  pageList.innerHTML = '';
  exportBtn.disabled = pages.length === 0;
  emptyState.style.display = pages.length === 0 ? 'flex' : 'none';
  emptyState.style.flexDirection = 'column';
  emptyState.style.alignItems = 'center';

  pageList.appendChild(makeGap(0));
  pages.forEach((p, idx)=>{
    pageList.appendChild(makeCard(p, idx));
    pageList.appendChild(makeGap(idx+1));
  });
  updateSelectionUI();
  updateCurrentPageIndicator();
}

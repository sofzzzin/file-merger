function confirmDialog(message){
  return new Promise(resolve=>{
    confirmMsg.textContent = message;
    confirmModal.classList.add('show');
    function cleanup(result){
      confirmModal.classList.remove('show');
      confirmOk.removeEventListener('click', onOk);
      confirmCancel.removeEventListener('click', onCancel);
      resolve(result);
    }
    function onOk(){ cleanup(true); }
    function onCancel(){ cleanup(false); }
    confirmOk.addEventListener('click', onOk);
    confirmCancel.addEventListener('click', onCancel);
  });
}
confirmModal.addEventListener('click', e=>{ if (e.target === confirmModal) confirmCancel.click(); });

function sectionKeepDialog(sectionName){
  return new Promise(resolve=>{
    sectionKeepMsg.textContent = '¿Mantener la sección "' + sectionName + '" al agregarla al lienzo?';
    sectionKeepModal.classList.add('show');
    function cleanup(result){
      sectionKeepModal.classList.remove('show');
      sectionKeepNoBtn.removeEventListener('click', onNo);
      sectionKeepYesBtn.removeEventListener('click', onYes);
      resolve(result);
    }
    function onNo(){ cleanup(false); }
    function onYes(){ cleanup(true); }
    sectionKeepNoBtn.addEventListener('click', onNo);
    sectionKeepYesBtn.addEventListener('click', onYes);
  });
}
sectionKeepModal.addEventListener('click', e=>{ if (e.target === sectionKeepModal) sectionKeepNoBtn.click(); });

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

// listen for a button click
document.querySelector('button').addEventListener('click', function() {
    setTimeout(() => {
        chrome.runtime.sendMessage({ action: 'modifyPage' });
    }, 1000);
  });
  
chrome.storage.sync.get(['totals', 'progress'], (result) => {
    document.getElementById("data").innerHTML = JSON.stringify(result);
});

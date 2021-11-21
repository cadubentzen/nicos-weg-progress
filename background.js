chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      files: ["saveProgress.js"],
    },
    async () => {
      let url = chrome.runtime.getURL("dashboard.html");
      let tab = await chrome.tabs.create({ url });
      console.log(`Created tab ${tab.id}`);
    }
  );
});

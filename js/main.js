document.addEventListener("DOMContentLoaded", function () {
  document.addEventListener("DOMContentLoaded", function () {
    // Check daily reset at midnight
    setInterval(checkDailyReset, 60 * 1000); // Check every minute

    function checkDailyReset() {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        resetDailyFocusedMinutes();
      }
    }

    function resetDailyFocusedMinutes() {
      const today = new Date();
      const dateKey = `${today.getFullYear()}-${
        today.getMonth() + 1
      }-${today.getDate()}`;
      chrome.storage.local.get("focusData", (data) => {
        let focusData = data.focusData || {};
        if (focusData[dateKey]) {
          focusData[dateKey] = 0;
          chrome.storage.local.set({ focusData });
        }
      });
    }
  });
});

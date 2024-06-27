document.addEventListener("DOMContentLoaded", function () {
  // Update greeting based on time of day
  const greetingElement = document.getElementById("greeting");
  const now = new Date();
  const hours = now.getHours();
  if (hours < 12) {
    greetingElement.textContent = "Good Morning!";
  } else if (hours < 18) {
    greetingElement.textContent = "Good Afternoon!";
  } else {
    greetingElement.textContent = "Good Evening!";
  }

  // Display current date
  const dateElement = document.getElementById("date");
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  dateElement.textContent = now.toLocaleDateString(undefined, options);

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

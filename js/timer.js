document.addEventListener("DOMContentLoaded", function () {
  let timer;
  let isRunning = false;
  let focusedMinutesToday = 0;
  const minutesDisplay = document.getElementById("minutes");
  const secondsDisplay = document.getElementById("seconds");
  const startTimerButton = document.getElementById("start-timer");
  const resetTimerButton = document.getElementById("reset-timer");
  const timerOptions = document.getElementById("timer-options");

  startTimerButton.addEventListener("click", startTimer);
  resetTimerButton.addEventListener("click", resetTimer);

  function startTimer() {
    if (!isRunning) {
      isRunning = true;
      const selectedTime = parseInt(timerOptions.value, 10) * 60 * 1000; // Convert minutes to milliseconds
      const endTime = Date.now() + selectedTime;
      timer = setInterval(() => {
        const remainingTime = endTime - Date.now();
        if (remainingTime <= 0) {
          clearInterval(timer);
          isRunning = false;
          focusedMinutesToday += parseInt(timerOptions.value, 10);
          saveFocusedMinutes();
          alert(
            "Time is up! You focused for " + timerOptions.value + " minutes."
          );
        } else {
          const minutes = Math.floor(remainingTime / (1000 * 60));
          const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
          minutesDisplay.textContent = String(minutes).padStart(2, "0");
          secondsDisplay.textContent = String(seconds).padStart(2, "0");
        }
      }, 1000);
    }
  }

  function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    const defaultTime = parseInt(timerOptions.value, 10);
    minutesDisplay.textContent = String(defaultTime).padStart(2, "0");
    secondsDisplay.textContent = "00";
  }

  function saveFocusedMinutes() {
    const today = new Date();
    const dateKey = `${today.getFullYear()}-${
      today.getMonth() + 1
    }-${today.getDate()}`;
    chrome.storage.local.get("focusData", (data) => {
      let focusData = data.focusData || {};
      if (!focusData[dateKey]) {
        focusData[dateKey] = 0;
      }
      focusData[dateKey] += parseInt(timerOptions.value, 10);
      chrome.storage.local.set({ focusData });
    });
  }
});

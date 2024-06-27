document.addEventListener("DOMContentLoaded", function () {
  let timer;
  let isRunning = false;
  const minutesDisplay = document.getElementById("minutes");
  const secondsDisplay = document.getElementById("seconds");
  const startTimerButton = document.getElementById("start-timer");
  const resetTimerButton = document.getElementById("reset-timer");

  startTimerButton.addEventListener("click", startTimer);
  resetTimerButton.addEventListener("click", resetTimer);

  function startTimer() {
    if (!isRunning) {
      isRunning = true;
      const endTime = Date.now() + 25 * 60 * 1000;
      timer = setInterval(() => {
        const remainingTime = endTime - Date.now();
        if (remainingTime <= 0) {
          clearInterval(timer);
          isRunning = false;
          alert("Time is up!");
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
    minutesDisplay.textContent = "25";
    secondsDisplay.textContent = "00";
  }
});

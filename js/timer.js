document.addEventListener("DOMContentLoaded", function () {
  let timer;
  let isRunning = false;
  let focusedMinutesToday = 0;
  let focusedMinutesTotal = 0;
  let startTime;
  let selectedDuration = 25; // Default duration in minutes
  const minutesDisplay = document.getElementById("minutes");
  const secondsDisplay = document.getElementById("seconds");
  const startTimerButton = document.getElementById("start-timer");
  const resetTimerButton = document.getElementById("reset-timer");
  const timerOptions = document.getElementById("timer-options");
  const focusedMinutesTodayElement = document.getElementById(
    "focused-minutes-today"
  );
  const focusedMinutesTotalElement = document.getElementById(
    "focused-minutes-total"
  );

  // Check if there's an active timer in storage
  chrome.storage.local.get(["pomodoroTimer", "focusData"], (data) => {
    if (data.pomodoroTimer && data.pomodoroTimer.isRunning) {
      const { endTime, selectedDuration } = data.pomodoroTimer;
      const remainingTime = endTime - Date.now();
      if (remainingTime > 0) {
        startExistingTimer(remainingTime, selectedDuration);
      } else {
        resetTimerState();
      }
    } else {
      resetTimerState();
    }

    // Calculate today's focused minutes and update display
    const today = new Date();
    const dateKey = `${today.getFullYear()}-${
      today.getMonth() + 1
    }-${today.getDate()}`;
    if (data.focusData && data.focusData[dateKey]) {
      focusedMinutesToday = data.focusData[dateKey];
      updateFocusedMinutesDisplay();
    }

    // Calculate total focused minutes and update display
    if (data.focusData) {
      focusedMinutesTotal = Object.values(data.focusData).reduce(
        (acc, val) => acc + val,
        0
      );
      updateTotalFocusedMinutesDisplay();
    }
  });

  function startExistingTimer(remainingTime, duration) {
    isRunning = true;
    selectedDuration = duration;
    startTime = Date.now() - (selectedDuration * 60 * 1000 - remainingTime);
    timer = setInterval(updateTimerDisplay, 1000);
    toggleTimerControls(false);
  }

  function resetTimerState() {
    isRunning = false;
    selectedDuration = parseInt(timerOptions.value, 10);
    startTime = null;
    clearInterval(timer);
    minutesDisplay.textContent = String(selectedDuration).padStart(2, "0");
    secondsDisplay.textContent = "00";
    chrome.storage.local.remove("pomodoroTimer"); // Clear timer state in storage
    updateFocusedMinutesDisplay();
    toggleTimerControls(true);
  }

  startTimerButton.addEventListener("click", startTimer);
  resetTimerButton.addEventListener("click", resetTimer);
  timerOptions.addEventListener("change", updateSelectedDuration);

  function startTimer() {
    if (!isRunning) {
      isRunning = true;
      selectedDuration = parseInt(timerOptions.value, 10);
      startTime = Date.now();
      const endTime = startTime + selectedDuration * 60 * 1000;
      chrome.storage.local.set({
        pomodoroTimer: { isRunning: true, endTime, selectedDuration },
      });
      timer = setInterval(updateTimerDisplay, 1000);
      toggleTimerControls(false);
      updateTimerDisplay(); // Update display immediately after starting
    }
  }

  function resetTimer() {
    chrome.storage.local.set({ pomodoroTimer: { isRunning: false } }); // Set timer as not running
    resetTimerState();
    broadcastTimerReset(); // Broadcast reset to other tabs
  }

  function updateTimerDisplay() {
    const remainingTime = startTime + selectedDuration * 60 * 1000 - Date.now();
    if (remainingTime <= 0) {
      clearInterval(timer);
      isRunning = false;
      focusedMinutesToday += selectedDuration;
      focusedMinutesTotal += selectedDuration;
      saveFocusedMinutes();
      alert("Time is up! You focused for " + selectedDuration + " minutes.");
      chrome.storage.local.remove("pomodoroTimer"); // Clear timer state in storage
      toggleTimerControls(true);
      broadcastTimerReset(); // Broadcast reset to other tabs
    } else {
      const minutes = Math.floor(remainingTime / (1000 * 60));
      const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
      minutesDisplay.textContent = String(minutes).padStart(2, "0");
      secondsDisplay.textContent = String(seconds).padStart(2, "0");
    }
    updateFocusedMinutesDisplay();
    updateTotalFocusedMinutesDisplay();
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
      focusData[dateKey] += selectedDuration;
      chrome.storage.local.set({ focusData });
    });
  }

  function updateFocusedMinutesDisplay() {
    focusedMinutesTodayElement.textContent = focusedMinutesToday;
  }

  function updateTotalFocusedMinutesDisplay() {
    focusedMinutesTotalElement.textContent = focusedMinutesTotal;
  }

  function updateSelectedDuration() {
    selectedDuration = parseInt(timerOptions.value, 10);
    minutesDisplay.textContent = String(selectedDuration).padStart(2, "0");
    if (isRunning) {
      clearInterval(timer);
      startTimer();
    }
  }

  function toggleTimerControls(showControls) {
    if (showControls) {
      timerOptions.style.display = "inline-block";
      startTimerButton.style.display = "inline-block";
      resetTimerButton.style.display = "none";
    } else {
      timerOptions.style.display = "none";
      startTimerButton.style.display = "none";
      resetTimerButton.style.display = "inline-block";
    }
  }

  // Broadcast reset event to other tabs
  function broadcastTimerReset() {
    chrome.storage.local.set({ pomodoroTimer: { isRunning: false } });
  }

  // Listen for changes in pomodoroTimer state from other tabs
  chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (namespace === "local" && changes.pomodoroTimer) {
      const timerData = changes.pomodoroTimer.newValue;
      if (!timerData.isRunning) {
        resetTimerState();
      }
    }
    // Update focused minutes if changed in storage
    if (changes.focusData) {
      const today = new Date();
      const dateKey = `${today.getFullYear()}-${
        today.getMonth() + 1
      }-${today.getDate()}`;
      focusedMinutesToday = changes.focusData.newValue[dateKey] || 0;
      updateFocusedMinutesDisplay();
      focusedMinutesTotal = Object.values(changes.focusData.newValue).reduce(
        (acc, val) => acc + val,
        0
      );
      updateTotalFocusedMinutesDisplay();
    }
  });

  // Sync timer controls state across tabs
  chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (namespace === "local" && changes.pomodoroTimer) {
      const timerData = changes.pomodoroTimer.newValue;
      if (timerData.isRunning) {
        toggleTimerControls(false); // Hide select and start button
      } else {
        toggleTimerControls(true); // Show select and start button
      }
    }
  });

  // Initial check to sync controls state
  chrome.storage.local.get("pomodoroTimer", (data) => {
    if (data.pomodoroTimer && data.pomodoroTimer.isRunning) {
      toggleTimerControls(false); // Hide select and start button
    } else {
      toggleTimerControls(true); // Show select and start button
    }
  });
});

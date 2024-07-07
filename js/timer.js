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
  const timerButtons = document.querySelectorAll(".timer_btn");
  const focusedMinutesTodayElement = document.getElementById(
    "focused-minutes-today-txt"
  );
  const focusedMinutesTotalElement = document.getElementById(
    "focused-minutes-total-txt"
  );
  const pointsElement = document.getElementById("points");
  const timerElement = document.getElementById("timer");

  // Check if there's an active timer in storage
  chrome.storage.local.get(
    ["pomodoroTimer", "focusData", "totalPoints"],
    (data) => {
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

      // Update total points display
      pointsElement.textContent = data.totalPoints || 0;
    }
  );

  function startExistingTimer(remainingTime, duration) {
    isRunning = true;
    selectedDuration = duration;
    startTime = Date.now() - (selectedDuration * 60 * 1000 - remainingTime);
    timer = setInterval(updateTimerDisplay, 1000);
    toggleTimerControls(false);
    showTimerElement();
  }

  function resetTimerState() {
    isRunning = false;
    startTime = null;
    clearInterval(timer);
    minutesDisplay.textContent = String(selectedDuration).padStart(2, "0");
    secondsDisplay.textContent = "00";
    updateFocusedMinutesDisplay();
    toggleTimerControls(true);
    hideTimerElement();
  }

  startTimerButton.addEventListener("click", startTimer);
  resetTimerButton.addEventListener("click", resetTimer);

  timerButtons.forEach((button) => {
    button.addEventListener("click", function (event) {
      event.preventDefault();
      updateSelectedDuration(button);
    });
  });

  function startTimer() {
    if (!isRunning) {
      isRunning = true;
      startTime = Date.now();
      const endTime = startTime + selectedDuration * 60 * 1000;
      chrome.storage.local.set(
        { pomodoroTimer: { isRunning: true, endTime, selectedDuration } },
        () => {
          broadcastTimerState(); // Broadcast start state to other tabs
        }
      );
      timer = setInterval(updateTimerDisplay, 1000);
      toggleTimerControls(false);
      showTimerElement();
      updateTimerDisplay(); // Update display immediately after starting
    }
  }

  function resetTimer() {
    chrome.storage.local.set({ pomodoroTimer: { isRunning: false } }, () => {
      resetTimerState();
      broadcastTimerState(); // Broadcast reset state to other tabs
    });
  }

  function updateTimerDisplay() {
    const remainingTime = startTime + selectedDuration * 60 * 1000 - Date.now();
    if (remainingTime <= 0) {
      clearInterval(timer);
      isRunning = false;
      focusedMinutesToday += selectedDuration;
      focusedMinutesTotal += selectedDuration;
      saveFocusedMinutes();
      addPoints(selectedDuration);
      alert("Time is up! You focused for " + selectedDuration + " minutes.");
      chrome.storage.local.set({ pomodoroTimer: { isRunning: false } }, () => {
        resetTimerState();
        broadcastTimerState(); // Broadcast reset to other tabs
      });
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

  function addPoints(duration) {
    let points = 0;
    if (duration === 2) {
      points = 5;
    } else if (duration === 25) {
      points = 5;
    } else if (duration === 50) {
      points = 15;
    } else if (duration === 75) {
      points = 25;
    }

    chrome.storage.local.get("totalPoints", (data) => {
      let totalPoints = data.totalPoints || 0;
      totalPoints += points;
      chrome.storage.local.set({ totalPoints }, () => {
        pointsElement.textContent = totalPoints;
      });
    });
  }

  function updateFocusedMinutesDisplay() {
    focusedMinutesTodayElement.textContent = focusedMinutesToday;
  }

  function updateTotalFocusedMinutesDisplay() {
    focusedMinutesTotalElement.textContent = focusedMinutesTotal;
  }

  function updateSelectedDuration(button) {
    // Remove the 'is-active' class from all buttons
    timerButtons.forEach((btn) => btn.classList.remove("is-active"));
    // Add the 'is-active' class to the clicked button
    button.classList.add("is-active");

    selectedDuration = parseInt(button.getAttribute("data-duration"), 10);
    minutesDisplay.textContent = String(selectedDuration).padStart(2, "0");

    if (isRunning) {
      clearInterval(timer);
      startTimer();
    }
  }

  function toggleTimerControls(showControls) {
    if (showControls) {
      document.querySelector(".timer-btns").style.display = "inline-block";
      startTimerButton.style.display = "flex";
      resetTimerButton.style.display = "none";
    } else {
      document.querySelector(".timer-btns").style.display = "none";
      startTimerButton.style.display = "none";
      resetTimerButton.style.display = "inline-block";
    }
  }

  // Show the timer element
  function showTimerElement() {
    timerElement.style.display = "flex";
  }

  // Hide the timer element
  function hideTimerElement() {
    timerElement.style.display = "none";
  }

  // Broadcast timer state to other tabs
  function broadcastTimerState() {
    chrome.storage.local.get("pomodoroTimer", (data) => {
      chrome.storage.local.set(
        { pomodoroTimer: data.pomodoroTimer },
        function () {
          if (chrome.runtime.lastError) {
            console.error(
              "Error setting pomodoroTimer:",
              chrome.runtime.lastError
            );
            return;
          }
          console.log("Timer state broadcasted successfully.");
        }
      );
    });
  }

  // Listen for changes in pomodoroTimer state from other tabs
  chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (namespace === "local" && changes.pomodoroTimer) {
      const timerData = changes.pomodoroTimer.newValue;
      if (timerData && typeof timerData.isRunning !== "undefined") {
        if (timerData.isRunning) {
          const remainingTime = timerData.endTime - Date.now();
          if (remainingTime > 0) {
            clearInterval(timer);
            startExistingTimer(remainingTime, timerData.selectedDuration);
          } else {
            resetTimerState();
          }
        } else {
          resetTimerState();
        }
      } else {
        // Handle cases where timerData is not defined or isRunning is not defined
        console.warn(
          "Unexpected timerData structure or undefined isRunning property",
          timerData
        );
        toggleTimerControls(true); // Default to showing select and start button
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

    // Update total points if changed in storage
    if (changes.totalPoints) {
      pointsElement.textContent = changes.totalPoints.newValue || 0;
    }
  });

  // Initial check to sync controls state
  chrome.storage.local.get("pomodoroTimer", (data) => {
    if (data.pomodoroTimer && data.pomodoroTimer.isRunning) {
      toggleTimerControls(false); // Hide select and start button
      showTimerElement();
    } else {
      toggleTimerControls(true); // Show select and start button
      hideTimerElement();
    }
  });
});

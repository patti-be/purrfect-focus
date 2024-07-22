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
  const progressBar = document.getElementById("progress-bar");

  const CIRCUMFERENCE = 2 * Math.PI * 45; // Radius is 45 as per the provided SVG
  const baseTimerPathRemaining = document.getElementById(
    "base-timer-path-remaining"
  );
  baseTimerPathRemaining.setAttribute("stroke-dasharray", CIRCUMFERENCE);

  // Load Lottie animations
  const animations = {
    1: lottie.loadAnimation({
      container: document.getElementById("animation-1"),
      renderer: "svg",
      loop: true,
      autoplay: false,
      path: "path/to/animation-1.json", // Update with your animation path
    }),
    2: lottie.loadAnimation({
      container: document.getElementById("animation-2"),
      renderer: "svg",
      loop: true,
      autoplay: false,
      path: "path/to/animation-2.json", // Update with your animation path
    }),
    3: lottie.loadAnimation({
      container: document.getElementById("animation-3"),
      renderer: "svg",
      loop: true,
      autoplay: false,
      path: "path/to/animation-3.json", // Update with your animation path
    }),
    4: lottie.loadAnimation({
      container: document.getElementById("animation-4"),
      renderer: "svg",
      loop: false,
      autoplay: false,
      path: "path/to/animation-4.json", // Update with your animation path
    }),
  };

  // Function to show a specific animation
  function showAnimation(animationNumber) {
    Object.values(animations).forEach((anim, index) => {
      if (index + 1 === animationNumber) {
        anim.play();
        anim.container.style.display = "block";
      } else {
        anim.pause();
        anim.container.style.display = "none";
      }
    });
  }

  // Initially show animation-1
  showAnimation(1);

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
        chrome.storage.local.set({ focusData }, () => {
          focusedMinutesToday = 0;
          updateFocusedMinutesDisplay();
        });
      }
    });
  }

  // Check if there's an active timer in storage
  chrome.storage.local.get(
    ["pomodoroTimer", "focusData", "totalPoints", "progress"],
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

      // Update progress bar display
      if (data.progress) {
        updateProgressBar(data.progress);
      }
    }
  );

  function startExistingTimer(remainingTime, duration) {
    isRunning = true;
    selectedDuration = duration;
    startTime = Date.now() - (selectedDuration * 60 * 1000 - remainingTime);
    timer = setInterval(updateTimerDisplay, 100);
    toggleTimerControls(false);
    showTimerElement();
    showAnimation(2); // Show animation-2 when the timer is running
  }

  function resetTimerState() {
    isRunning = false;
    startTime = null;
    clearInterval(timer);
    minutesDisplay.textContent = "00";
    secondsDisplay.textContent = "00";
    // Reset the stroke-dasharray to the full circumference
    baseTimerPathRemaining.setAttribute("stroke-dasharray", CIRCUMFERENCE);
    updateFocusedMinutesDisplay();
    toggleTimerControls(true);
    hideTimerElement();
    showAnimation(1); // Show animation-1 when the timer is not running
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
    console.log("called start timer");
    if (!isRunning) {
      const activeButton = document.querySelector(".timer_btn.is-active");
      if (activeButton) {
        console.log("theres an active button", activeButton);
        isRunning = true;
        startTime = Date.now();
        const endTime = startTime + selectedDuration * 60 * 1000;
        chrome.storage.local.set(
          { pomodoroTimer: { isRunning: true, endTime, selectedDuration } },
          () => {
            broadcastTimerState(); // Broadcast start state to other tabs
          }
        );
        timer = setInterval(updateTimerDisplay, 100);
        toggleTimerControls(false);
        updateTimerDisplay(); // Update display immediately after starting
        showAnimation(2); // Show animation-2 when the timer is running
      } else {
        alert("Please select a duration before starting the timer.");
      }
    }
  }

  function resetTimer() {
    chrome.storage.local.set({ pomodoroTimer: { isRunning: false } }, () => {
      resetTimerState();
      broadcastTimerState(); // Broadcast reset state to other tabs
      showAnimation(3); // Show animation-3 when the timer is reset
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
      increaseProgressBar(); // Increase progress bar
      showAnimation(4); // Show animation-4 when the timer runs out naturally
      chrome.storage.local.set({ pomodoroTimer: { isRunning: false } }, () => {
        toggleTimerControls(true);
        broadcastTimerState(); // Broadcast reset to other tabs
      });
    } else {
      const minutes = Math.floor(remainingTime / (1000 * 60));
      const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
      minutesDisplay.textContent = String(minutes).padStart(2, "0");
      secondsDisplay.textContent = String(seconds).padStart(2, "0");

      // Update the stroke-dasharray value
      const fraction = remainingTime / (selectedDuration * 60 * 1000);
      const dashArrayValue = (fraction * CIRCUMFERENCE).toFixed(0);
      baseTimerPathRemaining.setAttribute(
        "stroke-dasharray",
        `${dashArrayValue} ${CIRCUMFERENCE}`
      );
    }
  }

  function updateSelectedDuration(button) {
    timerButtons.forEach((btn) => btn.classList.remove("is-active"));
    button.classList.add("is-active");
    selectedDuration = parseInt(button.dataset.duration);
  }

  function toggleTimerControls(enable) {
    startTimerButton.disabled = !enable;
    resetTimerButton.disabled = enable;
    timerButtons.forEach((button) => (button.disabled = !enable));
  }

  function updateFocusedMinutesDisplay() {
    focusedMinutesTodayElement.textContent = focusedMinutesToday;
  }

  function updateTotalFocusedMinutesDisplay() {
    focusedMinutesTotalElement.textContent = focusedMinutesTotal;
  }

  function saveFocusedMinutes() {
    const today = new Date();
    const dateKey = `${today.getFullYear()}-${
      today.getMonth() + 1
    }-${today.getDate()}`;
    chrome.storage.local.get("focusData", (data) => {
      let focusData = data.focusData || {};
      focusData[dateKey] = focusedMinutesToday;
      chrome.storage.local.set({ focusData });
    });
  }

  function addPoints(minutes) {
    const points = minutes; // 1 point per minute
    chrome.storage.local.get("totalPoints", (data) => {
      const currentPoints = data.totalPoints || 0;
      const newTotalPoints = currentPoints + points;
      chrome.storage.local.set({ totalPoints: newTotalPoints }, () => {
        pointsElement.textContent = newTotalPoints;
      });
    });
  }

  function broadcastTimerState() {
    chrome.runtime.sendMessage({ action: "updateTimerState" });
  }

  function showTimerElement() {
    timerElement.style.display = "block";
  }

  function hideTimerElement() {
    timerElement.style.display = "none";
  }

  function increaseProgressBar() {
    chrome.storage.local.get("progress", (data) => {
      let currentProgress = data.progress || 0;
      currentProgress += 5; // Increase progress by 5%
      if (currentProgress > 100) {
        currentProgress = 100;
      }
      chrome.storage.local.set({ progress: currentProgress }, () => {
        updateProgressBar(currentProgress);
      });
    });
  }

  function updateProgressBar(progress) {
    progressBar.style.width = `${progress}%`;
  }
});

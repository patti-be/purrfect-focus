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

  const modal = document.getElementById("modal");
  const modalClose = document.querySelector(".modal_close");
  const btnCollect = document.querySelector(".btn-collect");
  const modalCover = document.querySelector(".modal_cover");

  // Function to close the modal
  function closeModal() {
    modal.style.display = "none";
  }

  // Add event listeners
  modalClose.addEventListener("click", closeModal);
  btnCollect.addEventListener("click", closeModal);
  modalCover.addEventListener("click", closeModal);

  lottie.loadAnimation({
    container: document.getElementById("lottie-animation-dance"), // the dom element that will contain the animation
    renderer: "svg",
    loop: true,
    autoplay: true,
    path: "/animations/cat-party.json", // the path to the animation json
  });
});

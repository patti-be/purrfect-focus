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

  // You can add more functionalities here, like weather updates
});

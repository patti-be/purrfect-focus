document.addEventListener("DOMContentLoaded", function () {
  // To-Do List functionality
  const todoList = document.getElementById("todo-list");
  const newTodoInput = document.getElementById("new-todo");
  const addTodoButton = document.getElementById("add-todo");

  addTodoButton.addEventListener("click", addTodo);

  function addTodo() {
    const task = newTodoInput.value.trim();
    if (task) {
      const li = document.createElement("li");
      li.textContent = task;
      li.addEventListener("click", toggleComplete);
      todoList.appendChild(li);
      newTodoInput.value = "";
      saveTodos();
    }
  }

  function toggleComplete(event) {
    event.target.classList.toggle("completed");
    saveTodos();
  }

  function saveTodos() {
    const todos = [];
    todoList.querySelectorAll("li").forEach((li) => {
      todos.push({
        task: li.textContent,
        completed: li.classList.contains("completed"),
      });
    });
    chrome.storage.local.set({ todos });
  }

  function loadTodos() {
    chrome.storage.local.get("todos", (data) => {
      if (data.todos) {
        data.todos.forEach((todo) => {
          const li = document.createElement("li");
          li.textContent = todo.task;
          if (todo.completed) {
            li.classList.add("completed");
          }
          li.addEventListener("click", toggleComplete);
          todoList.appendChild(li);
        });
      }
    });
  }

  loadTodos();

  // Pomodoro Timer functionality
  let timer;
  let isRunning = false;
  const timerDisplay = document.getElementById("timer");
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

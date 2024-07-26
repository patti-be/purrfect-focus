document.addEventListener("DOMContentLoaded", function () {
  const todoList = document.getElementById("todo-list");
  const newTodoInput = document.getElementById("new-todo");
  const addTodoButton = document.getElementById("add-todo");
  const pointsElement = document.getElementById("points");
  let totalPoints = 0;
  let allTasksCompletedPreviously = false;

  // Load points and todos from storage
  chrome.storage.local.get(["totalPoints", "todos"], (data) => {
    if (data.totalPoints !== undefined) {
      totalPoints = data.totalPoints;
      updatePointsDisplay();
    }
    if (data.todos) {
      loadTodos(data.todos);
    }
  });

  addTodoButton.addEventListener("click", addTodo);
  newTodoInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      addTodo();
    }
  });

  function addTodo() {
    const task = newTodoInput.value.trim();
    console.log("todo input value", task);
    if (task) {
      const li = createTodoItem(task, false);
      todoList.appendChild(li);
      newTodoInput.value = "";
      saveTodos();
    }
  }

  function createTodoItem(task, completed) {
    const li = document.createElement("li");
    li.classList.add("todo-item");

    const taskWrapper = document.createElement("div");
    taskWrapper.classList.add("task-wrapper");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = completed;
    checkbox.addEventListener("change", toggleComplete);

    const taskText = document.createTextNode(task);

    taskWrapper.appendChild(checkbox);
    taskWrapper.appendChild(taskText);

    const deleteIcon = document.createElement("i");
    deleteIcon.classList.add("fas", "fa-trash-alt", "todo-icon", "delete-icon");
    deleteIcon.addEventListener("click", deleteTodo);

    const editIcon = document.createElement("i");
    editIcon.classList.add("fas", "fa-pencil-alt", "todo-icon", "edit-icon");
    editIcon.addEventListener("click", editTodo);

    const editTodoWrapper = document.createElement("div");
    editTodoWrapper.classList.add("edit-todo-wrapper");
    editTodoWrapper.appendChild(editIcon);
    editTodoWrapper.appendChild(deleteIcon);

    li.appendChild(taskWrapper);
    li.appendChild(editTodoWrapper);

    if (completed) {
      li.classList.add("completed");
    }

    return li;
  }

  function toggleComplete(event) {
    const li = event.target.closest("li");
    const isChecked = event.target.checked;
    li.classList.toggle("completed");
    saveTodos();

    // Add or subtract points based on checkbox state
    if (isChecked) {
      addPoints(5);
      console.log("add 5");
    } else {
      addPoints(-5);
      console.log("rm 5");
    }
  }

  function deleteTodo(event) {
    const li = event.target.closest("li");
    const isCompleted = li.classList.contains("completed");
    console.log(li);
    console.log(li.querySelector("input[type='checkbox']"));

    if (!isCompleted) {
      addPoints(-5);
    }

    // Check if previously all tasks were completed
    if (allTasksCompletedPreviously && !allTasksCompleted(true)) {
      addPoints(-10);
      allTasksCompletedPreviously = false;
    }

    li.remove();
    saveTodos();
  }

  function editTodo(event) {
    const li = event.target.closest("li");
    const taskWrapper = li.querySelector(".task-wrapper");
    const taskTextNode = taskWrapper.childNodes[1]; // second child is the text node
    const newTask = prompt("Edit task:", taskTextNode.textContent);
    if (newTask !== null) {
      taskTextNode.textContent = newTask;
      saveTodos();
    }
  }

  function saveTodos() {
    const todos = [];
    todoList.querySelectorAll(".todo-item").forEach((li) => {
      const taskWrapper = li.querySelector(".task-wrapper");
      const task = taskWrapper.childNodes[1].textContent; // second child is the text node
      const completed = li.classList.contains("completed");
      todos.push({ task, completed });
    });
    chrome.storage.local.set({ todos });
  }

  function loadTodos(todos) {
    todos.forEach((todo) => {
      const li = createTodoItem(todo.task, todo.completed);
      todoList.appendChild(li);
    });
  }

  function addPoints(points) {
    chrome.storage.local.get("totalPoints", (data) => {
      let existingPoints = data.totalPoints || 0;
      console.log(
        "existing points,",
        existingPoints,
        "points to add in",
        points,
        "total points",
        existingPoints + points
      );
      existingPoints += points;
      totalPoints = existingPoints;
      chrome.storage.local.set({ totalPoints: existingPoints }, () => {
        updatePointsDisplay();
      });
    });
  }

  function updatePointsDisplay() {
    pointsElement.textContent = totalPoints;
  }

  // Listen for changes in chrome.storage
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === "local") {
      if (changes.totalPoints) {
        totalPoints = changes.totalPoints.newValue;
        updatePointsDisplay();
      }
      if (changes.todos) {
        while (todoList.firstChild) {
          todoList.removeChild(todoList.firstChild);
        }
        loadTodos(changes.todos.newValue);
      }
    }
  });
});

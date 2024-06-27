document.addEventListener("DOMContentLoaded", function () {
  const todoList = document.getElementById("todo-list");
  const newTodoInput = document.getElementById("new-todo");
  const addTodoButton = document.getElementById("add-todo");

  addTodoButton.addEventListener("click", addTodo);
  newTodoInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      addTodo();
    }
  });

  function addTodo() {
    const task = newTodoInput.value.trim();
    if (task) {
      const li = document.createElement("li");
      li.classList.add("todo-item"); // Add a class to the list item for easier selection
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.addEventListener("change", toggleComplete);

      const deleteIcon = document.createElement("i");
      deleteIcon.classList.add(
        "fas",
        "fa-trash-alt",
        "todo-icon",
        "delete-icon"
      );
      deleteIcon.addEventListener("click", deleteTodo);

      const editIcon = document.createElement("i");
      editIcon.classList.add("fas", "fa-pencil-alt", "todo-icon", "edit-icon");
      editIcon.addEventListener("click", editTodo);

      li.appendChild(checkbox);
      li.appendChild(document.createTextNode(task));
      li.appendChild(deleteIcon);
      li.appendChild(editIcon);
      todoList.appendChild(li);
      newTodoInput.value = "";
      saveTodos();
    }
  }

  function toggleComplete(event) {
    const li = event.target.parentElement;
    li.classList.toggle("completed");
    saveTodos();
  }

  function deleteTodo(event) {
    const li = event.target.parentElement;
    li.remove();
    saveTodos();
  }

  function editTodo(event) {
    const li = event.target.parentElement;
    const taskText = li.childNodes[1];
    const newTask = prompt("Edit task:", taskText.textContent);
    if (newTask !== null) {
      taskText.textContent = newTask;
      saveTodos();
    }
  }

  function saveTodos() {
    const todos = [];
    todoList.querySelectorAll(".todo-item").forEach((li) => {
      const task = li.childNodes[1].textContent;
      const completed = li.classList.contains("completed");
      todos.push({ task, completed });
    });
    chrome.storage.local.set({ todos });
  }

  function loadTodos() {
    chrome.storage.local.get("todos", (data) => {
      if (data.todos) {
        data.todos.forEach((todo) => {
          const li = document.createElement("li");
          li.classList.add("todo-item"); // Add a class to the list item for easier selection
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.checked = todo.completed;
          if (todo.completed) {
            li.classList.add("completed");
          }
          checkbox.addEventListener("change", toggleComplete);

          const deleteIcon = document.createElement("i");
          deleteIcon.classList.add(
            "fas",
            "fa-trash-alt",
            "todo-icon",
            "delete-icon"
          );
          deleteIcon.addEventListener("click", deleteTodo);

          const editIcon = document.createElement("i");
          editIcon.classList.add(
            "fas",
            "fa-pencil-alt",
            "todo-icon",
            "edit-icon"
          );
          editIcon.addEventListener("click", editTodo);

          li.appendChild(checkbox);
          li.appendChild(document.createTextNode(todo.task));
          li.appendChild(deleteIcon);
          li.appendChild(editIcon);
          todoList.appendChild(li);
        });
      }
    });
  }

  loadTodos();
});

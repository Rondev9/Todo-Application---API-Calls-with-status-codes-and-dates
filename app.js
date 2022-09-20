const isValid = require("date-fns/isValid");
const format = require("date-fns/format");

const express = require("express");
const app = express();

const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

app.use(express.json());

const status_list = ["TO DO", "IN PROGRESS", "DONE"];
const priority_list = ["HIGH", "MEDIUM", "LOW"];
const category_list = ["WORK", "HOME", "LEARNING"];

const hasPriorityAndStatus = (queryObject) => {
  return queryObject.priority !== undefined && queryObject.status !== undefined;
};

const hasCategoryAndStatus = (queryObject) => {
  return queryObject.category !== undefined && queryObject.status !== undefined;
};

const hasCategoryAndPriority = (queryObject) => {
  return (
    queryObject.category !== undefined && queryObject.priority !== undefined
  );
};

const convertDbObjectToTodoObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen("6000", () => {
      console.log("*** Server is running at http://localhost:6000/ ***");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//API 1

app.get("/todos/", async (request, response) => {
  let getTodoQuery = "";
  const todoQueries = request.query;
  const key = Object.keys(todoQueries);
  if (key[0] === "status") {
    const { status } = todoQueries;
    if (status_list.includes(status) === false) {
      response.status(400);
      response.send("Invalid Todo Status");
    } else {
      getTodoQuery = `
        SELECT
        *
        FROM
            todo
        WHERE
            status = '${status}';`;
      const todoResponse = await db.all(getTodoQuery);
      response.send(
        todoResponse.map((eachTodo) => convertDbObjectToTodoObject(eachTodo))
      );
    }
  } else if (key[0] === "priority") {
    const { priority } = todoQueries;
    if (priority_list.includes(priority) === false) {
      response.status(400);
      response.send("Invalid Todo Priority");
    } else {
      getTodoQuery = `
        SELECT
        *
        FROM
            todo
        WHERE
            priority = '${priority}';`;
      const todoResponse = await db.all(getTodoQuery);
      response.send(
        todoResponse.map((eachTodo) => convertDbObjectToTodoObject(eachTodo))
      );
    }
  } else if (key[0] === "category") {
    const { category } = todoQueries;
    if (category_list.includes(category) === false) {
      response.status(400);
      response.send("Invalid Todo Category");
    } else {
      getTodoQuery = `
        SELECT
        *
        FROM
            todo
        WHERE
            category = '${category}';`;
      const todoResponse = await db.all(getTodoQuery);
      response.send(
        todoResponse.map((eachTodo) => convertDbObjectToTodoObject(eachTodo))
      );
    }
  } else if (key[0] === "date") {
    const { date } = todoQueries;
    if (isValid(new Date(date)) === false) {
      response.status(400);
      response.send("Invalid Due Date");
    }
  } else if (hasCategoryAndStatus(request.query)) {
    const { category, status } = todoQueries;
    getTodoQuery = `
        SELECT
        *
        FROM
            todo
        WHERE
            status = '${status}' AND category = '${category}';`;
    const todoResponse = await db.all(getTodoQuery);
    response.send(
      todoResponse.map((eachTodo) => convertDbObjectToTodoObject(eachTodo))
    );
  } else if (hasCategoryAndPriority(request.query)) {
    getTodoQuery = `
        SELECT
        *
        FROM
            todo
        WHERE
            category = '${category}' AND priority = '${priority}';`;
    const todoResponse = await db.all(getTodoQuery);
    response.send(
      todoResponse.map((eachTodo) => convertDbObjectToTodoObject(eachTodo))
    );
  } else if (hasPriorityAndStatus(request.query)) {
    getTodoQuery = `
        SELECT
        *
        FROM
            todo
        WHERE
            priority = '${priority}' AND status = '${status}';`;
    const todoResponse = await db.all(getTodoQuery);
    response.send(
      todoResponse.map((eachTodo) => convertDbObjectToTodoObject(eachTodo))
    );
  } else {
    const { search_q, priority, category, status } = todoQueries;
    const getTodoQuery = `
      SELECT
        *
      FROM
        todo
      WHERE
        todo LIKE '%${search_q}%';`;
    const todoResponse = await db.all(getTodoQuery);
    response.send(
      todoResponse.map((eachTodo) => convertDbObjectToTodoObject(eachTodo))
    );
  }
});

//API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoById = `
    SELECT
      *
    FROM
        todo
    WHERE
        Id = ${todoId};`;
  const todoDetails = await db.get(getTodoById);
  response.send(convertDbObjectToTodoObject(todoDetails));
});

// API 3

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isValid(new Date(date)) === false) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const getSpecificDateQuery = `
  SELECT
    *
  FROM
    todo
  WHERE
    due_date = '${date}';`;
    const dateTodo = await db.all(getSpecificDateQuery);
    response.send(convertDbObjectToTodoObject(dateTodo));
  }
});

//API 4

app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status, category, dueDate } = todoDetails;
  if (status_list.includes(status) === false) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (priority_list.includes(priority) === false) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (category_list.includes(category) === false) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (isValid(new Date(dueDate)) === false) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const addTodoQuery = `
    INSERT INTO
    todo (id, todo, priority, status, category, due_date)
    VALUES(
        ${id},
        '${todo}',
        '${priority}',
        '${status}',
        '${category}',
        '${dueDate}'
    );`;
    await db.run(addTodoQuery);
    response.send("Todo Successfully Added");
  }
});

// API 5

app.put("/todos/:todoId/", async (request, response) => {
  const todoDetails = request.body;
  const { todoId } = request.params;
  const key = Object.keys(todoDetails);
  if (key[0] === "todo") {
    const { todo } = todoDetails;
    const updateTodoQuery = `
    UPDATE 
        todo
    SET
        todo = '${todo}'
    WHERE
        id = ${todoId};`;
    await db.run(updateTodoQuery);
    response.send("Todo Updated");
  } else if (key[0] === "status") {
    const { status } = todoDetails;
    if (status_list.includes(status) === false) {
      response.status(400);
      response.send("Invalid Todo Status");
    } else {
      const updateTodoQuery = `
        UPDATE 
            todo
        SET
            status = '${status}'
        WHERE
            id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Status Updated");
    }
  } else if (key[0] === "priority") {
    const { priority } = todoDetails;
    if (priority_list.includes(priority) === false) {
      response.status(400);
      response.send("Invalid Todo Priority");
    } else {
      const updateTodoQuery = `
        UPDATE 
            todo
        SET
            priority = '${priority}'
        WHERE
            id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Priority Updated");
    }
  } else if (key[0] === "category") {
    const { category } = todoDetails;
    if (category_list.includes(category) === false) {
      response.status(400);
      response.send("Invalid Todo Category");
    } else {
      const updateTodoQuery = `
        UPDATE 
            todo
        SET
            category = '${category}'
        WHERE
            id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Category Updated");
    }
  } else if (key[0] === "dueDate") {
    const { dueDate } = todoDetails;
    if (isValid(new Date(dueDate)) === false) {
      response.status(400);
      response.send("Invalid Due Date");
    } else {
      const updateTodoQuery = `
        UPDATE 
            todo
        SET
            due_date = '${dueDate}'
        WHERE
            id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Due Date Updated");
    }
  }
});

// API 6

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE
    FROM
        todo
    WHERE
        id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;

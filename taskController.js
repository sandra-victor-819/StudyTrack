
import Task from "../models/Task.js";

// Get all tasks
export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find().sort({ dueDate: 1 });
    res.status(200).json(tasks);
  } catch (error) {
    console.error("Get tasks error:", error.message);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
};

// Create a new task
export const createTask = async (req, res) => {
  try {
    const { title, description, subject, dueDate, priority } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ message: "Task title is required" });
    }

    if (!dueDate || Number.isNaN(Date.parse(dueDate))) {
      return res.status(400).json({ message: "A valid due date is required" });
    }

    const task = await Task.create({
      title: title.trim(),
      description,
      subject,
      dueDate,
      priority
    });

    res.status(201).json(task);
  } catch (error) {
    console.error("Create task error:", error.message);

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Failed to create task" });
  }
};

// Update completion status or due date
export const updateTask = async (req, res) => {
  try {
    const { completed, dueDate } = req.body;
    const updates = {};

    if (Object.prototype.hasOwnProperty.call(req.body, "completed")) {
      if (typeof completed !== "boolean") {
        return res.status(400).json({
          message: "Completed must be true or false"
        });
      }

      updates.completed = completed;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "dueDate")) {
      if (
        typeof dueDate !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(dueDate) ||
        Number.isNaN(Date.parse(dueDate)) ||
        new Date(`${dueDate}T00:00:00.000Z`).toISOString().slice(0, 10) !== dueDate
      ) {
        return res.status(400).json({
          message: "Please provide a valid due date"
        });
      }

      updates.dueDate = dueDate;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "Provide a completion status or a new due date"
      });
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json(task);
  } catch (error) {
    console.error("Update task error:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Failed to update task" });
  }
};

// Delete a task
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete task error:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    res.status(500).json({ message: "Failed to delete task" });
  }
};

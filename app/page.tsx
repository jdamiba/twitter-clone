"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/nextjs";

type Task = {
  id: number;
  text: string;
  completed: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
};

type SortOption = "priority" | "created_at";

export default function Home() {
  const { isSignedIn } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("created_at");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("isSignedIn changed:", isSignedIn);
    if (isSignedIn) {
      fetchTasks();
    }
  }, [isSignedIn]);

  const fetchTasks = async () => {
    console.log("Fetching tasks...");
    try {
      const response = await fetch("/api/todos");
      console.log("Fetch response:", response);
      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Fetched tasks data:", data);
      setTasks(data.tasks || []);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError("Failed to fetch tasks. Please try again.");
    }
  };

  const addTask = async () => {
    if (newTask.trim()) {
      console.log("Adding new task:", newTask);
      try {
        const response = await fetch("/api/todos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: newTask.trim(), priority: 1 }),
        });
        console.log("Add task response:", response);
        if (!response.ok) {
          throw new Error(`Failed to add task: ${response.statusText}`);
        }
        const data = await response.json();
        console.log("Added task data:", data);
        if (data.task) {
          setTasks([data.task, ...tasks]);
          setNewTask("");
        } else {
          console.warn("No task returned from server");
        }
      } catch (err) {
        console.error("Error adding task:", err);
        setError("Failed to add task. Please try again.");
      }
    }
  };

  const removeTask = async (id: number) => {
    console.log("Removing task:", id);
    try {
      const response = await fetch("/api/todos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      console.log("Remove task response:", response);
      if (!response.ok) {
        throw new Error(`Failed to remove task: ${response.statusText}`);
      }
      setTasks(tasks.filter((task) => task.id !== id));
    } catch (err) {
      console.error("Error removing task:", err);
      setError("Failed to remove task. Please try again.");
    }
  };

  const updateTask = async (id: number, updates: Partial<Task>) => {
    console.log("Updating task:", id, updates);
    try {
      const response = await fetch("/api/todos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      console.log("Update task response:", response);
      if (!response.ok) {
        throw new Error(`Failed to update task: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Updated task data:", data);
      if (data.task) {
        setTasks(tasks.map((task) => (task.id === id ? data.task : task)));
      } else {
        console.warn("No task returned from server");
      }
    } catch (err) {
      console.error("Error updating task:", err);
      setError("Failed to update task. Please try again.");
    }
  };

  const toggleComplete = (id: number, completed: boolean) => {
    updateTask(id, { completed });
  };

  const changePriority = (id: number, priority: number) => {
    updateTask(id, { priority });
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      addTask();
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (sortBy === "priority") {
      return b.priority - a.priority;
    } else {
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
  });

  console.log("Rendering with tasks:", tasks);

  if (!isSignedIn) {
    console.log("User not signed in");
    return <div>Please sign in to view and manage your tasks.</div>;
  }

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">My To-Do List</h1>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <div className="flex mb-4">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-grow p-2 border rounded-l text-black placeholder-black mr-2"
          placeholder="Add a new task"
        />
        <button
          onClick={addTask}
          className="bg-blue-500 text-white px-4 py-2 rounded-r"
        >
          Add
        </button>
      </div>

      <div className="mb-4">
        <label className="mr-2">Sort by:</label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="p-2 border rounded text-black"
        >
          <option value="created_at">Time Created</option>
          <option value="priority">Priority</option>
        </select>
      </div>

      <AnimatePresence>
        <motion.ul className="space-y-2">
          {sortedTasks.map((task) => (
            <motion.li
              key={task.id}
              layout
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-between bg-gray-100 p-2 rounded text-black"
            >
              <div className="flex items-center flex-grow mr-2">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleComplete(task.id, !task.completed)}
                  className="mr-2"
                />
                <span
                  className={`flex-grow ${
                    task.completed ? "line-through text-gray-500" : ""
                  }`}
                >
                  {task.text}
                </span>
              </div>
              <div className="flex items-center">
                <select
                  value={task.priority}
                  onChange={(e) =>
                    changePriority(task.id, Number(e.target.value))
                  }
                  className="mr-2 p-1 border rounded text-sm"
                >
                  <option value="1">Low</option>
                  <option value="2">Medium</option>
                  <option value="3">High</option>
                </select>
                <button
                  onClick={() =>
                    updateTask(task.id, {
                      text: prompt("Edit task:", task.text) || task.text,
                    })
                  }
                  className="text-blue-500 hover:text-blue-700 mr-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => removeTask(task.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </AnimatePresence>
    </>
  );
}

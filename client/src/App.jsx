
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "/api/tasks";

function getLocalDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDueDate(task) {
  if (!task.dueDate) return "";
  return String(task.dueDate).slice(0, 10);
}

function getStatus(task, today) {
  if (task.completed) return "Completed";

  const dueDate = getDueDate(task);

  if (dueDate < today) return "Overdue";
  if (dueDate === today) return "Due today";
  return "Upcoming";
}

function App() {
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Medium");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [editingDeadlineId, setEditingDeadlineId] = useState(null);
  const [deadlineDraft, setDeadlineDraft] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const today = getLocalDate();

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setError("");

        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error("Could not load assignments.");
        }

        const data = await response.json();
        setTasks(data);
      } catch {
        setError(
          "Unable to connect to the server. Make sure the backend is running."
        );
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  const completed = tasks.filter((task) => task.completed).length;

  const needsAttention = tasks.filter(
    (task) => !task.completed && getDueDate(task) <= today
  ).length;

  const progress = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0;

  const addTask = async (event) => {
    event.preventDefault();

    if (!title.trim() || !dueDate || saving) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: title.trim(),
          subject: subject.trim() || "General",
          description: "",
          dueDate,
          priority
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not save assignment.");
      }

      setTasks((previousTasks) => [...previousTasks, data]);
      setTitle("");
      setSubject("");
      setDueDate("");
      setPriority("Medium");
      setShowForm(false);
      setSuccess("Assignment added successfully.");
    } catch (err) {
      setError(err.message || "Unable to save assignment.");
    } finally {
      setSaving(false);
    }
  };

  const toggleTask = async (task) => {
    if (updatingId || deletingId) return;

    try {
      setUpdatingId(task._id);
      setError("");
      setSuccess("");

      const response = await fetch(`${API_URL}/${task._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          completed: !task.completed
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not update assignment.");
      }

      setTasks((previousTasks) =>
        previousTasks.map((item) =>
          item._id === data._id ? data : item
        )
      );

      setSuccess(
        data.completed
          ? "Assignment marked as completed."
          : "Assignment marked as incomplete."
      );
    } catch (err) {
      setError(err.message || "Unable to update assignment.");
    } finally {
      setUpdatingId(null);
    }
  };

  const saveDeadline = async (task) => {
    if (!deadlineDraft || updatingId || deletingId) return;

    try {
      setUpdatingId(task._id);
      setError("");
      setSuccess("");

      const response = await fetch(`${API_URL}/${task._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          dueDate: deadlineDraft
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not update deadline.");
      }

      setTasks((previousTasks) =>
        previousTasks.map((item) =>
          item._id === data._id ? data : item
        )
      );

      setEditingDeadlineId(null);
      setDeadlineDraft("");
      setSuccess("Assignment deadline updated successfully.");
    } catch (err) {
      setError(err.message || "Unable to update deadline.");
    } finally {
      setUpdatingId(null);
    }
  };

  const cancelDeadlineEdit = () => {
    setEditingDeadlineId(null);
    setDeadlineDraft("");
  };

  const deleteTask = async (task) => {
    if (updatingId || deletingId) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${task.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(task._id);
      setError("");
      setSuccess("");

      const response = await fetch(`${API_URL}/${task._id}`, {
        method: "DELETE"
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not delete assignment.");
      }

      setTasks((previousTasks) =>
        previousTasks.filter((item) => item._id !== task._id)
      );

      if (editingDeadlineId === task._id) {
        cancelDeadlineEdit();
      }

      setSuccess("Assignment deleted successfully.");
    } catch (err) {
      setError(err.message || "Unable to delete assignment.");
    } finally {
      setDeletingId(null);
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    const statusOrder = {
      Overdue: 0,
      "Due today": 1,
      Upcoming: 2,
      Completed: 3
    };

    const statusDifference =
      statusOrder[getStatus(a, today)] -
      statusOrder[getStatus(b, today)];

    if (statusDifference !== 0) {
      return statusDifference;
    }

    const priorityOrder = { High: 0, Medium: 1, Low: 2 };

    const priorityDifference =
      (priorityOrder[a.priority] ?? 1) -
      (priorityOrder[b.priority] ?? 1);

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    return getDueDate(a).localeCompare(getDueDate(b));
  });

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">S</div>
          <div>
            <h2>StudyTrack</h2>
            <p>SMART STUDENT PLANNER</p>
          </div>
        </div>

        <div className="nav-label">WORKSPACE</div>
        <div className="nav-item active">▦ &nbsp; My Dashboard</div>
        <div className="nav-item">▤ &nbsp; My Assignments</div>

        <div className="sidebar-bottom">
          <div className="focus-card">
            <span>✦ YOUR FOCUS</span>
            <h3>Small steps.</h3>
            <h3>Big progress.</h3>
            <p>Every task completed is a step forward.</p>
          </div>

          <div className="profile">
            <div className="avatar">S</div>
            <div>
              <strong>Student Workspace</strong>
              <p>Your learning journey</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="breadcrumb">Workspace / Dashboard</span>
            <h1>
              My Dashboard <span>✦</span>
            </h1>
            <p className="subtitle">
              A little progress every day adds up.
            </p>
          </div>

          <button
            className="primary-button"
            type="button"
            onClick={() => setShowForm(!showForm)}
          >
            + Add assignment
          </button>
        </header>

        <section className="welcome-banner">
          <div>
            <span className="eyebrow">YOUR SPACE TO SUCCEED</span>
            <h2>Make today count.</h2>
            <p>
              Keep your assignments organised and your goals within reach.
            </p>
          </div>

          <div className="banner-art" aria-hidden="true">
            <div className="orbit orbit-one"></div>
            <div className="orbit orbit-two"></div>
            <div className="art-star">✦</div>
            <div className="art-check">✓</div>
          </div>
        </section>

        {error && (
          <div className="message-box error-message" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="message-box success-message" role="status">
            {success}
          </div>
        )}

        <section className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon purple">▤</span>
            <p>Total assignments</p>
            <h2>{tasks.length}</h2>
            <span className="stat-note">Across all subjects</span>
          </div>

          <div className="stat-card">
            <span className="stat-icon green">✓</span>
            <p>Completed</p>
            <h2>{completed}</h2>
            <span className="stat-note">One step at a time</span>
          </div>

          <div className="stat-card">
            <span className="stat-icon orange">◷</span>
            <p>Needs attention</p>
            <h2>{needsAttention}</h2>
            <span className="stat-note">Due today or overdue</span>
          </div>

          <div className="stat-card">
            <span className="stat-icon blue">↗</span>
            <p>Progress</p>
            <h2>{progress}%</h2>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </section>

        {showForm && (
          <section className="task-form-card">
            <div className="section-heading">
              <div>
                <h2>New assignment</h2>
                <p>Add the details to keep your work on track.</p>
              </div>

              <button
                className="close-button"
                onClick={() => setShowForm(false)}
                type="button"
                aria-label="Close form"
              >
                ✕
              </button>
            </div>

            <form onSubmit={addTask} className="task-form">
              <label>
                Assignment title *
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Data Structures assignment"
                  maxLength={100}
                  required
                />
              </label>

              <label>
                Subject
                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="e.g. Computer Science"
                />
              </label>

              <label>
                Due date *
                <input
                  type="date"
                  value={dueDate}
                  min="2000-01-01"
                  onChange={(event) => setDueDate(event.target.value)}
                  required
                />
              </label>

              <label>
                Priority
                <select
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </label>

              <button
                className="primary-button form-submit"
                type="submit"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save assignment"}
              </button>
            </form>
          </section>
        )}

        <section className="assignments-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">STAY ON TOP OF YOUR WORK</span>
              <h2>Your assignments</h2>
              <p>
                Urgent deadlines first, followed by priority and due date.
              </p>
            </div>

            <span className="task-count">{tasks.length} total</span>
          </div>

          {loading ? (
            <div className="empty-state">
              <h3>Loading your assignments...</h3>
              <p>Connecting to your StudyTrack workspace.</p>
            </div>
          ) : sortedTasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✧</div>
              <h3>Your fresh start begins here</h3>
              <p>No assignments yet. Add your first task and make a plan.</p>
              <button
                className="secondary-button"
                type="button"
                onClick={() => setShowForm(true)}
              >
                + Create your first assignment
              </button>
            </div>
          ) : (
            <div className="task-list">
              {sortedTasks.map((task) => {
                const status = getStatus(task, today);
                const busy =
                  updatingId === task._id || deletingId === task._id;

                return (
                  <article
                    className={`task-card ${
                      task.completed ? "is-complete" : ""
                    }`}
                    key={task._id}
                  >
                    <button
                      className={`task-check ${
                        task.completed ? "checked" : ""
                      }`}
                      type="button"
                      onClick={() => toggleTask(task)}
                      disabled={
                        busy ||
                        Boolean(updatingId) ||
                        Boolean(deletingId)
                      }
                      aria-label={
                        task.completed
                          ? "Mark incomplete"
                          : "Mark completed"
                      }
                    >
                      {updatingId === task._id
                        ? "…"
                        : task.completed
                          ? "✓"
                          : ""}
                    </button>

                    <div className="task-details">
                      <h3>{task.title}</h3>
                      <p>
                        {task.subject || "General"} · Due {getDueDate(task)}
                      </p>

                      {editingDeadlineId === task._id ? (
                        <div className="deadline-editor">
                          <input
                            type="date"
                            value={deadlineDraft}
                            min="2000-01-01"
                            onChange={(event) =>
                              setDeadlineDraft(event.target.value)
                            }
                            aria-label="New assignment deadline"
                          />

                          <button
                            className="save-deadline-btn"
                            type="button"
                            onClick={() => saveDeadline(task)}
                            disabled={
                              !deadlineDraft || updatingId === task._id
                            }
                          >
                            {updatingId === task._id
                              ? "Saving..."
                              : "Save date"}
                          </button>

                          <button
                            className="cancel-deadline-btn"
                            type="button"
                            onClick={cancelDeadlineEdit}
                            disabled={updatingId === task._id}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          className="edit-deadline-btn"
                          type="button"
                          onClick={() => {
                            setEditingDeadlineId(task._id);
                            setDeadlineDraft(getDueDate(task));
                            setError("");
                            setSuccess("");
                          }}
                          disabled={
                            Boolean(updatingId) || Boolean(deletingId)
                          }
                        >
                          Edit deadline
                        </button>
                      )}
                    </div>

                    <span
                      className={`priority priority-${(
                        task.priority || "Medium"
                      ).toLowerCase()}`}
                    >
                      {task.priority || "Medium"}
                    </span>

                    <span
                      className={`status status-${status
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {status}
                    </span>

                    <button
                      className="delete-task-btn"
                      type="button"
                      onClick={() => deleteTask(task)}
                      disabled={
                        Boolean(updatingId) || Boolean(deletingId)
                      }
                      aria-label={`Delete ${task.title}`}
                      title="Delete assignment"
                    >
                      {deletingId === task._id ? "Deleting..." : "Delete"}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="footer">
          <span>StudyTrack ✦</span>
          <span>Plan with purpose. Learn with confidence.</span>
        </footer>
      </main>
    </div>
  );
}

export default App;

# 🌟 Aura Productivity

**Aura** is a gamified productivity application designed to help you stay focused, manage tasks, and build consistent habits. It combines a powerful **Task Manager** with a customizable **Pomodoro Timer**, wrapped in a beautiful, dark-mode-ready interface with XP rewards and leaderboards.

## ✨ Features

### 📝 Smart Task Management
* **ToDo List:** Add tasks with optional due dates and specific times.
* **Intelligent Reminders:** Triggers audio alarms and visual notifications when a task is due.
* **Filtering:** Easily toggle between All, Active, and Completed tasks.
* **Task Linking:** Link a specific task to the timer to start a "Focus Session" for that item.
* **Rewards:** Earn points for completing tasks, with bonuses for finishing before the deadline.

### ⏱️ Focus Timer (Pomodoro)
* **Customizable Modes:** Work (Focus), Short Break, and Long Break intervals.
* **Visual Progress:** Features a circular progress ring with smooth animations.
* **Session History:** Tracks recent sessions, duration, and labels.
* **Configurable Settings:** Adjust timer durations directly from the settings menu.

### 🎮 Gamification & Social
* **XP System:** Earn points for productivity actions (e.g., +50 points for a focus session, +20 for tasks).
* **Streaks:** Tracks daily activity streaks to encourage consistency.
* **Global Contest:** A simulated leaderboard to view rankings and compete with other users.
* **User Profiles:** View your total points, current streak, and rank.

### 🎨 Modern UI/UX
* **Adaptive Theme:** One-click toggle between **Light Mode** and **Dark Mode**.
* **Glassmorphism:** Modern aesthetic with backdrop blur effects.
* **Interactive Elements:** Includes confetti celebrations and toast notifications.
* **PWA Support:** Installable on mobile and desktop devices via `manifest.json` and Service Workers.

---

## 🛠️ Tech Stack

* **Core:** HTML5, CSS3, Vanilla JavaScript (ES6+)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) (via CDN)
* **Icons:** [Lucide Icons](https://lucide.dev/)
* **Effects:** [Canvas Confetti](https://www.kirilv.com/canvas-confetti/)
* **Storage:** `localStorage` (No backend required; data persists in the browser)

---

## 🚀 Getting Started

Since Aura is built with vanilla web technologies, you don't need a complex build step.

### Prerequisites
You need a modern web browser (Chrome, Firefox, Safari, Edge).

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/yourusername/aura-productivity.git](https://github.com/yourusername/aura-productivity.git)
    cd aura-productivity
    ```

2.  **Run the application:**
    * **Option A (Simple):** Double-click `index.html` to open it in your browser.
    * **Option B (Recommended for PWA):** Use a local static server to ensure the Service Worker functions correctly.
        ```bash
        # If you have Python installed:
        python -m http.server 8000
        # Then open http://localhost:8000
        ```

---

## 📖 User Guide

### 1. Account & Profile
* **Sign Up/Login:** When you open the app, enter a username to create a local profile. This tracks your points and streaks.
* **View Profile:** Click the user icon in the top right to see your total XP and current streak.

### 2. Managing Tasks
* **Add a Task:** Type your task in the input field. Optionally, click the Calendar or Clock icons to set a deadline.
* **Reminders:** If you set a time, Aura will play a sound and show a notification when the task is due.
* **Complete Task:** Click the circle/check button to finish a task.
    * **Standard Reward:** +20 Points.
    * **Early Bird Bonus:** +50 Points (if completed before the deadline).

### 3. Using the Focus Timer
* **Start Focus:** Navigate to the "Focus" tab. Click the **Play** button to start the timer.
* **Link Task:** From the Task list, click the small "Play" icon next to a task to automatically switch to the timer and tag that task.
* **Rewards:** Completing a full "Focus" session awards **+50 Points**. Breaks do not award points.
* **Settings:** Click the "Gear" icon to change the duration of Focus, Short Break, and Long Break modes.

### 4. Leaderboard (Contest)
* Navigate to the **Contest** tab to see the leaderboard.
* You will see your rank compared to other (simulated) users. Your rank is determined by your total XP.

---

## 🤝 Contribution

Contributions are welcome! If you'd like to improve Aura, please follow these guidelines:

### How to Contribute
1.  **Fork the Project:** Create your own copy of the repository.
2.  **Create your Feature Branch:** `git checkout -b feature/AmazingFeature`
3.  **Commit your Changes:** `git commit -m 'Add some AmazingFeature'`
4.  **Push to the Branch:** `git push origin feature/AmazingFeature`
5.  **Open a Pull Request:** Describe your changes and submit them for review.

### Development Notes
* **Styling:** We use **Tailwind CSS** via CDN. Please stick to Tailwind utility classes for styling changes.
* **Icons:** Use **Lucide Icons** names for any new iconography.
* **Storage:** All data is currently handled via `localStorage`. If you are adding new features, ensure they persist data correctly using the existing patterns in `app.js` or `pomodoro.js`.

---

Made with ❤️ and Focus.

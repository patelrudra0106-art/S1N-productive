# S1N Productivity App 🚀

A comprehensive productivity application featuring Task Management, Pomodoro Timer, Analytics, and a Gamified Social Shop.

## 🌟 Features

* **Task Management**: Add, complete, and delete tasks with due dates.
* **Focus Timer**: Customizable Pomodoro timer (Work/Short Break/Long Break).
* **Gamification**: Earn points for completing tasks and finishing focus sessions.
* **Shop System**: Spend points on virtual badges (Crown, Star, Fire, etc.).
* **Social Leaderboard**: Compete globally or with friends. Badges appear on the leaderboard.
* **Analytics**: View daily, weekly, and monthly performance reports.
* **PWA Support**: Installable on mobile and desktop.

## 📂 Project Structure

* `index.html` - Main application entry point and UI structure.
* `style.css` - Custom styles and animations (works with Tailwind CSS).
* `app.js` - Core task management logic.
* `auth.js` - User authentication, inventory management, and Firebase sync.
* `profile.js` - Profile stats, badge rendering, and local state management.
* `shop.js` - Item catalog and purchasing logic.
* `social.js` - Leaderboard rendering and friend system.
* `pomodoro.js` - Timer logic and state.
* `reports.js` - Charts and analytics calculation.
* `notifications.js` - Toast notification system.
* `service-worker.js` - Offline caching configuration.
* `manifest.json` - PWA installation metadata.

## 🛠️ Setup Instructions

1.  **Firebase Setup**:
    * Go to [Firebase Console](https://console.firebase.google.com/).
    * Create a new project.
    * Enable **Realtime Database**.
    * Copy your config keys into `index.html` (replace the existing `firebaseConfig` object).

2.  **Database Rules**:
    To ensure users cannot cheat (e.g., give themselves 1 million points), use these rules in your Firebase Console > Realtime Database > Rules tab:

    ```json
    {
      "rules": {
        ".read": true,
        ".write": "auth != null",
        "users": {
          "$uid": {
            ".read": true,
            ".write": true
          }
        },
        "system": {
          ".read": true,
          ".write": false
        }
      }
    }
    ```
    *(Note: For production, you should lock down `.write` permissions further).*

3.  **Running Locally**:
    * You can open `index.html` directly in a browser.
    * For PWA features (Service Worker) to work, you must serve the files over **HTTPS** or **localhost**.
    * Use a simple server like VS Code "Live Server" extension or Python:
        ```bash
        python -m http.server 8000
        ```

## 🎮 How to Play

1.  **Sign Up**: Create an account to start syncing data.
2.  **Earn Points**:
    * Complete a Task: **+10 Points**
    * Finish a Focus Session: **+50 Points**
3.  **Shop**: Go to the **Shop Tab** and buy a badge (e.g., Golden Crown for 1000 pts).
4.  **Show Off**: Check the **Contest Tab**. Your new badge will appear next to your name!

---

**Developed by Patel Rudra
               Pingale kavan**

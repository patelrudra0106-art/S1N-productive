# Aura-productive
To-Do &amp; Pomodoro Focus App TaskFlow is a simple and productivity-focused web application that combines a To-Do Task Manager with a Pomodoro Focus Timer to help users plan tasks and stay focused while working. The app links tasks directly with focus sessions, encouraging better time management and deep work.

🌟 Aura Tasks & Focus
Aura Tasks & Focus is a modern productivity web app that combines a smart to-do list with a Pomodoro focus timer. It helps users organize tasks, stay focused, build daily streaks, and track productivity — all with a clean, minimal UI.
Built using HTML, Tailwind CSS, and Vanilla JavaScript, Aura also works as a Progressive Web App (PWA) and supports offline usage.

🚀 Features
✅ Task Management
Add, edit, and delete tasks
Mark tasks as completed
Attach date & time reminders
Filter tasks:
All
Active
Completed
Persistent storage using localStorage

⏰ Pomodoro Focus Timer
Focus, Short Break, and Long Break modes
Circular animated progress ring
Start, pause, and reset timer
Customizable timer durations
Session completion celebration 🎉

🎯 Task-Focused Sessions
Start a focus session directly from a task
See the active task while focusing
Automatically log completed focus sessions

🔥 Productivity Tracking
Daily streak system
Session count & total focused minutes
Focus history log
Confetti rewards for task completion & sessions

🌙 UI & Experience
Light & Dark mode (system-aware + manual toggle)
Smooth animations & transitions
Responsive mobile-first design
Glassmorphism & modern UI elements
📱 Progressive Web App (PWA)
Installable on mobile & desktop
Offline support via Service Worker
App manifest included

🛠️ Tech Stack
HTML5
Tailwind CSS
Vanilla JavaScript
Lucide Icons
Canvas Confetti
LocalStorage API
Service Workers (PWA)

📂 Project Structure

aura-tasks-focus/
│
├── index.html          # Main HTML file
├── styles.css          # Custom styles & animations
├── app.js              # Task & reminder logic
├── pomodoro.js         # Pomodoro timer logic
├── manifest.json       # PWA configuration
├── service-worker.js   # Offline caching
└── README.md           # Project documentation

⚙️ How to Run Locally
1.Clone the repository:

Bash
git clone https://github.com/your-username/aura-tasks-focus.git

2.Open the project folder:
Bash
cd aura-tasks-focus

3.Run using a local server (recommended for PWA):
Bash
npx serve
or use Live Server in VS Code.

4.Open in browser:

http://localhost:3000

🔔 Notifications & Reminders
Uses the Notification API
Requests permission on first load
Plays an alarm sound when a task reminder triggers
⚠️ Notifications may not work on some browsers unless served via HTTPS.
🧠 Future Enhancements
Cloud sync / login system
Task categories & priorities
Weekly productivity charts
Sound customization
Focus statistics export

👨‍💻 Author
Rudra Patel
Web Developer | Frontend Enthusiast
Built with ❤️ and focus

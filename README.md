# UniFlow — University Student Success Dashboard

A professional, 3-column SaaS task and lecture management system with full MongoDB integration, built with React + TypeScript + Node.js.

## 🚀 How to Run Locally

**Easy start**: Double-click `start.bat` in the project root.

Or manually:

```bash
# 1. Backend (port 5000)
cd server
node server.js

# 2. Frontend (port 5173) — in a new terminal
npm run dev
```

Then open **http://localhost:5173**

## ☁️ Deploying to Vercel

1. Push this repository to GitHub
2. Import it in [Vercel](https://vercel.com)
3. Add this environment variable in Vercel → Project Settings → Environment Variables:
   - `MONGODB_URI` = your MongoDB Atlas connection string
4. Deploy!

## 🛠 Features

- **3-Column SaaS Dashboard**: Weekly Schedule, Upcoming Tasks, and Progress
- **Real-time MongoDB**: Full CRUD for Tasks and Schedule collections
- **Professional UI**: Dark Navy + Off-White palette, Inter font, smooth animations
- **Mobile Responsive**: Hamburger menu, adaptive sidebar, stacked layout on mobile
- **Toast Notifications**: Success/error feedback for every action
- **Deployment Ready**: `vercel.json` pre-configured for full-stack deployment

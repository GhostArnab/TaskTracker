# Task Tracker (HTML/CSS/JS)

A lightweight, single‑page task tracker built with **vanilla HTML/CSS/JavaScript**.
Data is stored locally in the browser via `localStorage`, so no backend is required.

## 🌐 Live Demo
[View Live](https://ghostarnab.github.io/TaskTracker/)

## ✅ Features
- Add tasks (title + optional description)
- Filter tasks (All / Active / Completed)
- Toggle task status (pending / done)
- Edit task title/description
- Delete tasks
- Clear all completed tasks
- Responsive layout (mobile-ready)

## 🚀 Run locally
1. Open `index.html` in your browser.
2. Or run a local dev server (recommended):

```bash
# If you have Node.js installed
npx serve .
```

## 📦 Deploy
### GitHub Pages (Recommended)
1. Push this project to GitHub.
2. Go to repo **Settings** → **Pages**.
3. Under **Source**, select **"Deploy from a branch"**.
4. Choose **Branch: master**, **Folder: /(root)**.
5. Click **Save** — your site will be live at `https://yourusername.github.io/repo-name/`.

### Vercel
1. Push this project to GitHub.
2. Install the [Vercel CLI](https://vercel.com/download) (optional):

```bash
npm i -g vercel
```

3. Deploy:

```bash
vercel
```

### Netlify
1. Push this project to GitHub.
2. Go to https://app.netlify.com/sites/new
3. Select your repo and deploy (no build step needed).

## 🛠️ Customization
- Update styles in `styles.css`
- Add new features in `app.js` (e.g., due dates, filtering, drag-and-drop)

---

Happy building! 🎉

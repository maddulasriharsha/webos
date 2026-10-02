# NebulaOS ✦

A personal operating system that runs in your browser, built for Hack Club's **WebOS 1** workshop with React + TypeScript + Vite.

## Features
- Welcome screen, boot sequence, **lock screen** (click to unlock — no password), power menu (lock / restart / shut down)
- Draggable, resizable, minimizable windows with **maximize and edge-snapping**; open windows are remembered across refreshes
- Apps: About Me, Files, Terminal, Paint, Notes, Calculator, Snake, Settings
- Shared virtual file system — browse it in Files or with `ls`, `cd`, `cat`, `tree` in the Terminal
- 4 themes, a wallpaper picker (presets or your own image)
- **Spotlight** search (Ctrl+Space), right-click desktop menu, toast notifications

## Run it
```bash
npm install
npm run dev
```

## Make it yours
Edit the `ME` object at the top of `src/apps.tsx` (name, bio, skills, projects, links) and the files in `src/fs.ts`.

## Deploy
Push to GitHub, then in **Settings → Pages** set the source to **GitHub Actions**. The workflow in `.github/workflows/deploy.yml` builds and publishes the site on every push.

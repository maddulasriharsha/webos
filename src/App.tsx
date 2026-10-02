import { useEffect, useState } from "react";
import Window, { type WinState } from "./Window";
import { About, Calculator, Notes, Settings, Snake, Terminal, ME, applyTheme, type AppDef } from "./apps";

const APPS: AppDef[] = [
  { id: "about", title: "About Me", icon: "🧑‍🚀", w: 480, h: 440, render: () => <About /> },
  { id: "terminal", title: "Terminal", icon: "💻", w: 520, h: 340, render: ({ open }) => <Terminal open={open} /> },
  { id: "notes", title: "Notes", icon: "📝", w: 380, h: 320, render: () => <Notes /> },
  { id: "calc", title: "Calculator", icon: "🧮", w: 340, h: 440, render: () => <Calculator /> },
  { id: "snake", title: "Snake", icon: "🐍", w: 400, h: 430, render: () => <Snake /> },
  { id: "settings", title: "Settings", icon: "⚙️", w: 400, h: 340, render: ({ closeAll }) => <Settings onReset={closeAll} /> },
];

function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span>
      {now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })} ·{" "}
      {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    </span>
  );
}

function Welcome({ onEnter }: { onEnter: () => void }) {
  const full = `Welcome, traveller. I'm ${ME.name}.`;
  const [n, setN] = useState(0);
  useEffect(() => {
    if (n >= full.length) return;
    const t = setTimeout(() => setN(n + 1), 45);
    return () => clearTimeout(t);
  }, [n, full.length]);
  return (
    <div className="welcome">
      <div className="stars" />
      <div className="welcome-card">
        <div className="orb" />
        <h1>Nebula<span>OS</span></h1>
        <p>{full.slice(0, n)}</p>
        <button className="boot-btn" onClick={onEnter}>BOOT SYSTEM</button>
      </div>
    </div>
  );
}

let zCounter = 1;

export default function App() {
  const [booted, setBooted] = useState(false);
  const [wins, setWins] = useState<WinState[]>([]);
  const [focus, setFocus] = useState<string | null>(null);

  useEffect(() => {
    applyTheme(localStorage.getItem("nebula-theme") ?? "nebula");
  }, []);

  const bringToFront = (id: string) => {
    setFocus(id);
    setWins((ws) => ws.map((w) => (w.id === id ? { ...w, z: ++zCounter, minimized: false } : w)));
  };

  const open = (id: string) => {
    const app = APPS.find((a) => a.id === id || (id === "terminal" && a.id === "terminal"));
    if (!app) return;
    if (wins.some((w) => w.id === app.id)) return bringToFront(app.id);
    const off = (wins.length % 6) * 28;
    const w = Math.min(app.w, window.innerWidth - 20);
    const h = Math.min(app.h, window.innerHeight - 120);
    setWins((ws) => [
      ...ws,
      { id: app.id, title: app.title, icon: app.icon, x: Math.max(10, 140 + off), y: 60 + off, w, h, z: ++zCounter, minimized: false },
    ]);
    setFocus(app.id);
  };

  const patch = (id: string, p: Partial<WinState>) => setWins((ws) => ws.map((w) => (w.id === id ? { ...w, ...p } : w)));
  const close = (id: string) => setWins((ws) => ws.filter((w) => w.id !== id));
  const closeAll = () => setWins([]);

  if (!booted) return <Welcome onEnter={() => setBooted(true)} />;

  const focusedWin = wins.find((w) => w.id === focus && !w.minimized);

  return (
    <div className="desktop">
      <header className="topbar">
        <span className="brand">✦ NEBULA<b>OS</b></span>
        <span className="active-title">{focusedWin ? focusedWin.title : "Desktop"}</span>
        <Clock />
      </header>

      <div className="icons">
        {APPS.map((a) => (
          <button key={a.id} className="desk-icon" onDoubleClick={() => open(a.id)} onClick={() => window.innerWidth < 700 && open(a.id)}>
            <span className="ico">{a.icon}</span>
            {a.title}
          </button>
        ))}
      </div>

      {wins.map((w) => {
        const app = APPS.find((a) => a.id === w.id)!;
        return (
          <Window
            key={w.id}
            win={w}
            focused={focus === w.id}
            onFocus={() => bringToFront(w.id)}
            onClose={() => close(w.id)}
            onMinimize={() => {
              patch(w.id, { minimized: true });
              setFocus(null);
            }}
            onChange={(p) => patch(w.id, p)}
          >
            {app.render({ open, closeAll })}
          </Window>
        );
      })}

      <nav className="dock">
        {APPS.map((a) => {
          const w = wins.find((x) => x.id === a.id);
          return (
            <button
              key={a.id}
              title={a.title}
              className={`dock-item${w ? " open" : ""}${w?.minimized ? " min" : ""}`}
              onClick={() => (w && !w.minimized && focus === a.id ? patch(a.id, { minimized: true }) : open(a.id))}
            >
              {a.icon}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

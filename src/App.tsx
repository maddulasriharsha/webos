import { useEffect, useState } from "react";
import Window, { type Rect, type WinState } from "./Window";
import { BootScreen, ContextMenu, LockScreen, OffScreen, PowerMenu, Spotlight, Toasts, type SpotItem, type Toast } from "./system";
import { About, Calculator, Files, Notes, Paint, Settings, Snake, Terminal, ME, applyTheme, applyWallpaper, type AppDef } from "./apps";

const APPS: AppDef[] = [
  { id: "about", title: "About Me", icon: "🧑‍🚀", w: 480, h: 440, render: () => <About /> },
  { id: "files", title: "Files", icon: "📁", w: 480, h: 380, render: ({ open }) => <Files open={open} /> },
  { id: "terminal", title: "Terminal", icon: "💻", w: 520, h: 340, render: ({ open }) => <Terminal open={open} /> },
  { id: "paint", title: "Paint", icon: "🎨", w: 560, h: 460, render: () => <Paint /> },
  { id: "notes", title: "Notes", icon: "📝", w: 380, h: 320, render: () => <Notes /> },
  { id: "calc", title: "Calculator", icon: "🧮", w: 340, h: 440, render: () => <Calculator /> },
  { id: "snake", title: "Snake", icon: "🐍", w: 400, h: 430, render: ({ notify }) => <Snake notify={notify} /> },
  { id: "settings", title: "Settings", icon: "⚙️", w: 420, h: 480, render: ({ closeAll }) => <Settings onReset={closeAll} /> },
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

const WINS_KEY = "nebula-wins";

function loadWins(): WinState[] {
  try {
    const saved = JSON.parse(localStorage.getItem(WINS_KEY) ?? "[]") as WinState[];
    const wins = saved.flatMap((w) => {
      const app = APPS.find((a) => a.id === w.id);
      if (!app) return [];
      // keep restored windows reachable if the viewport is smaller than last time
      return [{ ...w, title: app.title, icon: app.icon, x: Math.min(w.x, window.innerWidth - 80), y: Math.min(w.y, window.innerHeight - 40) }];
    });
    zCounter = Math.max(zCounter, ...wins.map((w) => w.z));
    return wins;
  } catch {
    return [];
  }
}

export default function App() {
  const [phase, setPhase] = useState<"welcome" | "boot" | "desktop" | "off">("welcome");
  const [locked, setLocked] = useState(false);
  const [wins, setWins] = useState<WinState[]>([]);
  const [focus, setFocus] = useState<string | null>(null);
  const [snap, setSnap] = useState<Rect | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [spotlight, setSpotlight] = useState(false);
  const [ctx, setCtx] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    applyTheme(localStorage.getItem("nebula-theme") ?? "nebula");
    applyWallpaper(localStorage.getItem("nebula-wall") ?? "");
  }, []);

  // Remember open windows across refreshes (only once the desktop is up)
  useEffect(() => {
    if (phase === "desktop") localStorage.setItem(WINS_KEY, JSON.stringify(wins));
  }, [wins, phase]);

  // Ctrl+Space opens Spotlight
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === "Space" && phase === "desktop" && !locked) {
        e.preventDefault();
        setSpotlight((s) => !s);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [phase, locked]);

  const notify = (text: string, icon = "🔔") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, icon, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  };

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

  const restart = () => {
    localStorage.removeItem(WINS_KEY);
    closeAll();
    setLocked(false);
    setPhase("boot");
  };
  const shutdown = () => {
    localStorage.removeItem(WINS_KEY);
    closeAll();
    setLocked(false);
    setPhase("off");
  };

  if (phase === "welcome") return <Welcome onEnter={() => setPhase("boot")} />;
  if (phase === "boot")
    return (
      <BootScreen
        onDone={() => {
          setWins(loadWins());
          setPhase("desktop");
          notify(`Welcome back, ${ME.name}!`, "👋");
        }}
      />
    );
  if (phase === "off") return <OffScreen onPower={() => setPhase("boot")} />;

  const focusedWin = wins.find((w) => w.id === focus && !w.minimized);

  const actions: SpotItem[] = [
    { label: "Lock screen", icon: "🔒", run: () => setLocked(true) },
    { label: "Restart", icon: "🔄", run: restart },
    { label: "Shut down", icon: "⏻", run: shutdown },
  ];
  const spotItems: SpotItem[] = [...APPS.map((a) => ({ label: a.title, icon: a.icon, run: () => open(a.id) })), ...actions];
  const ctxItems: SpotItem[] = [
    { label: "Change wallpaper", icon: "🖼️", run: () => open("settings") },
    { label: "Open Terminal", icon: "💻", run: () => open("terminal") },
    { label: "About me", icon: "🧑‍🚀", run: () => open("about") },
    { label: "Lock screen", icon: "🔒", run: () => setLocked(true) },
  ];

  return (
    <div
      className="desktop"
      onContextMenu={(e) => {
        e.preventDefault();
        if ((e.target as HTMLElement).closest(".window, .dock, .topbar")) return;
        setCtx({ x: e.clientX, y: e.clientY });
      }}
    >
      <header className="topbar">
        <span className="brand">✦ NEBULA<b>OS</b></span>
        <span className="active-title">{focusedWin ? focusedWin.title : "Desktop"}</span>
        <span className="right">
          <button onClick={() => setSpotlight(true)} title="Search (Ctrl+Space)">🔍</button>
          <Clock />
          <PowerMenu onLock={() => setLocked(true)} onRestart={restart} onShutdown={shutdown} />
        </span>
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
            onSnapPreview={setSnap}
          >
            {app.render({ open, closeAll, notify })}
          </Window>
        );
      })}

      <Toasts items={toasts} />
      {ctx && <ContextMenu x={ctx.x} y={ctx.y} items={ctxItems} onClose={() => setCtx(null)} />}
      {spotlight && <Spotlight items={spotItems} onClose={() => setSpotlight(false)} />}
      {locked && <LockScreen onUnlock={() => setLocked(false)} />}

      {snap && <div className="snap-preview" style={{ left: snap.x, top: snap.y, width: snap.w, height: snap.h }} />}

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

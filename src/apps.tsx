import { useEffect, useRef, useState, type ReactNode } from "react";

// ---------- Personalise me! ----------
export const ME = {
  name: "Sriharsha",
  tagline: "Builder, tinkerer & space-station architect",
  bio: "I made NebulaOS for Hack Club's WebOS workshop. Poke around: open the apps, drag the windows, and try the terminal!",
  skills: ["React", "TypeScript", "HTML/CSS", "Python", "Hack Club"],
  projects: [
    { name: "NebulaOS", desc: "This very operating system, running in your browser." },
    { name: "PulseVision", desc: "Another project from my workshop folder." },
  ],
  links: [{ label: "GitHub", href: "https://github.com/maddulasriharsha" }],
};

// ---------- About ----------
export function About() {
  return (
    <div>
      <div className="about">
        <div className="avatar">🧑‍🚀</div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h2>{ME.name}</h2>
          <p className="muted">{ME.tagline}</p>
          <p style={{ marginTop: 10 }}>{ME.bio}</p>
          <div className="chips">
            {ME.skills.map((s) => (
              <span className="chip" key={s}>{s}</span>
            ))}
          </div>
        </div>
      </div>
      <h2 style={{ marginTop: 20 }}>Projects</h2>
      {ME.projects.map((p) => (
        <div className="project" key={p.name}>
          <b>{p.name}</b>
          <div className="muted">{p.desc}</div>
        </div>
      ))}
      <div className="links">
        {ME.links.map((l) => (
          <a key={l.href} href={l.href} target="_blank" rel="noreferrer">🔗 {l.label}</a>
        ))}
      </div>
    </div>
  );
}

// ---------- Notes (persisted) ----------
export function Notes() {
  const [text, setText] = useState(() => localStorage.getItem("nebula-notes") ?? "");
  return (
    <textarea
      className="notes"
      placeholder="Jot something down — it's saved automatically..."
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        localStorage.setItem("nebula-notes", e.target.value);
      }}
    />
  );
}

// ---------- Calculator ----------
export function Calculator() {
  const [expr, setExpr] = useState("");
  const press = (k: string) => {
    if (k === "C") return setExpr("");
    if (k === "⌫") return setExpr((e) => e.slice(0, -1));
    if (k === "=") {
      try {
        if (!/^[0-9+\-*/.() ]+$/.test(expr)) throw 0;
        const v = Function(`"use strict"; return (${expr || 0})`)();
        setExpr(String(Number.isFinite(v) ? +v.toFixed(8) : "Error"));
      } catch {
        setExpr("Error");
      }
      return;
    }
    setExpr((e) => (e === "Error" ? k : e + k));
  };
  const keys = ["C", "(", ")", "/", "7", "8", "9", "*", "4", "5", "6", "-", "1", "2", "3", "+", "0", ".", "⌫", "="];
  return (
    <div className="calc">
      <div className="screen">{expr || "0"}</div>
      {keys.map((k) => (
        <button key={k} className={k === "=" ? "eq" : "/*-+".includes(k) ? "op" : ""} onClick={() => press(k)}>
          {k}
        </button>
      ))}
    </div>
  );
}

// ---------- Terminal (extra feature) ----------
type Line = { cmd?: string; out?: string };

export function Terminal({ open }: { open: (id: string) => void }) {
  const [lines, setLines] = useState<Line[]>([{ out: "NebulaOS terminal v1.0 — type 'help'" }]);
  const [input, setInput] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView();
  }, [lines]);

  const run = (raw: string) => {
    const [cmd, ...args] = raw.trim().split(/\s+/);
    let out = "";
    switch (cmd) {
      case "":
        return;
      case "help":
        out = "help  about  date  echo <text>  open <app>  neofetch  clear\napps: about notes calc snake settings";
        break;
      case "about":
        out = `${ME.name} — ${ME.tagline}`;
        break;
      case "date":
        out = new Date().toString();
        break;
      case "echo":
        out = args.join(" ");
        break;
      case "neofetch":
        out = `   .-.     NebulaOS 1.0\n  (o o)    user: ${ME.name}\n  | O |    shell: nebula-sh\n   '~'     uptime: ${Math.round(performance.now() / 1000)}s`;
        break;
      case "open":
        if (["about", "notes", "calc", "snake", "settings"].includes(args[0])) {
          open(args[0]);
          out = `launching ${args[0]}...`;
        } else out = "usage: open <about|notes|calc|snake|settings>";
        break;
      case "clear":
        setLines([]);
        return;
      default:
        out = `command not found: ${cmd}`;
    }
    setLines((l) => [...l, { cmd: raw, out }]);
  };

  return (
    <div className="term" onClick={(e) => (e.currentTarget.querySelector("input") as HTMLInputElement)?.focus()}>
      <div className="term-out">
        {lines.map((l, i) => (
          <div key={i}>
            {l.cmd !== undefined && <div className="cmd">❯ {l.cmd}</div>}
            {l.out}
          </div>
        ))}
        <div ref={end} />
      </div>
      <div className="term-line">
        <span className="cmd" style={{ color: "var(--accent2)" }}>❯</span>
        <input
          autoFocus
          value={input}
          spellCheck={false}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              run(input);
              setInput("");
            }
          }}
        />
      </div>
    </div>
  );
}

// ---------- Snake ----------
const N = 18;
const CELL = 18;

export function Snake() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const [round, setRound] = useState(0);
  const dir = useRef({ x: 1, y: 0 });

  useEffect(() => {
    let snake = [{ x: 8, y: 9 }];
    let food = { x: 12, y: 9 };
    let next = { x: 1, y: 0 };
    dir.current = next;
    setScore(0);
    setOver(false);
    const ctx = canvas.current!.getContext("2d")!;
    const style = getComputedStyle(document.documentElement);

    const key = (e: KeyboardEvent) => {
      const m: Record<string, [number, number]> = {
        ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
        w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
      };
      const d = m[e.key];
      if (!d) return;
      e.preventDefault();
      if (d[0] !== -dir.current.x || d[1] !== -dir.current.y) next = { x: d[0], y: d[1] };
    };
    window.addEventListener("keydown", key);

    const draw = () => {
      ctx.clearRect(0, 0, N * CELL, N * CELL);
      ctx.fillStyle = "#ff7ac6";
      ctx.beginPath();
      ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 3, 0, 7);
      ctx.fill();
      snake.forEach((s, i) => {
        ctx.fillStyle = i === 0 ? style.getPropertyValue("--accent2") : style.getPropertyValue("--accent");
        ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
      });
    };

    const timer = setInterval(() => {
      dir.current = next;
      const head = { x: snake[0].x + next.x, y: snake[0].y + next.y };
      if (head.x < 0 || head.y < 0 || head.x >= N || head.y >= N || snake.some((s) => s.x === head.x && s.y === head.y)) {
        clearInterval(timer);
        setOver(true);
        return;
      }
      snake = [head, ...snake];
      if (head.x === food.x && head.y === food.y) {
        setScore((s) => s + 1);
        food = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N) };
      } else snake.pop();
      draw();
    }, 120);
    draw();
    return () => {
      clearInterval(timer);
      window.removeEventListener("keydown", key);
    };
  }, [round]);

  return (
    <div className="snake-wrap">
      <div>Score: <b>{score}</b> <span className="muted">· arrows / WASD</span></div>
      <canvas ref={canvas} width={N * CELL} height={N * CELL} />
      {over && <button className="pill-btn" onClick={() => setRound((r) => r + 1)}>Game over — play again</button>}
    </div>
  );
}

// ---------- Settings / themes ----------
export const THEMES: Record<string, { label: string; vars: Record<string, string> }> = {
  nebula: { label: "Nebula", vars: { "--accent": "#7c5cff", "--accent2": "#22d3ee", "--wall1": "#1b1145", "--wall2": "#0a0a23", "--wall3": "#0d3b4f" } },
  sunset: { label: "Sunset", vars: { "--accent": "#ff6b6b", "--accent2": "#ffd166", "--wall1": "#4a1942", "--wall2": "#1a0b2e", "--wall3": "#5c2a1a" } },
  matrix: { label: "Matrix", vars: { "--accent": "#16a34a", "--accent2": "#4ade80", "--wall1": "#052e16", "--wall2": "#020a05", "--wall3": "#0a3d1f" } },
  ocean: { label: "Ocean", vars: { "--accent": "#3b82f6", "--accent2": "#2dd4bf", "--wall1": "#0b2a5b", "--wall2": "#03101f", "--wall3": "#064e4a" } },
};

export function applyTheme(key: string) {
  const t = THEMES[key] ?? THEMES.nebula;
  Object.entries(t.vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
  localStorage.setItem("nebula-theme", key);
}

const WALLPAPERS: Record<string, string> = {
  Aurora: "linear-gradient(135deg,#0f2027,#203a43,#2c5364)",
  Dusk: "linear-gradient(160deg,#42275a,#734b6d)",
  Peach: "radial-gradient(circle at 30% 20%,#ff9a9e,#fad0c4 40%,#a18cd1 100%)",
  Midnight: "linear-gradient(180deg,#000428,#004e92)",
  Forest: "linear-gradient(135deg,#134e5e,#71b280)",
};

export function applyWallpaper(value: string) {
  document.documentElement.style.setProperty("--wallpaper", value || "none");
}

function saveWallpaper(value: string): boolean {
  try {
    localStorage.setItem("nebula-wall", value);
    return true;
  } catch {
    return false; // storage quota exceeded
  }
}

// Downscale uploads so they fit in localStorage
function imageToWallpaper(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = img.width * scale;
      c.height = img.height * scale;
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      resolve(`url(${c.toDataURL("image/jpeg", 0.8)})`);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export function Settings({ onReset }: { onReset: () => void }) {
  const [cur, setCur] = useState(() => localStorage.getItem("nebula-theme") ?? "nebula");
  const [wall, setWall] = useState(() => localStorage.getItem("nebula-wall") ?? "");
  const [err, setErr] = useState("");

  const pickWall = (v: string) => {
    setErr("");
    applyWallpaper(v);
    setWall(v);
    if (!saveWallpaper(v)) setErr("Too big to remember after refresh.");
  };

  return (
    <div>
      <h2>Appearance</h2>
      <p className="muted">Pick a theme for the whole OS.</p>
      <div className="swatches">
        {Object.entries(THEMES).map(([k, t]) => (
          <button
            key={k}
            title={t.label}
            className={`swatch${cur === k ? " on" : ""}`}
            style={{ background: `linear-gradient(135deg, ${t.vars["--accent"]}, ${t.vars["--accent2"]})` }}
            onClick={() => {
              setCur(k);
              applyTheme(k);
            }}
          />
        ))}
      </div>
      <div className="set-row">
        <h2>Wallpaper</h2>
        <div className="walls">
          <button className={`wall none${wall === "" ? " on" : ""}`} onClick={() => pickWall("")}>Theme</button>
          {Object.entries(WALLPAPERS).map(([name, v]) => (
            <button
              key={name}
              title={name}
              className={`wall${wall === v ? " on" : ""}`}
              style={{ ["--wall-bg" as string]: v }}
              onClick={() => pickWall(v)}
            />
          ))}
        </div>
        <label className="pill-btn" style={{ display: "inline-block", marginTop: 10, cursor: "pointer" }}>
          📷 Upload image
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) pickWall(await imageToWallpaper(f));
            }}
          />
        </label>
        {err && <div className="muted" style={{ marginTop: 6 }}>{err}</div>}
      </div>
      <div className="set-row">
        <h2>System</h2>
        <button className="pill-btn" onClick={onReset}>Close all windows</button>
        <button className="pill-btn" onClick={() => { localStorage.removeItem("nebula-notes"); }}>Clear notes</button>
      </div>
    </div>
  );
}

export type AppDef = {
  id: string;
  title: string;
  icon: string;
  w: number;
  h: number;
  render: (ctx: { open: (id: string) => void; closeAll: () => void }) => ReactNode;
};

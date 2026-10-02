import { useEffect, useRef, useState, type ReactNode } from "react";
import { getNode, listDir, pathStr, resolvePath, tree, type FsNode } from "./fs";

// ---------- Personalise me! ----------
export const ME = {
  name: "Sriharsha",
  fullName: "Maddula Sriharsha Reddy",
  tagline: "Aspiring semiconductor & chip design engineer",
  location: "Hyderabad, India",
  bio: "Second-year B.Tech student in Electronics & Communication (VLSI Design & Technology) at VNR VJIET. I love semiconductor physics, digital electronics, RTL design and building things that blink, beep and think. I made NebulaOS for Hack Club's WebOS workshop, so poke around: open the apps, drag the windows, and try the terminal!",
  education: [
    "B.Tech ECE (VLSI Design & Technology), VNR VJIET, 2025–2029, CGPA 8.55",
    "Intermediate, Trividyaa Junior College, 97.7%",
  ],
  skills: ["C", "C++", "Python", "Verilog", "SystemVerilog", "Xilinx Vivado", "MATLAB", "Multisim", "Linux", "GitHub", "React", "TypeScript"],
  learning: "FPGA development, RTL design, DSA, advanced Python",
  projects: [
    { name: "NebulaOS", desc: "This very operating system: windows, terminal, Paint, Files and more, running in your browser." },
    { name: "PulseVision (in progress)", desc: "Phone-first, offline health triage: reads heart rate from the front camera (rPPG) and runs an on-device Gemma 2B LLM for first-aid tips. Kotlin, Jetpack Compose, MediaPipe." },
    { name: "AgriAI", desc: "ESP32 + AI soil and crop health monitor with a web dashboard and Gemini-powered advice. Team of 6; I built the electronics and website integration." },
    { name: "Crowbar Overvoltage Protection", desc: "SCR-based circuit that sounds a buzzer, then trips an SCR and blows a fuse when voltage gets unsafe." },
  ],
  interests: ["Cricket", "Coding", "Tech blogs", "Books", "Movies & TV"],
  links: [
    { label: "GitHub", href: "https://github.com/maddulasriharsha" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/sriharsha-maddula-13a975394" },
    { label: "Email", href: "mailto:sriharsharmaddula@gmail.com" },
  ],
};

// ---------- About ----------
export function About() {
  return (
    <div>
      <div className="about">
        <div className="avatar">🧑‍🚀</div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h2>{ME.fullName}</h2>
          <p className="muted">{ME.tagline} · 📍 {ME.location}</p>
          <p style={{ marginTop: 10 }}>{ME.bio}</p>
          <div className="chips">
            {ME.skills.map((s) => (
              <span className="chip" key={s}>{s}</span>
            ))}
          </div>
        </div>
      </div>
      <h2 style={{ marginTop: 20 }}>Education</h2>
      {ME.education.map((e) => (
        <p key={e} className="muted">🎓 {e}</p>
      ))}
      <p style={{ marginTop: 8 }}>🌱 <b>Learning:</b> <span className="muted">{ME.learning}</span></p>
      <h2 style={{ marginTop: 20 }}>Projects</h2>
      {ME.projects.map((p) => (
        <div className="project" key={p.name}>
          <b>{p.name}</b>
          <div className="muted">{p.desc}</div>
        </div>
      ))}
      <h2 style={{ marginTop: 20 }}>Interests</h2>
      <div className="chips">
        {ME.interests.map((s) => (
          <span className="chip" key={s}>{s}</span>
        ))}
      </div>
      <div className="links" style={{ marginTop: 14 }}>
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
  const [cwd, setCwd] = useState<string[]>([]);
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
        out =
          "help  about  date  echo <text>  open <app>  neofetch  clear\nls [dir]  cd <dir>  pwd  cat <file>  tree\napps: about notes calc snake settings files paint";
        break;
      case "pwd":
        out = pathStr(cwd);
        break;
      case "ls": {
        const p = resolvePath(cwd, args[0] ?? "");
        const n = getNode(p);
        out = !n
          ? `ls: no such directory: ${args[0]}`
          : n.kind === "file"
            ? p[p.length - 1]
            : listDir(p).map(([name, c]) => (c.kind === "dir" ? name + "/" : name)).join("  ");
        break;
      }
      case "cd": {
        const p = resolvePath(cwd, args[0] ?? "");
        const n = getNode(p);
        if (n?.kind === "dir") {
          setCwd(p);
          setLines((l) => [...l, { cmd: raw }]);
          return;
        }
        out = n ? `cd: not a directory: ${args[0]}` : `cd: no such directory: ${args[0]}`;
        break;
      }
      case "cat": {
        const n = args[0] ? getNode(resolvePath(cwd, args[0])) : null;
        out = n?.kind === "file" ? n.content : args[0] ? `cat: cannot read: ${args[0]}` : "usage: cat <file>";
        break;
      }
      case "tree":
        {
          const p = resolvePath(cwd, args[0] ?? "");
          out = getNode(p)?.kind === "dir" ? `${pathStr(p)}\n${tree(p)}` : `tree: no such directory: ${args[0]}`;
        }
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
        if (["about", "notes", "calc", "snake", "settings", "files", "paint"].includes(args[0])) {
          open(args[0]);
          out = `launching ${args[0]}...`;
        } else out = "usage: open <about|notes|calc|snake|settings|files|paint>";
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
        <span className="cmd" style={{ color: "var(--accent2)" }}>{pathStr(cwd)} ❯</span>
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

// ---------- Files ----------
export function Files({ open }: { open: (id: string) => void }) {
  const [path, setPath] = useState<string[]>([]);
  const [preview, setPreview] = useState<{ name: string; text: string } | null>(null);

  const go = (p: string[]) => {
    setPath(p);
    setPreview(null);
  };
  const activate = (name: string, node: FsNode) => {
    if (node.kind === "dir") return go([...path, name]);
    if (node.app) return open(node.app);
    setPreview({ name, text: node.content });
  };

  return (
    <div>
      <div className="crumbs">
        <button onClick={() => go([])}>🏠</button>
        {path.map((p, i) => (
          <button key={i} onClick={() => go(path.slice(0, i + 1))}>/ {p}</button>
        ))}
        {path.length > 0 && <button className="up" onClick={() => go(path.slice(0, -1))}>⬆ Up</button>}
      </div>
      <div className="file-grid">
        {listDir(path).map(([name, node]) => (
          <button key={name} className="file-item" onDoubleClick={() => activate(name, node)} onClick={() => window.innerWidth < 700 && activate(name, node)} title="Double-click to open">
            <span className="ico">{node.kind === "dir" ? "📁" : node.app ? "🚀" : "📄"}</span>
            <span>{name}</span>
          </button>
        ))}
      </div>
      {preview && (
        <div className="preview">
          <b>{preview.name}</b>
          <pre>{preview.text}</pre>
        </div>
      )}
    </div>
  );
}

// ---------- Paint ----------
const PAINT_COLORS = ["#111111", "#ffffff", "#ef4444", "#f59e0b", "#22c55e", "#22d3ee", "#7c5cff", "#ff7ac6"];

export function Paint() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [color, setColor] = useState(PAINT_COLORS[6]);
  const [size, setSize] = useState(6);
  const [eraser, setEraser] = useState(false);

  const clear = () => {
    const ctx = canvas.current!.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 600, 400);
  };
  useEffect(clear, []);

  const pos = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 600, y: ((e.clientY - r.top) / r.height) * 400 };
  };
  const stroke = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const ctx = canvas.current!.getContext("2d")!;
    ctx.strokeStyle = eraser ? "#ffffff" : color;
    ctx.lineWidth = size;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  return (
    <div className="paint">
      <div className="paint-tools">
        {PAINT_COLORS.map((c) => (
          <button
            key={c}
            aria-label={c}
            className={`swatch sm${!eraser && color === c ? " on" : ""}`}
            style={{ background: c }}
            onClick={() => {
              setColor(c);
              setEraser(false);
            }}
          />
        ))}
        <input type="range" min={2} max={30} value={size} onChange={(e) => setSize(+e.target.value)} title="Brush size" />
        <button className={`pill-btn${eraser ? " active" : ""}`} onClick={() => setEraser((v) => !v)}>🧽 Eraser</button>
        <button className="pill-btn" onClick={clear}>🗑 Clear</button>
        <button
          className="pill-btn"
          onClick={() => {
            const a = document.createElement("a");
            a.href = canvas.current!.toDataURL("image/png");
            a.download = "nebula-paint.png";
            a.click();
          }}
        >
          💾 Save PNG
        </button>
      </div>
      <canvas
        ref={canvas}
        width={600}
        height={400}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          const p = pos(e);
          last.current = p;
          stroke(p, p);
        }}
        onPointerMove={(e) => {
          if (!last.current) return;
          const p = pos(e);
          stroke(last.current, p);
          last.current = p;
        }}
        onPointerUp={() => (last.current = null)}
      />
    </div>
  );
}

// ---------- Snake ----------
const N = 18;
const CELL = 18;

export function Snake({ notify }: { notify: (text: string, icon?: string) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const [round, setRound] = useState(0);
  const dir = useRef({ x: 1, y: 0 });

  useEffect(() => {
    let snake = [{ x: 8, y: 9 }];
    let food = { x: 12, y: 9 };
    let next = { x: 1, y: 0 };
    let pts = 0;
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
        const best = Number(localStorage.getItem("nebula-snake") ?? 0);
        if (pts > best) {
          localStorage.setItem("nebula-snake", String(pts));
          notify(`New Snake high score: ${pts}!`, "🏆");
        }
        return;
      }
      snake = [head, ...snake];
      if (head.x === food.x && head.y === food.y) {
        pts++;
        setScore(pts);
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
  render: (ctx: { open: (id: string) => void; closeAll: () => void; notify: (text: string, icon?: string) => void }) => ReactNode;
};

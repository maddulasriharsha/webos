import { useEffect, useMemo, useRef, useState } from "react";
import { ME } from "./apps";

// ---------- Boot ----------
const BOOT_LINES = [
  "Initialising nebula core",
  "Mounting virtual file system",
  "Loading themes and wallpaper",
  "Starting window manager",
  "Warming up the dock",
];

export function BootScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (step >= BOOT_LINES.length) {
      const t = setTimeout(onDone, 350);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep((s) => s + 1), 320);
    return () => clearTimeout(t);
  }, [step, onDone]);
  return (
    <div className="welcome boot">
      <div className="stars" />
      <div className="welcome-card">
        <div className="orb small" />
        <div className="boot-log">
          {BOOT_LINES.slice(0, step).map((l) => (
            <div key={l}>✓ {l}</div>
          ))}
        </div>
        <div className="boot-bar">
          <div style={{ width: `${(step / BOOT_LINES.length) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

export function OffScreen({ onPower }: { onPower: () => void }) {
  return (
    <div className="off">
      <button onClick={onPower} aria-label="Power on">⏻</button>
      <p>System is off. Click to power on.</p>
    </div>
  );
}

// ---------- Lock screen (click or press any key — intentionally no password) ----------
export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    const key = () => onUnlock();
    window.addEventListener("keydown", key);
    return () => {
      clearInterval(t);
      window.removeEventListener("keydown", key);
    };
  }, [onUnlock]);
  return (
    <div className="lock" onClick={onUnlock}>
      <div className="lock-time">{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
      <div className="lock-date">{now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}</div>
      <div className="lock-user">
        <div className="avatar">🧑‍🚀</div>
        <b>{ME.name}</b>
        <span className="muted lock-hint">Click or press any key to unlock</span>
      </div>
    </div>
  );
}

// ---------- Toasts ----------
export type Toast = { id: number; icon: string; text: string };

export function Toasts({ items }: { items: Toast[] }) {
  return (
    <div className="toasts">
      {items.map((t) => (
        <div className="toast" key={t.id}>
          <span>{t.icon}</span> {t.text}
        </div>
      ))}
    </div>
  );
}

// ---------- Power menu ----------
export function PowerMenu({ onLock, onRestart, onShutdown }: { onLock: () => void; onRestart: () => void; onShutdown: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener("mousedown", away);
    return () => window.removeEventListener("mousedown", away);
  }, [open]);
  const item = (label: string, fn: () => void) => (
    <button onClick={() => { setOpen(false); fn(); }}>{label}</button>
  );
  return (
    <div className="power" ref={ref}>
      <button className="power-btn" onClick={() => setOpen((o) => !o)} aria-label="Power menu">⏻</button>
      {open && (
        <div className="menu">
          {item("🔒 Lock", onLock)}
          {item("🔄 Restart", onRestart)}
          {item("⏻ Shut down", onShutdown)}
        </div>
      )}
    </div>
  );
}

// ---------- Spotlight ----------
export type SpotItem = { label: string; icon: string; run: () => void };

export function Spotlight({ items, onClose }: { items: SpotItem[]; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const results = useMemo(() => items.filter((i) => i.label.toLowerCase().includes(q.toLowerCase())), [items, q]);
  const go = (i?: SpotItem) => {
    if (!i) return;
    onClose();
    i.run();
  };
  return (
    <div className="spot-back" onMouseDown={onClose}>
      <div className="spot" onMouseDown={(e) => e.stopPropagation()}>
        <input
          autoFocus
          placeholder="Search apps and actions..."
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setSel(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
            else if (e.key === "ArrowDown") setSel((s) => Math.min(s + 1, results.length - 1));
            else if (e.key === "ArrowUp") setSel((s) => Math.max(s - 1, 0));
            else if (e.key === "Enter") go(results[sel]);
          }}
        />
        <div className="spot-results">
          {results.map((r, i) => (
            <button key={r.label} className={i === sel ? "on" : ""} onMouseEnter={() => setSel(i)} onClick={() => go(r)}>
              <span>{r.icon}</span> {r.label}
            </button>
          ))}
          {results.length === 0 && <div className="muted" style={{ padding: 12 }}>No results</div>}
        </div>
      </div>
    </div>
  );
}

// ---------- Desktop context menu ----------
export function ContextMenu({ x, y, items, onClose }: { x: number; y: number; items: SpotItem[]; onClose: () => void }) {
  useEffect(() => {
    const close = () => onClose();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("mousedown", close);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", esc);
    };
  }, [onClose]);
  return (
    <div className="menu ctx" style={{ left: Math.min(x, window.innerWidth - 200), top: Math.min(y, window.innerHeight - 180) }} onMouseDown={(e) => e.stopPropagation()}>
      {items.map((i) => (
        <button key={i.label} onClick={() => { onClose(); i.run(); }}>
          {i.icon} {i.label}
        </button>
      ))}
    </div>
  );
}

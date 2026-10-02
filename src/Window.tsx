import { useRef, type ReactNode, type PointerEvent as RPointerEvent } from "react";

export type Rect = { x: number; y: number; w: number; h: number };

export type WinState = Rect & {
  id: string;
  title: string;
  icon: string;
  z: number;
  minimized: boolean;
  restore?: Rect; // set while maximized/snapped: the size to go back to
};

type Zone = "max" | "left" | "right";

const TOP = 34; // top bar
const BOTTOM = 84; // dock clearance

export function zoneRect(zone: Zone): Rect {
  const w = window.innerWidth;
  const h = window.innerHeight - TOP - BOTTOM;
  if (zone === "max") return { x: 0, y: TOP, w, h };
  return { x: zone === "left" ? 0 : w / 2, y: TOP, w: w / 2, h };
}

function zoneAt(x: number, y: number): Zone | null {
  if (y <= 8) return "max";
  if (x <= 8) return "left";
  if (x >= window.innerWidth - 8) return "right";
  return null;
}

type Props = {
  win: WinState;
  focused: boolean;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onChange: (patch: Partial<WinState>) => void;
  onSnapPreview: (r: Rect | null) => void;
  children: ReactNode;
};

export default function Window({ win, focused, onFocus, onClose, onMinimize, onChange, onSnapPreview, children }: Props) {
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const size = useRef<{ sx: number; sy: number; w: number; h: number } | null>(null);
  const zone = useRef<Zone | null>(null);

  const snapTo = (z: Zone) =>
    onChange({ ...zoneRect(z), restore: win.restore ?? { x: win.x, y: win.y, w: win.w, h: win.h } });

  const toggleMax = () => {
    if (win.restore) onChange({ ...win.restore, restore: undefined });
    else snapTo("max");
  };

  const startDrag = (e: RPointerEvent) => {
    if ((e.target as HTMLElement).closest(".win-ctrls")) return;
    onFocus();
    let dx = e.clientX - win.x;
    const dy = e.clientY - win.y;
    if (win.restore) {
      // pulling a snapped/maximized window away: restore its size under the pointer
      const { w, h } = win.restore;
      dx = w * ((e.clientX - win.x) / win.w);
      onChange({ w, h, restore: undefined });
    }
    drag.current = { dx, dy };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const moveDrag = (e: RPointerEvent) => {
    if (!drag.current) return;
    const w = win.restore ? win.restore.w : win.w;
    onChange({
      x: Math.min(Math.max(e.clientX - drag.current.dx, -w + 80), window.innerWidth - 80),
      y: Math.min(Math.max(e.clientY - drag.current.dy, TOP), window.innerHeight - 40),
    });
    zone.current = zoneAt(e.clientX, e.clientY);
    onSnapPreview(zone.current ? zoneRect(zone.current) : null);
  };
  const endDrag = () => {
    if (drag.current && zone.current) snapTo(zone.current);
    drag.current = null;
    zone.current = null;
    onSnapPreview(null);
  };

  const startResize = (e: RPointerEvent) => {
    e.stopPropagation();
    onFocus();
    size.current = { sx: e.clientX, sy: e.clientY, w: win.w, h: win.h };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const moveResize = (e: RPointerEvent) => {
    if (!size.current) return;
    onChange({
      w: Math.max(260, size.current.w + e.clientX - size.current.sx),
      h: Math.max(160, size.current.h + e.clientY - size.current.sy),
    });
  };
  const endResize = () => (size.current = null);

  return (
    <div
      className={`window${focused ? " focused" : ""}${win.restore ? " snapped" : ""}`}
      style={{
        left: win.x,
        top: win.y,
        width: win.w,
        height: win.h,
        zIndex: win.z,
        display: win.minimized ? "none" : "flex",
      }}
      onPointerDown={onFocus}
    >
      <div className="win-bar" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onDoubleClick={toggleMax}>
        <span className="win-title">
          {win.icon} {win.title}
        </span>
        <span className="win-ctrls">
          <button className="dot min" aria-label="Minimize" onClick={onMinimize} />
          <button className="dot max" aria-label="Maximize" onClick={toggleMax} />
          <button className="dot close" aria-label="Close" onClick={onClose} />
        </span>
      </div>
      <div className="win-body">{children}</div>
      {!win.restore && <div className="resize" onPointerDown={startResize} onPointerMove={moveResize} onPointerUp={endResize} />}
    </div>
  );
}

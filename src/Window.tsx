import { useRef, type ReactNode, type PointerEvent as RPointerEvent } from "react";

export type WinState = {
  id: string;
  title: string;
  icon: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  minimized: boolean;
};

type Props = {
  win: WinState;
  focused: boolean;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onChange: (patch: Partial<WinState>) => void;
  children: ReactNode;
};

export default function Window({ win, focused, onFocus, onClose, onMinimize, onChange, children }: Props) {
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const size = useRef<{ sx: number; sy: number; w: number; h: number } | null>(null);

  const startDrag = (e: RPointerEvent) => {
    if ((e.target as HTMLElement).closest(".win-ctrls")) return;
    onFocus();
    drag.current = { dx: e.clientX - win.x, dy: e.clientY - win.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const moveDrag = (e: RPointerEvent) => {
    if (!drag.current) return;
    const x = Math.min(Math.max(e.clientX - drag.current.dx, -win.w + 80), window.innerWidth - 80);
    const y = Math.min(Math.max(e.clientY - drag.current.dy, 34), window.innerHeight - 40);
    onChange({ x, y });
  };
  const endDrag = () => (drag.current = null);

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
      className={`window${focused ? " focused" : ""}`}
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
      <div className="win-bar" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag}>
        <span className="win-title">
          {win.icon} {win.title}
        </span>
        <span className="win-ctrls">
          <button className="dot min" aria-label="Minimize" onClick={onMinimize} />
          <button className="dot close" aria-label="Close" onClick={onClose} />
        </span>
      </div>
      <div className="win-body">{children}</div>
      <div className="resize" onPointerDown={startResize} onPointerMove={moveResize} onPointerUp={endResize} />
    </div>
  );
}

// A tiny read-only virtual file system shared by the Files app and the Terminal.
export type FsNode =
  | { kind: "dir"; children: Record<string, FsNode> }
  | { kind: "file"; content: string; app?: string }; // `app` makes the file launchable

const file = (content: string, app?: string): FsNode => ({ kind: "file", content, app });
const dir = (children: Record<string, FsNode>): FsNode => ({ kind: "dir", children });

export const ROOT: FsNode = dir({
  Documents: dir({
    "readme.txt": file("Welcome to NebulaOS!\nThis file system is virtual — browse it here or with ls/cd/cat in the Terminal."),
    "goals.txt": file("1. Ship WebOS 1\n2. Unlock WebOS 2\n3. Break into VLSI / chip design\n4. Learn FPGA development & RTL design"),
    "education.txt": file("B.Tech ECE (VLSI Design & Technology) — VNR VJIET, 2025–2029, CGPA 8.55\nIntermediate — Trividyaa Junior College, 97.7%\nSSC — Pallavi Model School, CBSE, 89%"),
    "skills.txt": file("Languages: C, C++, Python, Verilog, SystemVerilog\nTools: MATLAB, Xilinx Vivado, Multisim\nOS: Windows, Ubuntu, Kali, macOS\nLearning: FPGA, RTL design, DSA, advanced Python"),
    Projects: dir({
      "nebulaos.md": file("# NebulaOS\nA web OS built with React + TypeScript for Hack Club."),
      "pulsevision.md": file("# PulseVision (in progress)\nContactless heart-rate (rPPG) from a phone camera + on-device Gemma 2B for offline first-aid advice.\nKotlin, Jetpack Compose, CameraX, MediaPipe, FFT."),
      "agriai.md": file("# AgriAI\nESP32 soil & crop health monitor with a Flask dashboard and Gemini AI.\nTeam of 6 — I handled the electronics and website integration."),
      "crowbar.md": file("# Crowbar Overvoltage Protection\nBT169 SCR circuit: buzzer warning, then SCR trips and blows the fuse above the safe voltage."),
    }),
  }),
  Pictures: dir({
    "space.txt": file("(imagine a gorgeous nebula photo here 🌌)"),
  }),
  Applications: dir({
    "about.app": file("Launches About Me", "about"),
    "terminal.app": file("Launches Terminal", "terminal"),
    "notes.app": file("Launches Notes", "notes"),
    "calc.app": file("Launches Calculator", "calc"),
    "paint.app": file("Launches Paint", "paint"),
    "snake.app": file("Launches Snake", "snake"),
    "settings.app": file("Launches Settings", "settings"),
  }),
  "hello.txt": file("Hi there, explorer 👋"),
});

export const pathStr = (p: string[]) => "/" + p.join("/");

export function getNode(path: string[]): FsNode | null {
  let node: FsNode = ROOT;
  for (const part of path) {
    if (node.kind !== "dir" || !(part in node.children)) return null;
    node = node.children[part];
  }
  return node;
}

// Resolve a user-typed path (absolute, relative, with . and ..) against a cwd
export function resolvePath(cwd: string[], input: string): string[] {
  const out = input.startsWith("/") ? [] : [...cwd];
  for (const part of input.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") out.pop();
    else out.push(part);
  }
  return out;
}

export function listDir(path: string[]): [string, FsNode][] {
  const node = getNode(path);
  if (!node || node.kind !== "dir") return [];
  return Object.entries(node.children).sort(([an, a], [bn, b]) =>
    a.kind === b.kind ? an.localeCompare(bn) : a.kind === "dir" ? -1 : 1
  );
}

export function tree(path: string[], prefix = ""): string {
  return listDir(path)
    .map(([name, n], i, arr) => {
      const last = i === arr.length - 1;
      const line = `${prefix}${last ? "└─ " : "├─ "}${name}${n.kind === "dir" ? "/" : ""}`;
      return n.kind === "dir" ? `${line}\n${tree([...path, name], prefix + (last ? "   " : "│  "))}`.trimEnd() : line;
    })
    .join("\n");
}

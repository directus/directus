// node summ-form.mjs results/*.json  -> per variant/collection/throttle: keystroke frame median + p90 (all keystrokes pooled), INP max median, re-renders/key
import { readFileSync } from "node:fs";

const rows = process.argv
  .slice(2)
  .flatMap((f) => JSON.parse(readFileSync(f, "utf8")));
const pct = (arr, p) => {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
};
const groups = {};
for (const r of rows)
  (groups[`${r.collection} x${r.throttle} ${r.variant}`] ??= []).push(r);

for (const [key, rs] of Object.entries(groups).sort()) {
  const frames = rs.flatMap((r) => r.frames);
  const runMedians = rs.map((r) => r.frameMedian);
  const inp = rs.map((r) => r.inpMax);
  const upd = rs.map((r) => r.formFieldUpdatesPerKey).filter((x) => x != null);
  console.log(
    key.padEnd(40),
    `runs=${rs.length}`,
    `median=${pct(frames, 50).toFixed(0)} [run medians ${Math.min(...runMedians).toFixed(0)}–${Math.max(...runMedians).toFixed(0)}]`,
    `p90=${pct(frames, 90).toFixed(0)}`,
    `inpMax(med)=${pct(inp, 50).toFixed(0)}`,
    upd.length ? `ffUpdates/key=${pct(upd, 50).toFixed(1)}` : "",
  );
}

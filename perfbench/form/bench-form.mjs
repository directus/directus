// Keystroke-to-next-paint on the item edit page while typing 20 chars into the `title` input.
// node bench-form.mjs <variant> <runs> <collections comma list> <throttle> [baseUrl]
import { chromium } from "playwright-core";
import { writeFileSync, mkdirSync } from "node:fs";
const OUT = process.env.OUT || '/tmp/perfbench-form';

const [
  variant,
  runs = "5",
  collArg = "form_bench,form_bench_cond",
  throttleArg = "1",
  B = "http://127.0.0.1:8165",
] = process.argv.slice(2);
const throttle = Number(throttleArg);
const collections = collArg.split(",");
const CHARS = "abcdefghijklmnopqrst";

const init = () => {
  window.__frames = [];
  window.__ev = [];
  new PerformanceObserver((l) => {
    for (const e of l.getEntries())
      if (e.interactionId)
        window.__ev.push({
          name: e.name,
          dur: e.duration,
          id: e.interactionId,
        });
  }).observe({ type: "event", durationThreshold: 16, buffered: true });
  window.__lt = [];
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) window.__lt.push([e.startTime, e.duration]);
  }).observe({ type: "longtask", buffered: true });
  // keydown -> next frame presented (rAF + task), same approach as the resize bench
  addEventListener(
    "keydown",
    (e) => {
      const t0 = e.timeStamp;
      requestAnimationFrame(() => {
        const ch = new MessageChannel();
        ch.port1.onmessage = () => window.__frames.push(performance.now() - t0);
        ch.port2.postMessage(0);
      });
    },
    true,
  );
};

async function waitQuiet(page, quietMs = 1000) {
  for (;;) {
    const r = await page.evaluate(() => {
      const lastEnd = window.__lt.length
        ? Math.max(...window.__lt.map(([s, d]) => s + d))
        : 0;
      return performance.now() - lastEnd;
    });
    if (r >= quietMs) return;
    await page.waitForTimeout(200);
  }
}

const pct = (arr, p) => {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
};

const browser = await chromium.launch({
  executablePath:
    process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const out = [];

for (const collection of collections) {
  for (let i = 0; i < Number(runs); i++) {
    const ctx = await browser.newContext({
      viewport: { width: 1600, height: 1000 },
    });
    await ctx.request.post(B + "/auth/login", {
      data: {
        email: "admin@example.com",
        password: "benchpass",
        mode: "session",
      },
    });
    await ctx.addCookies(
      [
        "license-banner-dismissed",
        "license-login-modal-dismissed",
        "license-onboarding-dismissed",
      ].map((name) => ({ name, value: "true", url: B })),
    );
    const page = await ctx.newPage();
    await page.addInitScript(init);
    await page.goto(B + "/admin/content/" + collection + "/1", {
      waitUntil: "networkidle",
    });
    const input = page
      .locator('.v-form .field[data-field="title"] input')
      .first();
    await input.waitFor({ timeout: 30000 }).catch(async () => {
      // cold API on the first run: reload once
      await page.screenshot({ path: `${OUT}/fail.png` });
      await page.reload({ waitUntil: 'networkidle' });
      await input.waitFor({ timeout: 30000 });
    });
    await waitQuiet(page);
    const cdp = await ctx.newCDPSession(page);
    if (throttle > 1)
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: throttle });
    await input.click();
    await page.keyboard.press("End");
    await waitQuiet(page, 500);
    await page.evaluate(() => {
      window.__frames = [];
      window.__ev = [];
      if ("__ffUpdates" in window) window.__ffUpdates = 0;
    });

    for (const ch of CHARS) {
      const before = await page.evaluate(() => window.__frames.length);
      await page.keyboard.press(ch);
      await page.waitForFunction((n) => window.__frames.length > n, before, {
        polling: "raf",
        timeout: 10000,
      });
      await page.waitForTimeout(throttle > 1 ? 250 : 100);
    }

    await waitQuiet(page, 500);
    const { frames, ev, value, ffUpdates } = await page.evaluate(() => ({
      frames: window.__frames,
      ev: window.__ev,
      value: document.querySelector('.v-form .field[data-field="title"] input')
        .value,
      ffUpdates: window.__ffUpdates,
    }));
    if (!value.endsWith(CHARS)) throw new Error("typing failed: " + value);
    const perInteraction = Object.values(
      ev.reduce((a, e) => ((a[e.id] = Math.max(a[e.id] ?? 0, e.dur)), a), {}),
    );
    const r = {
      variant,
      collection,
      throttle,
      run: i,
      frames,
      frameMedian: pct(frames, 50),
      frameP90: pct(frames, 90),
      inpCount: perInteraction.length,
      inpMax: perInteraction.length ? Math.max(...perInteraction) : 0,
      formFieldUpdatesPerKey: ffUpdates == null ? null : ffUpdates / CHARS.length,
    };
    console.log(JSON.stringify({ ...r, frames: undefined }));
    out.push(r);
    await ctx.close();
  }
}

await browser.close();
mkdirSync(`${OUT}/results`, { recursive: true });
writeFileSync(
  `${OUT}/results/${variant}-x${throttle}-${Date.now()}.json`,
  JSON.stringify(out, null, 1),
);

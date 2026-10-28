// Item edit page: route change to idle, keystroke-to-paint in the title input, heap after GC.
import { chromium } from 'playwright-core';
const [variant, runs = '5', throttleArg = '1'] = process.argv.slice(2);
const B = process.env.BASE || 'http://127.0.0.1:8175';
const throttle = Number(throttleArg);
const KEYS = 20;

const init = () => {
	window.__lt = [];
	new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push([e.startTime, e.duration]); }).observe({ type: 'longtask', buffered: true });
	window.__keys = [];
	addEventListener('keydown', (e) => {
		if (!window.__trackKeys) return;
		const t0 = e.timeStamp;
		requestAnimationFrame(() => { const ch = new MessageChannel(); ch.port1.onmessage = () => window.__keys.push(performance.now() - t0); ch.port2.postMessage(0); });
	}, true);
};

async function waitIdle(page, since, quietMs = 1500) {
	for (;;) {
		const r = await page.evaluate(([since, quietMs]) => {
			const lts = window.__lt.filter(([s]) => s >= since);
			const lastEnd = lts.length ? Math.max(...lts.map(([s, d]) => s + d)) : since;
			return { lastEnd, now: performance.now(), ltSum: lts.reduce((a, [, d]) => a + d, 0) };
		}, [since, quietMs]);
		if (r.now - r.lastEnd >= quietMs) return r;
		await page.waitForTimeout(250);
	}
}

const browser = await chromium.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--js-flags=--expose-gc'] });
const out = [];
for (let i = 0; i < Number(runs); i++) {
	const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
	await ctx.request.post(B + '/auth/login', { data: { email: 'admin@example.com', password: 'benchpass', mode: 'session' } });
	await ctx.addCookies(['license-banner-dismissed', 'license-login-modal-dismissed', 'license-onboarding-dismissed'].map((name) => ({ name, value: 'true', url: B })));
	const page = await ctx.newPage();
	await page.addInitScript(init);
	const cdp = await ctx.newCDPSession(page);
	await cdp.send('Performance.enable');
	await page.goto(B + '/admin/content', { waitUntil: 'networkidle' });
	if (throttle > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
	const t0 = await page.evaluate(() => performance.now());
	await page.evaluate(() => document.querySelector('#app').__vue_app__.config.globalProperties.$router.push('/content/bench_items/5'));
	const input = page.locator('[data-field="title"] input');
	await input.waitFor({ timeout: 120000 });
	const inputMs = (await page.evaluate(() => performance.now())) - t0;
	const idle = await waitIdle(page, t0);
	const r = { variant, throttle, run: i, inputMs, idleMs: idle.lastEnd - t0, loadLtSum: idle.ltSum };
	await input.click();
	await page.waitForTimeout(300);
	await page.evaluate(() => { window.__keys = []; window.__trackKeys = true; });
	const since = await page.evaluate(() => performance.now());
	for (let k = 0; k < KEYS; k++) { await page.keyboard.press(k % 2 ? 'Backspace' : 'x'); await page.waitForTimeout(120); }
	await page.waitForTimeout(400);
	const keys = await page.evaluate(() => { window.__trackKeys = false; return window.__keys.slice(); });
	const idle2 = await waitIdle(page, since, 1000);
	keys.sort((a, b) => a - b);
	r.keyCount = keys.length; r.keyMed = keys[Math.floor(keys.length / 2)]; r.keyMax = keys[keys.length - 1]; r.keyLtSum = idle2.ltSum;
	if (throttle > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
	await cdp.send('HeapProfiler.collectGarbage'); await cdp.send('HeapProfiler.collectGarbage');
	const m = (await cdp.send('Performance.getMetrics')).metrics;
	r.heapMB = m.find((x) => x.name === 'JSHeapUsedSize').value / 1048576;
	out.push(r);
	console.error(JSON.stringify(r));
	await ctx.close();
}
await browser.close();
console.log(JSON.stringify(out));

import { chromium } from 'playwright-core';
const [variant, runs = '5', throttleArg = '1'] = process.argv.slice(2);
const B = 'http://127.0.0.1:8155';
const throttle = Number(throttleArg);
const init = () => {
	window.__lt = [];
	new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push([e.startTime, e.duration]); }).observe({ type: 'longtask', buffered: true });
	window.__ev = [];
	new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__ev.push({ name: e.name, start: e.startTime, dur: e.duration, id: e.interactionId }); }).observe({ type: 'event', durationThreshold: 16, buffered: true });
};
async function settle(page, since, quietMs = 800) {
	for (;;) {
		const r = await page.evaluate(([since]) => {
			const lts = window.__lt.filter(([s]) => s >= since);
			return { lastEnd: lts.length ? Math.max(...lts.map(([s, d]) => s + d)) : since, now: performance.now(), ltSum: lts.reduce((a, [, d]) => a + d, 0), maxLt: lts.length ? Math.max(...lts.map(([, d]) => d)) : 0 };
		}, [since]);
		if (r.now - r.lastEnd >= quietMs) return r;
		await page.waitForTimeout(150);
	}
}
async function measure(page, action) {
	const since = await page.evaluate(() => performance.now());
	await action();
	await page.waitForTimeout(300);
	const s = await settle(page, since);
	const ev = await page.evaluate((since) => window.__ev.filter((e) => e.start >= since && e.id), since);
	return { inp: ev.length ? Math.max(...ev.map((e) => e.dur)) : 0, ltSum: s.ltSum, maxLt: s.maxLt };
}
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const out = [];
for (let i = 0; i < Number(runs); i++) {
	const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
	await ctx.request.post(B + '/auth/login', { data: { email: 'admin@example.com', password: 'benchpass', mode: 'session' } });
	await ctx.addCookies(['license-banner-dismissed', 'license-login-modal-dismissed', 'license-onboarding-dismissed'].map((name) => ({ name, value: 'true', url: B })));
	const page = await ctx.newPage();
	await page.addInitScript(init);
	const cdp = await ctx.newCDPSession(page);
	await page.goto(B + '/admin/content/bench_items/1', { waitUntil: 'networkidle' });
	const sel = page.locator('.v-form .v-select').first();
	await sel.waitFor();
	await settle(page, 0, 1000);
	if (throttle > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
	const r = { variant, throttle, run: i };
	const open = await measure(page, () => sel.click());
	r.listItems = await page.locator('.v-menu-content .v-list-item').count();
	r.openInp = open.inp; r.openLt = open.ltSum;
	const type = await measure(page, () => page.keyboard.press('7'));
	r.visibleAfterType = await page.locator('.v-menu-content .v-list-item:visible').count();
	r.typeInp = type.inp; r.typeLt = type.ltSum;
	const back = await measure(page, () => page.keyboard.press('Backspace'));
	r.clearInp = back.inp; r.clearLt = back.ltSum;
	if (throttle > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
	if (i === 0) await page.screenshot({ path: `/tmp/perfbench-results/select-${variant}.png` });
	out.push(r);
	console.error(JSON.stringify(r));
	await ctx.close();
}
await browser.close();
console.log(JSON.stringify(out));

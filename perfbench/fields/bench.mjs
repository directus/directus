import { chromium } from 'playwright-core';
const [variant, runs = '5', limitsArg = '1000,25', throttleArg = '1'] = process.argv.slice(2);
const B = process.env.BASE || 'http://127.0.0.1:8175';
const throttle = Number(throttleArg);
const limits = limitsArg.split(',').map(Number);

async function apiToken() {
	const r = await fetch(B + '/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'admin@example.com', password: 'benchpass' }) });
	return (await r.json()).data.access_token;
}
async function setLimit(limit) {
	const T = await apiToken();
	const h = { 'content-type': 'application/json', authorization: 'Bearer ' + T };
	const p = (await (await fetch(B + '/presets?filter[collection][_eq]=bench_items', { headers: h })).json()).data[0];
	p.layout_query.tabular.limit = limit;
	await fetch(B + '/presets/' + p.id, { method: 'PATCH', headers: h, body: JSON.stringify({ layout_query: p.layout_query, layout_options: { tabular: { spacing: 'cozy' } } }) });
}

const init = () => {
	window.__lt = [];
	new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push([e.startTime, e.duration]); }).observe({ type: 'longtask', buffered: true });
	window.__ev = [];
	new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__ev.push({ name: e.name, start: e.startTime, dur: e.duration, id: e.interactionId }); }).observe({ type: 'event', durationThreshold: 16, buffered: true });
	window.__frames = [];
	addEventListener('pointermove', (e) => {
		if (!window.__trackMove) return;
		const t0 = e.timeStamp;
		requestAnimationFrame(() => { const ch = new MessageChannel(); ch.port1.onmessage = () => window.__frames.push(performance.now() - t0); ch.port2.postMessage(0); });
	}, true);
};

async function waitIdle(page, since, quietMs = 1500) {
	// idle = no long task for quietMs; returns end of last long task after `since` (or since if none)
	for (;;) {
		const r = await page.evaluate(([since, quietMs]) => {
			const lts = window.__lt.filter(([s]) => s + 0 >= since);
			const lastEnd = lts.length ? Math.max(...lts.map(([s, d]) => s + d)) : since;
			return { lastEnd, now: performance.now(), tbt: lts.reduce((a, [, d]) => a + Math.max(0, d - 50), 0), ltSum: lts.reduce((a, [, d]) => a + d, 0), maxLt: lts.length ? Math.max(...lts.map(([, d]) => d)) : 0 };
		}, [since, quietMs]);
		if (r.now - r.lastEnd >= quietMs) return r;
		await page.waitForTimeout(250);
	}
}

async function interaction(page, action) {
	const since = await page.evaluate(() => performance.now());
	await action();
	await page.waitForTimeout(300);
	const idle = await waitIdle(page, since, 1000);
	const ev = await page.evaluate((since) => window.__ev.filter((e) => e.start >= since && e.id), since);
	const inp = ev.length ? Math.max(...ev.map((e) => e.dur)) : 0; // <16ms entries are not reported
	return { inp, maxLt: idle.maxLt, ltSum: idle.ltSum, busyUntil: idle.lastEnd - since };
}

const browser = await chromium.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--js-flags=--expose-gc'] });
const out = [];
for (const limit of limits) {
	await setLimit(limit);
	for (let i = 0; i < Number(runs); i++) {
		await setLimit(limit);
		const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
		await ctx.request.post(B + '/auth/login', { data: { email: 'admin@example.com', password: 'benchpass', mode: 'session' } });
		await ctx.addCookies(['license-banner-dismissed', 'license-login-modal-dismissed', 'license-onboarding-dismissed'].map((name) => ({ name, value: 'true', url: B })));
		const page = await ctx.newPage();
		await page.addInitScript(init);
		const cdp = await ctx.newCDPSession(page);
		await cdp.send('Performance.enable');
		// warm the app shell + caches so the measured nav is the content route, like a returning user
		await page.goto(B + '/admin/content', { waitUntil: 'networkidle' });
		if (throttle > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
		const t0 = await page.evaluate(() => performance.now());
		await page.evaluate(() => { window.__rowsAt = 0; });
		// client-side route change, same as clicking the collection in the nav
		await page.evaluate(() => document.querySelector('#app').__vue_app__.config.globalProperties.$router.push('/content/bench_items'));
		await page.waitForFunction((n) => document.querySelectorAll('tbody tr.table-row').length >= n && (window.__rowsAt ||= performance.now()), limit, { polling: 16, timeout: 120000 }).catch(async (e) => { console.error('FAIL', page.url(), await page.evaluate(() => [document.querySelectorAll('tbody tr.table-row').length, window.__rowsAt])); await page.screenshot({ path: '/tmp/bry/fields-store-maps/fail.png' }); throw e; });
		const rowsAt = (await page.evaluate(() => window.__rowsAt)) - t0;
		const idle = await waitIdle(page, t0);
		const r = { variant, limit, throttle, run: i, rowsMs: rowsAt, idleMs: idle.lastEnd - t0, loadTbt: idle.tbt, loadMaxLt: idle.maxLt };
		await cdp.send('HeapProfiler.collectGarbage'); await cdp.send('HeapProfiler.collectGarbage');
		const m = (await cdp.send('Performance.getMetrics')).metrics;
		r.heapMB = m.find((x) => x.name === 'JSHeapUsedSize').value / 1048576;
		r.nodes = m.find((x) => x.name === 'Nodes').value;

		const rowCb = page.locator('tbody tr.table-row').nth(4).locator('td.select .v-checkbox');
		const row = await interaction(page, () => rowCb.click());
		r.rowInp = row.inp; r.rowLt = row.maxLt;
		const all = await interaction(page, () => page.locator('thead th.select .v-checkbox').click());
		r.allInp = all.inp; r.allLt = all.maxLt;
		await interaction(page, () => page.locator('thead th.select .v-checkbox').click()); // reset

		if (limit === 1000) {
			const h = page.locator('thead th .resize-handle').first();
			const box = await h.boundingBox();
			const w0 = await page.locator('thead th.cell').nth(1).evaluate((e) => e.offsetWidth);
			await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
			await page.mouse.down();
			await page.evaluate(() => { window.__frames = []; window.__trackMove = true; });
			const since = await page.evaluate(() => performance.now());
			for (let k = 1; k <= 10; k++) { await page.mouse.move(box.x + box.width / 2 + k * 8, box.y + box.height / 2); await page.waitForTimeout(50); }
			await page.mouse.up();
			await page.waitForTimeout(300);
			const f = await page.evaluate(() => { window.__trackMove = false; return window.__frames.slice(); });
			const idle2 = await waitIdle(page, since, 1000);
			f.sort((a, b) => a - b);
			r.resizeDelta = (await page.locator('thead th.cell').nth(1).evaluate((e) => e.offsetWidth)) - w0; r.resizeFrames = f.length;
			r.resizeMed = f[Math.floor(f.length / 2)]; r.resizeMax = f[f.length - 1]; r.resizeLtSum = idle2.ltSum;
		}
		if (throttle > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
		out.push(r);
		console.error(JSON.stringify(r));
		await ctx.close();
	}
}
await browser.close();
console.log(JSON.stringify(out));

import { chromium } from 'playwright-core';
const OUT = process.env.OUT || '/tmp/perfbench-fields';
const [variant] = process.argv.slice(2);
const B = process.env.BASE || 'http://127.0.0.1:8175';
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
await ctx.request.post(B + '/auth/login', { data: { email: 'admin@example.com', password: 'benchpass', mode: 'session' } });
await ctx.addCookies(['license-banner-dismissed', 'license-login-modal-dismissed', 'license-onboarding-dismissed'].map((name) => ({ name, value: 'true', url: B })));
const page = await ctx.newPage();
await page.goto(B + '/admin/content/bench_items', { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.querySelectorAll('tbody tr.table-row').length >= 25);
await page.waitForTimeout(1500);
const info = await page.evaluate(() => {
	const tr = document.querySelector('tbody tr.table-row');
	const rt = tr.querySelector('.render-template');
	const dot = document.querySelector('tbody .color-dot, tbody .display-color .dot, tbody [class*=color] .dot');
	return { trH: tr.getBoundingClientRect().height, rtH: rt?.getBoundingClientRect().height ?? null, dot: dot ? getComputedStyle(dot).backgroundColor : null, rowVar: getComputedStyle(tr).getPropertyValue('--row-height') };
});
console.log(variant, JSON.stringify(info));
await page.screenshot({ path: `${OUT}/shots/table-${variant}.png`, clip: { x: 280, y: 60, width: 1000, height: 400 } });
// scroll right to the color / related columns
await page.evaluate(() => { const s = document.querySelector('.v-table') ; s.scrollLeft = 2000; document.querySelector('#main-content, main')?.scrollTo?.(2000, 0); });
await page.mouse.move(800, 500); await page.mouse.wheel(1500, 0); await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/shots/table-right-${variant}.png`, clip: { x: 280, y: 60, width: 1000, height: 400 } });
// hover a related-values cell to open its v-menu
const rel = page.locator('tbody tr.table-row').first().locator('.related-values, .display-related-values, .render-template').last();
await rel.hover().catch(() => {});
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/shots/table-menu-${variant}.png`, clip: { x: 280, y: 60, width: 1300, height: 400 } });
await browser.close();
// item edit page (form + m2o / o2m interfaces)
{
	const b2 = await chromium.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
	const c2 = await b2.newContext({ viewport: { width: 1600, height: 1400 } });
	await c2.request.post(B + '/auth/login', { data: { email: 'admin@example.com', password: 'benchpass', mode: 'session' } });
	await c2.addCookies(['license-banner-dismissed', 'license-login-modal-dismissed', 'license-onboarding-dismissed'].map((name) => ({ name, value: 'true', url: B })));
	const p2 = await c2.newPage();
	await p2.goto(B + '/admin/content/bench_items/5', { waitUntil: 'networkidle' });
	await p2.locator('[data-field="title"] input').waitFor();
	await p2.waitForTimeout(1500);
	await p2.screenshot({ path: `${OUT}/shots/item-${variant}.png`, fullPage: true });
	await b2.close();
}

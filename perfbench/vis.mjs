import { chromium } from 'playwright-core';
const [variant] = process.argv.slice(2);
const B = 'http://127.0.0.1:8155';
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
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
await page.screenshot({ path: `/tmp/perfbench-results/table-${variant}.png`, clip: { x: 280, y: 60, width: 1000, height: 400 } });
// scroll right to the color / related columns
await page.evaluate(() => { const s = document.querySelector('.v-table') ; s.scrollLeft = 2000; document.querySelector('#main-content, main')?.scrollTo?.(2000, 0); });
await page.mouse.move(800, 500); await page.mouse.wheel(1500, 0); await page.waitForTimeout(400);
await page.screenshot({ path: `/tmp/perfbench-results/table-right-${variant}.png`, clip: { x: 280, y: 60, width: 1000, height: 400 } });
// hover a related-values cell to open its v-menu
const rel = page.locator('tbody tr.table-row').first().locator('.related-values, .display-related-values, .render-template').last();
await rel.hover().catch(() => {});
await page.waitForTimeout(600);
await page.screenshot({ path: `/tmp/perfbench-results/table-menu-${variant}.png`, clip: { x: 280, y: 60, width: 1300, height: 400 } });
await browser.close();

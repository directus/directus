// Screenshots + functional checks of the item form. node vis-form.mjs <variant> [baseUrl]
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
const OUT = process.env.OUT || '/tmp/perfbench-form';

const [variant, B = "http://127.0.0.1:8165"] = process.argv.slice(2);
const dir = `${OUT}/shots`;
mkdirSync(dir, { recursive: true });

const browser = await chromium.launch({
  executablePath:
    process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const ctx = await browser.newContext({
  viewport: { width: 1600, height: 1000 },
});
await ctx.request.post(B + "/auth/login", {
  data: { email: "admin@example.com", password: "benchpass", mode: "session" },
});
await ctx.addCookies(
  [
    "license-banner-dismissed",
    "license-login-modal-dismissed",
    "license-onboarding-dismissed",
  ].map((name) => ({ name, value: "true", url: B })),
);
const page = await ctx.newPage();
const checks = {};
const field = (name) =>
  page.locator(`.v-form .field[data-field="${name}"]`).first();
const shot = (name) =>
  page.screenshot({
    path: `${dir}/${variant}-${name}.png`,
    fullPage: true,
    animations: "disabled",
    caret: "hide",
  });

async function open(collection) {
  await page.goto(B + "/admin/content/" + collection + "/1", {
    waitUntil: "networkidle",
  });
  await field("title").locator("input").waitFor();
  await page.waitForTimeout(800);
}

await open("form_bench");
await shot("plain");
await field("title").locator("input").fill("Hello typed");
checks.plainTitle = await field("title").locator("input").inputValue();
// open the first accordion section
await page.getByText("G More A", { exact: false }).first().click();
await page.waitForTimeout(500);
await shot("plain-accordion");
checks.plainAccordionFieldVisible = await field("more_a_1").isVisible();
checks.plainHalfRight = await page.locator(".v-form .field.half-right").count();

await open("form_bench_cond");
await shot("cond");
checks.slugReadonlyBefore = await field("slug").locator("input").isDisabled();
await field("title").locator("input").fill("xxabcxx");
await page.waitForTimeout(300);
checks.slugReadonlyAfterAbc = await field("slug").locator("input").isDisabled();
await shot("cond-abc");
await field("title").locator("input").fill("x");
await page.waitForTimeout(300);
checks.slugReadonlyAfterClear = await field("slug")
  .locator("input")
  .isDisabled();
// active=false -> spec_int_2 readonly
await field("active").locator("button.v-checkbox, .v-checkbox").first().click();
await page.waitForTimeout(300);
checks.specInt2ReadonlyWhenInactive = await field("spec_int_2")
  .locator("input")
  .isDisabled();
await shot("cond-inactive");

console.log(variant, JSON.stringify(checks));
await browser.close();

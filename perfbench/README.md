# CSS `v-bind()` perf bench

Reference harness for #28434 / #28435. Not meant to merge.

Production build of the app served by a local sqlite API on port 8155, driven by headless Chrome through Playwright.

## Variants

| Name       | Change                                                                                          |
| ---------- | ----------------------------------------------------------------------------------------------- |
| `baseline` | `main` at `60133482b7`                                                                          |
| `A`        | `useItems` `ref` → `shallowRef` ([patches/A.patch](patches/A.patch))                            |
| `B`        | `table-row` CSS `v-bind()` → inline vars only ([patches/B.patch](patches/B.patch))              |
| `AB`       | A + B                                                                                           |
| `Bfull`    | the PR: table-row, select-list-item, v-menu, color ([patches/Bfull.patch](patches/Bfull.patch)) |

## Results

1000 rows, 11 columns (strings, text, float, int, datetime, boolean, color, M2O and O2M via related-values), cozy
spacing. Median of 5 runs, ms, `[min–max]`.

| 1000 rows                | baseline         | A                | B                | A+B              | Bfull            |
| ------------------------ | ---------------- | ---------------- | ---------------- | ---------------- | ---------------- |
| Load to idle             | 2057 [2032–2139] | 2043 [2001–2073] | 2102 [1881–2546] | 1874 [1824–2101] | 1502 [1470–1854] |
| Select all → paint       | 280 [280–288]    | 288 [280–320]    | 120 [112–152]    | 112 [112–120]    | 112 [112–120]    |
| Row checkbox → paint     | 264 [256–272]    | 272 [256–288]    | 112 [96–136]     | 96 [96–120]      | 104 [96–112]     |
| Column resize, per frame | 350 [334–359]    | 358 [333–402]    | 182 [177–224]    | 179 [174–191]    | 172 [169–174]    |
| JS heap after GC (MB)    | 301              | 299              | 299              | 297              | 296              |

4x CPU throttle, 3 runs:

| 1000 rows, 4x            | baseline | A+B   | Bfull |
| ------------------------ | -------- | ----- | ----- |
| Load to idle             | 12035    | 10795 | 7790  |
| Select all               | 1424     | 504   | 488   |
| Row checkbox             | 1304     | 408   | 392   |
| Column resize, per frame | 1825     | 797   | 751   |

- 25 rows: every variant within noise (load about 65–75ms, select all 16ms, row click 32–40ms).
- `v-select` with 200 options at 4x: open went from 128–144ms to 104–112ms with Bfull. Typing stays under 16ms (search
  is debounced).
- Raw output is in [results/](results).

## How it's measured

- Load: client-side route change to `bench_items`, until the last long task ends, with 1.5s of quiet required.
- Clicks: Event Timing duration (input to next paint).
- Resize: 10 pointermove ticks, each timed from event to the next frame. Column widths are reset before each run, and
  the script checks the column actually moved 80px.
- Heap: `JSHeapUsedSize` after two forced GCs.

## Running it

Needs Node 24+ (the API depends on `isolated-vm`).

1. `pnpm install && pnpm build`, then bootstrap the API with sqlite on port 8155 and an admin of `admin@example.com` /
   `benchpass`.
2. `node perfbench/seed.mjs && node perfbench/seed-select.mjs` to create `bench_items` and related collections.
3. For each variant: `git apply perfbench/patches/<variant>.patch`, `pnpm --filter @directus/app build`,
   `cp -R app/dist /tmp/perfbench-dists/<variant>`, then `git checkout app packages`.
4. `cd perfbench && npm install && ./run-all.sh` (and `./run-extra.sh` for the select bench and screenshots). Output
   goes to `/tmp/perfbench-results/`. `node summ.mjs /tmp/perfbench-results/*-x1.json` prints medians per variant.

---

# Other benches

Each folder below is its own harness for a later perf PR. They share the API and seed data above.

## Form typing (`form/`), #28439

Item edit page, typing 20 characters into a text input, keydown to the next frame. Seeds a 52-field collection (inputs, selects, toggles, datetime, M2O, JSON, 3 detail groups and an accordion) plus a copy with 5 fields that have conditions.

1. `cp api/bench.db /tmp/perfbench-form/bench.db`, then start the API on 8165 against it (`CONFIG_PATH` with your own env, `PORT=8165`) and run `node form/seed-form.mjs`.
2. Build each variant's app into `/tmp/perfbench-dists/<variant>` (see "Running it" above).
3. `cd form && npm install && ./session.sh [--seed] baseline <variant>`. Results go to `/tmp/perfbench-form/results`. `node summ-form.mjs` prints medians. `vis-form.mjs` takes the screenshots.

## Field lookups (`fields/`), field store indexing PR

The tabular bench and an item form bench, run on a "big" project as well as the stock one. `seed-extra.mjs` adds 22 collections × ~100 fields and 30 more relations to a copy of `bench.db`, about 2.7k fields total. The unlicensed API caps a project at 25 collections, so it's fewer, wider collections.

- Local: put an env file at `/tmp/perfbench-fields/api.env` (`PORT=8175`, sqlite, admin `admin@example.com` / `benchpass`), then `./measure-ab.sh <tag> <db> <throttle> <rounds> baseline <variant>`. It runs the variants interleaved (A B A B) so machine load hits each one equally.
- Quiet machine: `box/` is the same thing for a Linux box. `setup.sh` clones the repo, builds `main` and `main` + the PR (`FM_REF=<branch>`), and migrates the DBs. `runs.sh` runs everything. Set `CHROME` to a Chrome binary.

Results in `fields/results/` are from an idle 16-core Linux box, `main` vs `main` + the PR, 1000 rows, median of 5 (3 at 4x CPU):

| 1000 rows       | Normal project (~490 fields) | Big project (~2.7k fields) |
| --------------- | ---------------------------- | -------------------------- |
| Load            | 3.5s → 2.3s                  | 5.7s → 2.3s                |
| Load, 4x CPU    | 13.8s → 9.2s                 | 32.4s → 9.2s               |
| Memory after GC | 296 → 181 MB                 | 496 → 184 MB               |

## Selection check (`selection/`), #28438

`node selection/micro.mjs` times just the per-row selection check for 1000 rows with 1000 selected: about 5ms per render with the old array scan, 0.03ms with a `Set`. The end-to-end numbers in #28438 come from the main tabular bench above.

Row redraw (#28437) also uses the main tabular bench.

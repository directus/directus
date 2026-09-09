import { setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

/*
 * maplibre is ESM-only from v6 and locates its worker at runtime with
 * `new URL('./' + filename, import.meta.url)`, choosing the filename through a dev/prod ternary.
 * Rollup cannot follow a computed specifier, so Vite emits no worker asset and the production
 * bundle ends up requesting one that was never built, leaving the map stuck with no tiles.
 *
 * This only reproduces in a real build. Under `vite dev` the request resolves, because the dev
 * server serves the file straight out of node_modules.
 *
 * `?worker&url` rather than plain `?url`: the dist worker imports its sibling
 * `maplibre-gl-shared.mjs`, and `?url` would emit the worker on its own, so it would fail on that
 * first import instead.
 *
 * Import this module for its side effect anywhere a `Map` is constructed.
 */
setWorkerUrl(workerUrl);

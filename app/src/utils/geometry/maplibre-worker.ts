import { setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

/*
 * maplibre locates its worker through a computed `import.meta.url`, which Rollup cannot follow, so
 * without this Vite emits no worker asset and production builds request one that was never built.
 * Dev is unaffected, which is why this only shows up in a real build.
 *
 * `?worker&url` and not `?url`: the worker imports a sibling chunk that `?url` would not emit.
 *
 * Import for the side effect anywhere a `Map` is constructed.
 */
setWorkerUrl(workerUrl);

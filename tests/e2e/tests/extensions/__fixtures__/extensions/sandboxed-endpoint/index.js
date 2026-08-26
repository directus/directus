import { log, request, sleep } from 'directus:api';

/**
 * Sandboxed endpoint extension used to exercise the isolated-vm extension sandbox end to end.
 *
 * Each route deliberately crosses the host<->isolate boundary through the SDK so the test
 * validates the reference bridging (evalClosure, References, copy/promise transfer) that an
 * isolated-vm major bump is most likely to break.
 */
export default (router) => {
	// Happy path: sync host function (log) + async host function (sleep) + the route
	// handler round-trip (callReference applies args by copy and returns a referenced promise).
	router.get('/ping', async (req) => {
		log('sandboxed endpoint: ping');
		await sleep(1);

		return {
			status: 200,
			body: JSON.stringify({ ok: true, url: req.url }),
		};
	});

	// Permission denial + async error propagation across the boundary: this extension did not
	// request the "request" scope, so calling it must throw inside the isolate and surface as an
	// error response (never reaching the network).
	router.get('/forbidden', async () => {
		await request('https://example.com', {});

		return { status: 200, body: 'unreachable' };
	});
};

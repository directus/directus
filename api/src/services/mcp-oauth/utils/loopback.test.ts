import { describe, expect, it } from 'vitest';
import { isLoopbackHost } from './loopback.js';

describe('isLoopbackHost', () => {
	it.each(['localhost', '127.0.0.1', '[::1]'])('recognizes %s as loopback', (host) => {
		expect(isLoopbackHost(host)).toBe(true);
	});

	it.each(['example.com', '127.0.0.2', '10.0.0.1', '[::2]', '', '0.0.0.0'])('rejects non-loopback %s', (host) => {
		expect(isLoopbackHost(host)).toBe(false);
	});

	it('matches the bracketed IPv6 form returned by URL.hostname on Node 22+', () => {
		const host = new URL('http://[::1]:3000/callback').hostname;
		expect(isLoopbackHost(host)).toBe(true);
	});
});

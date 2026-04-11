/**
 * Check if a URL hostname is a loopback address (localhost, 127.0.0.1, [::1]).
 * URL.hostname returns '[::1]' with brackets for IPv6 on Node 22+.
 */
export function isLoopbackHost(hostname: string): boolean {
	return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

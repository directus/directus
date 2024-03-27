/**
 * Fallback generator function to get increment id's for subscriptions
 */
export function* generateUid(): Generator<string, string, unknown> {
	let uid = 1;

	while (true) {
		yield String(uid);
		uid++;
	}
}

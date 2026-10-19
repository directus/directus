import { vi } from 'vitest';

/** In-memory bus, mirroring the synchronous delivery of `BusLocal` */
export function createMockBus() {
	const handlers = new Map<string, Set<(payload: any) => void>>();

	/** Lets a test act while the leader is publishing, and hold it there by returning a promise */
	let onPublish: (() => void | Promise<void>) | undefined;

	return {
		bus: {
			publish: vi.fn(async (channel: string, payload: unknown) => {
				handlers.get(channel)?.forEach((handler) => handler(payload));
				await onPublish?.();
			}),
			subscribe: vi.fn(async (channel: string, handler: (payload: any) => void) => {
				const set = handlers.get(channel) ?? new Set();
				set.add(handler);
				handlers.set(channel, set);
			}),
			unsubscribe: vi.fn(async (channel: string, handler: (payload: any) => void) => {
				handlers.get(channel)?.delete(handler);
			}),
		},
		subscriberCount: (channel: string) => handlers.get(channel)?.size ?? 0,
		setOnPublish: (callback: (() => void | Promise<void>) | undefined) => (onPublish = callback),
	};
}

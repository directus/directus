import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DirectusFrame } from './directus-frame.ts';
import { EditableStore } from './editable-store.ts';

vi.mock('./editable-store.ts', () => ({
	EditableStore: {
		getItem: vi.fn(),
		getItemByKey: vi.fn(),
		getItemByEditConfig: vi.fn(),
		getHoveredItems: vi.fn(),
		addItem: vi.fn(),
		activateItems: vi.fn(),
		enableItems: vi.fn(),
		disableItems: vi.fn(),
		removeItems: vi.fn(),
		highlightItems: vi.fn(),
		highlightElement: vi.fn(),
	},
}));

const ORIGIN = 'https://directus.example.com';

function makeEvent(origin: string, action: string, data: unknown): MessageEvent {
	return { origin, data: { action, data } } as MessageEvent;
}

describe('DirectusFrame', () => {
	let postMessageSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		(DirectusFrame as any).SINGLETON = undefined;
		vi.clearAllMocks();
		postMessageSpy = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.clearAllTimers();
		vi.useRealTimers();
	});

	it('returns same singleton instance on second construction', () => {
		const a = new DirectusFrame();
		const b = new DirectusFrame();
		expect(a).toBe(b);
	});

	describe('connect()', () => {
		it('stores origin and sends connect action to parent', () => {
			const frame = new DirectusFrame();
			const result = frame.connect(ORIGIN);

			expect(result).toBe(true);
			expect(postMessageSpy).toHaveBeenCalledOnce();

			expect(postMessageSpy).toHaveBeenCalledWith({ action: 'connect', data: undefined }, ORIGIN);
		});
	});

	describe('send()', () => {
		it('posts message with action and data when origin is set', () => {
			const frame = new DirectusFrame();
			frame.connect(ORIGIN);
			postMessageSpy.mockClear();

			frame.send('edit', { key: 'k1', editConfig: { collection: 'articles', item: 1 } });

			expect(postMessageSpy).toHaveBeenCalledOnce();

			expect(postMessageSpy).toHaveBeenCalledWith(
				{ action: 'edit', data: { key: 'k1', editConfig: { collection: 'articles', item: 1 } } },
				ORIGIN,
			);
		});

		it('returns true on success', () => {
			const frame = new DirectusFrame();
			frame.connect(ORIGIN);
			postMessageSpy.mockClear();

			expect(frame.send('connect')).toBe(true);
		});

		it('does not call postMessage and returns false when origin is not set', () => {
			vi.spyOn(console, 'error').mockImplementation(() => {});
			const frame = new DirectusFrame();

			const result = frame.send('connect');

			expect(result).toBe(false);
			expect(postMessageSpy).not.toHaveBeenCalled();
		});

		it('returns false when postMessage throws', () => {
			const frame = new DirectusFrame();
			frame.connect(ORIGIN);

			postMessageSpy.mockImplementation(() => {
				throw new Error('cross-origin postMessage blocked');
			});

			const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			const result = frame.send('connect');
			errorSpy.mockRestore();

			expect(result).toBe(false);
		});
	});

	describe('receive() ', () => {
		it('ignores messages from a different origin', () => {
			const frame = new DirectusFrame();
			frame.connect(ORIGIN);

			frame.receive(makeEvent('https://different.origin.com', 'showEditableElements', true));

			expect(EditableStore.highlightItems).not.toHaveBeenCalled();
		});

		it('receives confirm action via window message', () => {
			const frame = new DirectusFrame();
			frame.connect(ORIGIN);

			window.dispatchEvent(
				new MessageEvent('message', { origin: ORIGIN, data: { action: 'confirm', data: { aiEnabled: true } } }),
			);

			expect(frame.isAiEnabled()).toBe(true);
		});

		describe('confirm action', () => {
			it('sets aiEnabled to true when confirm carries aiEnabled: true', () => {
				const frame = new DirectusFrame();
				frame.connect(ORIGIN);

				frame.receive(makeEvent(ORIGIN, 'confirm', { aiEnabled: true }));

				expect(frame.isAiEnabled()).toBe(true);
			});

			it('sets aiEnabled to false when confirm carries aiEnabled: false', () => {
				const frame = new DirectusFrame();
				frame.connect(ORIGIN);

				frame.receive(makeEvent(ORIGIN, 'confirm', { aiEnabled: false }));

				expect(frame.isAiEnabled()).toBe(false);
			});
		});

		describe('showEditableElements action', () => {
			it('highlights items when data is truthy', () => {
				const frame = new DirectusFrame();
				frame.connect(ORIGIN);

				frame.receive(makeEvent(ORIGIN, 'showEditableElements', true));

				expect(EditableStore.highlightItems).toHaveBeenCalledOnce();
				expect(EditableStore.highlightItems).toHaveBeenCalledWith(true);
			});

			it('removes highlight when data is falsy', () => {
				const frame = new DirectusFrame();
				frame.connect(ORIGIN);

				frame.receive(makeEvent(ORIGIN, 'showEditableElements', null));

				expect(EditableStore.highlightItems).toHaveBeenCalledOnce();
				expect(EditableStore.highlightItems).toHaveBeenCalledWith(false);
			});
		});

		describe('saved action', () => {
			it('calls onSaved callback when item is found and has onSaved function', () => {
				const onSaved = vi.fn();
				vi.mocked(EditableStore.getItemByKey).mockReturnValue({ onSaved } as any);

				const frame = new DirectusFrame();
				frame.connect(ORIGIN);

				frame.receive(
					makeEvent(ORIGIN, 'saved', { key: 'k1', collection: 'articles', item: 1, payload: { title: 'New' } }),
				);

				expect(onSaved).toHaveBeenCalledOnce();
				expect(onSaved).toHaveBeenCalledWith({ collection: 'articles', item: 1, payload: { title: 'New' } });
			});

			it('does not reload when onSaved callback is present', () => {
				const reloadSpy = vi.fn();
				vi.spyOn(window, 'location', 'get').mockReturnValue({ reload: reloadSpy } as any);

				vi.mocked(EditableStore.getItemByKey).mockReturnValue({ onSaved: vi.fn() } as any);

				const frame = new DirectusFrame();
				frame.connect(ORIGIN);

				frame.receive(makeEvent(ORIGIN, 'saved', { key: 'k1', collection: 'articles', item: 1, payload: {} }));

				expect(reloadSpy).not.toHaveBeenCalled();
			});

			it('reloads when item is not in the store', () => {
				const reloadSpy = vi.fn();
				vi.spyOn(window, 'location', 'get').mockReturnValue({ reload: reloadSpy } as any);
				vi.mocked(EditableStore.getItemByKey).mockReturnValue(undefined);

				const frame = new DirectusFrame();
				frame.connect(ORIGIN);

				frame.receive(makeEvent(ORIGIN, 'saved', { key: 'k1', collection: 'articles', item: 1, payload: {} }));

				expect(reloadSpy).toHaveBeenCalledOnce();
			});

			it('reloads when item has no onSaved callback', () => {
				const reloadSpy = vi.fn();
				vi.spyOn(window, 'location', 'get').mockReturnValue({ reload: reloadSpy } as any);
				vi.mocked(EditableStore.getItemByKey).mockReturnValue({ onSaved: undefined } as any);

				const frame = new DirectusFrame();
				frame.connect(ORIGIN);

				frame.receive(makeEvent(ORIGIN, 'saved', { key: 'k1', collection: 'articles', item: 1, payload: {} }));

				expect(reloadSpy).toHaveBeenCalledOnce();
			});
		});

		describe('highlightElement action', () => {
			it('passes { key } to highlightElement when key is a string', () => {
				const frame = new DirectusFrame();
				frame.connect(ORIGIN);

				frame.receive(makeEvent(ORIGIN, 'highlightElement', { key: 'uuid-1' }));

				expect(EditableStore.highlightElement).toHaveBeenCalledOnce();
				expect(EditableStore.highlightElement).toHaveBeenCalledWith({ key: 'uuid-1' });
			});

			it('passes null to highlightElement when key is null and clears highlight', () => {
				const frame = new DirectusFrame();
				frame.connect(ORIGIN);

				frame.receive(makeEvent(ORIGIN, 'highlightElement', { key: null }));

				expect(EditableStore.highlightElement).toHaveBeenCalledOnce();
				expect(EditableStore.highlightElement).toHaveBeenCalledWith(null);
			});

			it('passes null to highlightElement when data is null and clears highlight', () => {
				const frame = new DirectusFrame();
				frame.connect(ORIGIN);

				frame.receive(makeEvent(ORIGIN, 'highlightElement', null));

				expect(EditableStore.highlightElement).toHaveBeenCalledOnce();
				expect(EditableStore.highlightElement).toHaveBeenCalledWith(null);
			});

			it('passes { collection, item } without fields when fields is absent', () => {
				const frame = new DirectusFrame();
				frame.connect(ORIGIN);

				frame.receive(makeEvent(ORIGIN, 'highlightElement', { collection: 'articles', item: 1 }));

				expect(EditableStore.highlightElement).toHaveBeenCalledOnce();
				expect(EditableStore.highlightElement).toHaveBeenCalledWith({ collection: 'articles', item: 1 });
			});

			it('passes { collection, item, fields } when fields is present', () => {
				const frame = new DirectusFrame();
				frame.connect(ORIGIN);

				frame.receive(
					makeEvent(ORIGIN, 'highlightElement', { collection: 'articles', item: 1, fields: ['title', 'body'] }),
				);

				expect(EditableStore.highlightElement).toHaveBeenCalledOnce();

				expect(EditableStore.highlightElement).toHaveBeenCalledWith({
					collection: 'articles',
					item: 1,
					fields: ['title', 'body'],
				});
			});
		});
	});

	describe('checkFieldAccess action', () => {
		it('sends checkFieldAccess action with the provided items', () => {
			const frame = new DirectusFrame();
			frame.connect(ORIGIN);
			postMessageSpy.mockClear();

			const items = [{ key: 'k1', collection: 'articles', item: 1, fields: ['title'] }];
			frame.send('checkFieldAccess', items);

			expect(postMessageSpy).toHaveBeenCalledWith({ action: 'checkFieldAccess', data: items }, ORIGIN);
		});

		it('activates items with permitted keys when activateElements is received', () => {
			const frame = new DirectusFrame();
			frame.connect(ORIGIN);

			frame.send('checkFieldAccess', [{ key: 'k1', collection: 'articles', item: 1, fields: [] }]);
			frame.receive(makeEvent(ORIGIN, 'activateElements', ['k1']));

			expect(EditableStore.activateItems).toHaveBeenCalledOnce();
			expect(EditableStore.activateItems).toHaveBeenCalledWith(['k1']);
		});

		it('activates items with empty array when activateElements data is not an array', () => {
			const frame = new DirectusFrame();
			frame.connect(ORIGIN);

			frame.send('checkFieldAccess', []);
			frame.receive(makeEvent(ORIGIN, 'activateElements', null));

			expect(EditableStore.activateItems).toHaveBeenCalledOnce();
			expect(EditableStore.activateItems).toHaveBeenCalledWith([]);
		});
	});

	describe('receiveConfirm()', () => {
		it('resolves true immediately when already confirmed before polling begins', async () => {
			vi.useFakeTimers();

			const frame = new DirectusFrame();
			frame.connect(ORIGIN);
			frame.receive(makeEvent(ORIGIN, 'confirm', { aiEnabled: false }));

			const result = await frame.receiveConfirm();

			expect(result).toBe(true);
		});

		it('resolves true when confirm arrives between polls', async () => {
			vi.useFakeTimers();

			const frame = new DirectusFrame();
			frame.connect(ORIGIN);

			const promise = frame.receiveConfirm();

			frame.receive(makeEvent(ORIGIN, 'confirm', { aiEnabled: false }));
			await vi.advanceTimersByTimeAsync(100);

			expect(await promise).toBe(true);
		});

		it('resolves false after exhausting all 10 attempts (1000 ms)', async () => {
			vi.useFakeTimers();

			const frame = new DirectusFrame();
			frame.connect(ORIGIN);

			const promise = frame.receiveConfirm();

			await vi.advanceTimersByTimeAsync(1100);

			expect(await promise).toBe(false);
		});
	});
});

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PageManager } from './page-manager.ts';

describe('PageManager', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		(PageManager as unknown as { navigationInitialized: boolean }).navigationInitialized = false;

		Object.defineProperty(window, 'location', {
			value: { href: 'http://localhost/' },
			writable: true,
			configurable: true,
		});

		document.title = 'Test Page';
	});

	afterEach(() => {
		vi.clearAllTimers();
		vi.useRealTimers();
	});

	describe('onNavigation', () => {
		it('rejects a second onNavigation call and never invokes the second callback', async () => {
			const callback1 = vi.fn();
			const callback2 = vi.fn();

			PageManager.onNavigation(callback1);
			PageManager.onNavigation(callback2);

			await vi.advanceTimersByTimeAsync(100);

			expect(callback1).toHaveBeenCalledOnce();
			expect(callback2).not.toHaveBeenCalled();
		});

		it('fires callback with current url and title on first call', async () => {
			const callback = vi.fn();

			PageManager.onNavigation(callback);
			await vi.advanceTimersByTimeAsync(100);

			expect(callback).toHaveBeenCalledOnce();
			expect(callback).toHaveBeenCalledWith({ url: 'http://localhost/', title: 'Test Page' });
		});

		it('does not fire callback again when url and title are unchanged', async () => {
			const callback = vi.fn();

			PageManager.onNavigation(callback);
			await vi.advanceTimersByTimeAsync(700);

			expect(callback).toHaveBeenCalledOnce();
		});

		it('fires callback after url changes', async () => {
			const callback = vi.fn();

			PageManager.onNavigation(callback);
			await vi.advanceTimersByTimeAsync(100);
			callback.mockClear();

			window.location.href = 'http://localhost/page2';
			await vi.advanceTimersByTimeAsync(200); // next poll
			await vi.advanceTimersByTimeAsync(100); // debounce

			expect(callback).toHaveBeenCalledOnce();
			expect(callback).toHaveBeenCalledWith({ url: 'http://localhost/page2', title: 'Test Page' });
		});

		it('fires callback after title-only change', async () => {
			const callback = vi.fn();

			PageManager.onNavigation(callback);
			await vi.advanceTimersByTimeAsync(100);
			callback.mockClear();

			document.title = 'New Title';
			await vi.advanceTimersByTimeAsync(200); // next poll
			await vi.advanceTimersByTimeAsync(100); // debounce

			expect(callback).toHaveBeenCalledOnce();
			expect(callback).toHaveBeenCalledWith({ url: 'http://localhost/', title: 'New Title' });
		});

		it('debounces rapid consecutive url changes and delivers only the last one', async () => {
			const callback = vi.fn();

			PageManager.onNavigation(callback);
			await vi.advanceTimersByTimeAsync(100);
			callback.mockClear();

			window.location.href = 'http://localhost/page1';
			await vi.advanceTimersByTimeAsync(150);

			window.location.href = 'http://localhost/page2';
			await vi.advanceTimersByTimeAsync(50);

			await vi.advanceTimersByTimeAsync(100);

			expect(callback).toHaveBeenCalledOnce();
			expect(callback).toHaveBeenCalledWith({ url: 'http://localhost/page2', title: 'Test Page' });
		});
	});
});

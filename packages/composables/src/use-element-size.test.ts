/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, ref } from 'vue';
import { useElementSize } from './use-element-size.js';

// Helper function to test composables in a proper Vue context
function withSetup<T>(composable: () => T): T {
	let result: T;

	const app = createApp(
		defineComponent({
			setup() {
				result = composable();
				return () => {};
			},
		}),
	);

	const container = document.createElement('div');
	app.mount(container);

	// Clean up
	app.unmount();

	return result!;
}

// Mock ResizeObserver
class MockResizeObserver {
	private callback: ResizeObserverCallback;
	private elements: Set<Element> = new Set();

	constructor(callback: ResizeObserverCallback) {
		this.callback = callback;
	}

	observe(element: Element) {
		this.elements.add(element);
	}

	unobserve(element: Element) {
		this.elements.delete(element);
	}

	disconnect() {
		this.elements.clear();
	}

	// Helper method for testing - trigger resize event
	trigger(entries: ResizeObserverEntry[]) {
		this.callback(entries, this);
	}
}

// Mock for ResizeObserverEntry
function createMockResizeObserverEntry(
	width: number,
	height: number,
	element: Element = document.createElement('div'),
): ResizeObserverEntry {
	return {
		target: element,
		contentRect: {
			width,
			height,
			top: 0,
			left: 0,
			bottom: height,
			right: width,
			x: 0,
			y: 0,
		} as DOMRectReadOnly,
		borderBoxSize: [] as any,
		contentBoxSize: [] as any,
		devicePixelContentBoxSize: [] as any,
	};
}

describe('useElementSize', () => {
	let mockResizeObserver: MockResizeObserver;
	let originalResizeObserver: any;

	beforeEach(() => {
		// Store original ResizeObserver
		originalResizeObserver = global.ResizeObserver;

		// Mock ResizeObserver
		mockResizeObserver = new MockResizeObserver(() => {});

		global.ResizeObserver = vi.fn().mockImplementation((callback) => {
			mockResizeObserver = new MockResizeObserver(callback);
			return mockResizeObserver;
		});
	});

	afterEach(() => {
		// Restore original ResizeObserver
		global.ResizeObserver = originalResizeObserver;
		vi.clearAllMocks();
	});

	it('should initialize with zero width and height', () => {
		const element = document.createElement('div');
		const result = withSetup(() => useElementSize(element));

		expect(result.width.value).toBe(0);
		expect(result.height.value).toBe(0);
	});

	it('should work with a direct element reference', () => {
		const element = document.createElement('div');
		const result = withSetup(() => useElementSize(element));

		// Simulate resize event
		const entry = createMockResizeObserverEntry(100, 50, element);
		mockResizeObserver.trigger([entry]);

		expect(result.width.value).toBe(100);
		expect(result.height.value).toBe(50);
	});

	it('should work with a Vue ref containing an element', () => {
		const element = document.createElement('div');
		const elementRef = ref(element);
		const result = withSetup(() => useElementSize(elementRef));

		// Simulate resize event
		const entry = createMockResizeObserverEntry(200, 100, element);
		mockResizeObserver.trigger([entry]);

		expect(result.width.value).toBe(200);
		expect(result.height.value).toBe(100);
	});

	it('should handle Vue ref with undefined value', () => {
		const elementRef = ref<HTMLDivElement | undefined>(undefined);
		const result = withSetup(() => useElementSize(elementRef));

		expect(result.width.value).toBe(0);
		expect(result.height.value).toBe(0);

		// Should not throw when trying to observe undefined element
		expect(() => {
			// Simulate what would happen in onMounted
			const t = elementRef.value;

			if (t) {
				mockResizeObserver.observe(t);
			}
		}).not.toThrow();
	});

	it('should update reactive values when element size changes', () => {
		const element = document.createElement('div');
		const result = withSetup(() => useElementSize(element));

		// Initial resize
		let entry = createMockResizeObserverEntry(100, 50, element);
		mockResizeObserver.trigger([entry]);

		expect(result.width.value).toBe(100);
		expect(result.height.value).toBe(50);

		// Size change
		entry = createMockResizeObserverEntry(300, 200, element);
		mockResizeObserver.trigger([entry]);

		expect(result.width.value).toBe(300);
		expect(result.height.value).toBe(200);
	});

	it('should handle empty resize observer entries gracefully', () => {
		const element = document.createElement('div');
		const result = withSetup(() => useElementSize(element));

		// Trigger with empty entries array
		mockResizeObserver.trigger([]);

		expect(result.width.value).toBe(0);
		expect(result.height.value).toBe(0);
	});

	it('should handle resize observer entry with undefined entry', () => {
		const element = document.createElement('div');
		const result = withSetup(() => useElementSize(element));

		// Trigger with undefined entry (simulating edge case)
		mockResizeObserver.trigger([undefined as any]);

		expect(result.width.value).toBe(0);
		expect(result.height.value).toBe(0);
	});

	it('should handle fractional dimensions correctly', () => {
		const element = document.createElement('div');
		const result = withSetup(() => useElementSize(element));

		// Test with fractional values
		const entry = createMockResizeObserverEntry(123.456, 67.89, element);
		mockResizeObserver.trigger([entry]);

		expect(result.width.value).toBe(123.456);
		expect(result.height.value).toBe(67.89);
	});

	it('should maintain reactive references correctly', () => {
		const element = document.createElement('div');
		const result = withSetup(() => useElementSize(element));

		// Test that returned refs are actually reactive Vue refs
		expect(result.width).toHaveProperty('value');
		expect(result.height).toHaveProperty('value');

		// Verify they can be watched/tracked
		const originalWidth = result.width.value;
		const originalHeight = result.height.value;

		const entry = createMockResizeObserverEntry(999, 888, element);
		mockResizeObserver.trigger([entry]);

		const widthChanged = result.width.value !== originalWidth;
		const heightChanged = result.height.value !== originalHeight;

		expect(widthChanged).toBe(true);
		expect(heightChanged).toBe(true);
	});

	it('should create ResizeObserver on setup', () => {
		const element = document.createElement('div');
		const mockConstructor = vi.mocked(global.ResizeObserver);

		withSetup(() => useElementSize(element));

		expect(mockConstructor).toHaveBeenCalled();
		expect(mockConstructor).toHaveBeenCalledWith(expect.any(Function));
	});

	it('should handle different element types correctly', () => {
		const element = document.createElement('canvas');
		const result = withSetup(() => useElementSize(element));

		const entry = createMockResizeObserverEntry(400, 300, element);
		mockResizeObserver.trigger([entry]);

		expect(result.width.value).toBe(400);
		expect(result.height.value).toBe(300);
	});

	it('should work with null element initially and update when element becomes available', () => {
		const elementRef = ref<HTMLDivElement | undefined>(undefined);
		const result = withSetup(() => useElementSize(elementRef));

		// Initially should be 0,0
		expect(result.width.value).toBe(0);
		expect(result.height.value).toBe(0);

		// Set element later
		const element = document.createElement('div');
		elementRef.value = element;

		// Trigger resize
		const entry = createMockResizeObserverEntry(150, 100, element);
		mockResizeObserver.trigger([entry]);

		expect(result.width.value).toBe(150);
		expect(result.height.value).toBe(100);
	});
});

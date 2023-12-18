import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, test, vi, type MockInstance } from 'vitest';
import { DefineComponent, defineComponent, h, onMounted, onUnmounted } from 'vue';

import { time as timeoutDuration } from './idle';

vi.mock('lodash', () => ({
	throttle: vi.fn((fn, _wait) => fn),
}));

describe('idle', () => {
	let testComponent: DefineComponent<any>;
	let idleTrackerEmitSpy: MockInstance;

	beforeEach(async () => {
		vi.useFakeTimers();

		const { idleTracker, startIdleTracking, stopIdleTracking } = await import('./idle');

		testComponent = defineComponent({
			setup() {
				onMounted(() => startIdleTracking());
				onUnmounted(() => stopIdleTracking());
			},
			render: () => h('div'),
		});

		idleTrackerEmitSpy = vi.spyOn(idleTracker, 'emit');
	});

	afterEach(() => {
		vi.useRealTimers();

		// Ensure the internal visible & idle variables in the imported idle
		// are reset before every test
		vi.resetModules();
	});

	test('should emit "hide"/"show" when document visibility changes', () => {
		mount(testComponent);

		// mock document visibility state
		Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });

		document.dispatchEvent(new Event('visibilitychange'));

		expect(idleTrackerEmitSpy).toHaveBeenCalledWith('hide');

		// mock document visibility state
		Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });

		document.dispatchEvent(new Event('visibilitychange'));

		expect(idleTrackerEmitSpy).toHaveBeenCalledWith('show');
	});

	test('should not emit "idle" before the timeout has passed', () => {
		mount(testComponent);

		document.dispatchEvent(new PointerEvent('pointerdown'));

		// advance less than the idle timeout duration
		vi.advanceTimersByTime(1000);

		expect(idleTrackerEmitSpy).not.toHaveBeenCalledWith('idle');
	});

	test('should emit "idle" after the timeout has passed', () => {
		mount(testComponent);

		document.dispatchEvent(new PointerEvent('pointerdown'));

		// advance past the idle timeout duration (added 1000 just in case there's timing issues)
		vi.advanceTimersByTime(timeoutDuration + 1000);

		expect(idleTrackerEmitSpy).toHaveBeenCalledWith('idle');
	});

	test('should emit "active" after being idle', () => {
		mount(testComponent);

		document.dispatchEvent(new PointerEvent('pointerdown'));

		// advance past the idle timeout duration (added 1000 just in case there's timing issues)
		vi.advanceTimersByTime(timeoutDuration + 1000);

		// stop the current idle state
		document.dispatchEvent(new PointerEvent('pointerdown'));

		// advance past the throttle duration (500)
		vi.advanceTimersByTime(1000);

		expect(idleTrackerEmitSpy).toHaveBeenCalledWith('active');
	});
});

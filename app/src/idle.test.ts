import { Events } from './events';
import { time as timeoutDuration } from './idle';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, type MockInstance, test, vi } from 'vitest';
import { DefineComponent, defineComponent, h, onMounted, onUnmounted } from 'vue';

vi.mock('lodash', () => ({
	throttle: vi.fn((fn, _wait) => fn),
}));

describe('idle', () => {
	let testComponent: DefineComponent<any>;
	let idleTrackerEmitSpy: MockInstance;

	beforeEach(async () => {
		vi.useFakeTimers();

		const { startIdleTracking, stopIdleTracking } = await import('./idle');
		const { emitter } = await import('./events');

		testComponent = defineComponent({
			setup() {
				onMounted(() => startIdleTracking());
				onUnmounted(() => stopIdleTracking());
			},
			render: () => h('div'),
		});

		idleTrackerEmitSpy = vi.spyOn(emitter, 'emit');
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

		expect(idleTrackerEmitSpy).toHaveBeenCalledWith(Events.tabIdle);

		// mock document visibility state
		Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });

		document.dispatchEvent(new Event('visibilitychange'));

		expect(idleTrackerEmitSpy).toHaveBeenCalledWith(Events.tabActive);
	});

	test('should not emit "idle" before the timeout has passed', () => {
		mount(testComponent);

		document.dispatchEvent(new PointerEvent('pointerdown'));

		// advance less than the idle timeout duration
		vi.advanceTimersByTime(1000);

		expect(idleTrackerEmitSpy).not.toHaveBeenCalledWith(Events.tabIdle);
	});

	test('should emit "idle" after the timeout has passed', () => {
		mount(testComponent);

		document.dispatchEvent(new PointerEvent('pointerdown'));

		// advance past the idle timeout duration (added 1000 just in case there's timing issues)
		vi.advanceTimersByTime(timeoutDuration + 1000);

		expect(idleTrackerEmitSpy).toHaveBeenCalledWith(Events.tabIdle);
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

		expect(idleTrackerEmitSpy).toHaveBeenCalledWith(Events.tabActive);
	});
});

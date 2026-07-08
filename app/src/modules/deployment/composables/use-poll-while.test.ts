import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref, type Ref } from 'vue';
import { usePollWhile } from './use-poll-while';

function createTestComponent(shouldPoll: Ref<boolean>, tick: () => Promise<void>, options?: any) {
	return defineComponent({
		setup() {
			usePollWhile(shouldPoll, tick, options);
			return {};
		},
		render: () => h('div'),
	});
}

describe('usePollWhile', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('should not tick while shouldPoll is false', async () => {
		const shouldPoll = ref(false);
		const tick = vi.fn().mockResolvedValue(undefined);

		mount(createTestComponent(shouldPoll, tick));
		await vi.advanceTimersByTimeAsync(10_000);

		expect(tick).not.toHaveBeenCalled();
	});

	it('should tick immediately and then on the interval by default', async () => {
		const shouldPoll = ref(true);
		const tick = vi.fn().mockResolvedValue(undefined);

		mount(createTestComponent(shouldPoll, tick, { intervalMs: 1000 }));
		await vi.advanceTimersByTimeAsync(0);
		expect(tick).toHaveBeenCalledTimes(1);

		await vi.advanceTimersByTimeAsync(1000);
		expect(tick).toHaveBeenCalledTimes(2);
	});

	it('should skip the immediate tick when immediate is false', async () => {
		const shouldPoll = ref(true);
		const tick = vi.fn().mockResolvedValue(undefined);

		mount(createTestComponent(shouldPoll, tick, { intervalMs: 1000, immediate: false }));
		await vi.advanceTimersByTimeAsync(0);
		expect(tick).not.toHaveBeenCalled();

		await vi.advanceTimersByTimeAsync(1000);
		expect(tick).toHaveBeenCalledTimes(1);
	});

	it('should not overlap a slow tick with the next interval firing', async () => {
		const shouldPoll = ref(true);
		let resolveTick: () => void;

		const tick = vi.fn().mockImplementation(
			() =>
				new Promise<void>((resolve) => {
					resolveTick = resolve;
				}),
		);

		mount(createTestComponent(shouldPoll, tick, { intervalMs: 1000 }));
		await vi.advanceTimersByTimeAsync(0);
		expect(tick).toHaveBeenCalledTimes(1);

		// The first tick is still in flight when the next interval fires — it must be skipped.
		await vi.advanceTimersByTimeAsync(1000);
		expect(tick).toHaveBeenCalledTimes(1);

		resolveTick!();
		await vi.advanceTimersByTimeAsync(0);

		// Once the in-flight tick resolves, the next interval firing ticks again normally.
		await vi.advanceTimersByTimeAsync(1000);
		expect(tick).toHaveBeenCalledTimes(2);
	});

	it('should call onStop when shouldPoll transitions from true to false, but not on initial mount', async () => {
		const shouldPoll = ref(false);
		const tick = vi.fn().mockResolvedValue(undefined);
		const onStop = vi.fn();

		mount(createTestComponent(shouldPoll, tick, { onStop }));
		await vi.advanceTimersByTimeAsync(0);
		expect(onStop).not.toHaveBeenCalled();

		shouldPoll.value = true;
		await vi.advanceTimersByTimeAsync(0);

		shouldPoll.value = false;
		await vi.advanceTimersByTimeAsync(0);

		expect(onStop).toHaveBeenCalledTimes(1);
	});

	it('should stop ticking after unmount', async () => {
		const shouldPoll = ref(true);
		const tick = vi.fn().mockResolvedValue(undefined);

		const wrapper = mount(createTestComponent(shouldPoll, tick, { intervalMs: 1000 }));
		await vi.advanceTimersByTimeAsync(0);
		expect(tick).toHaveBeenCalledTimes(1);

		wrapper.unmount();
		await vi.advanceTimersByTimeAsync(5000);

		expect(tick).toHaveBeenCalledTimes(1);
	});
});

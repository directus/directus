import { type MaybeRefOrGetter, onUnmounted, toValue, watch } from 'vue';

export interface UsePollWhileOptions {
	/** Interval between ticks in milliseconds. Defaults to 3000. */
	intervalMs?: number;
	/** Run `tick` once as soon as polling starts, rather than waiting a full interval. Defaults to true. */
	immediate?: boolean;
	/** Called once when `shouldPoll` transitions from true to false (not called on unmount). */
	onStop?: () => void;
}

export function usePollWhile(
	shouldPoll: MaybeRefOrGetter<boolean>,
	tick: () => Promise<void>,
	options: UsePollWhileOptions = {},
): void {
	const { intervalMs = 3000, immediate = true, onStop } = options;

	let timer: ReturnType<typeof setInterval> | null = null;
	let inFlight = false;

	async function runTick() {
		if (inFlight) return;
		inFlight = true;

		try {
			await tick();
		} finally {
			inFlight = false;
		}
	}

	function start() {
		if (timer) return;
		if (immediate) void runTick();
		timer = setInterval(() => void runTick(), intervalMs);
	}

	function stop() {
		if (timer) {
			clearInterval(timer);
			timer = null;
		}
	}

	watch(
		() => toValue(shouldPoll),
		(active, wasActive) => {
			if (active) {
				start();
			} else {
				stop();
				if (wasActive) onStop?.();
			}
		},
		{ immediate: true },
	);

	onUnmounted(stop);
}

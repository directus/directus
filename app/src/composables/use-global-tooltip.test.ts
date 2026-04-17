import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useGlobalTooltip } from './use-global-tooltip';

describe('useGlobalTooltip', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		const { closeTooltip } = useGlobalTooltip();
		closeTooltip();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('starts closed', () => {
		const { state } = useGlobalTooltip();
		expect(state.open).toBe(false);
	});

	it('opens after delay', () => {
		const { state, openTooltip } = useGlobalTooltip();

		openTooltip({
			content: 'hello',
			side: 'top',
			align: 'center',
			inverted: false,
			monospace: false,
			delayDuration: 500,
			virtualRef: null,
		});

		expect(state.open).toBe(false);
		expect(state.content).not.toBe('hello');
		vi.advanceTimersByTime(500);
		expect(state.open).toBe(true);
		expect(state.content).toBe('hello');
	});

	it('opens immediately when delayDuration is 0', () => {
		const { state, openTooltip } = useGlobalTooltip();

		openTooltip({
			content: 'instant',
			side: 'bottom',
			align: 'center',
			inverted: false,
			monospace: false,
			delayDuration: 0,
			virtualRef: null,
		});

		vi.advanceTimersByTime(0);
		expect(state.open).toBe(true);
	});

	it('closes immediately', () => {
		const { state, openTooltip, closeTooltip } = useGlobalTooltip();

		openTooltip({
			content: 'hello',
			side: 'top',
			align: 'center',
			inverted: false,
			monospace: false,
			delayDuration: 0,
			virtualRef: null,
		});

		vi.advanceTimersByTime(0);
		expect(state.open).toBe(true);

		closeTooltip();
		expect(state.open).toBe(false);
	});

	it('updates content immediately when immediateContent is true', () => {
		const { state, openTooltip } = useGlobalTooltip();

		openTooltip(
			{
				content: 'hello',
				side: 'top',
				align: 'center',
				inverted: false,
				monospace: false,
				delayDuration: 500,
				virtualRef: null,
			},
			true,
		);

		expect(state.content).toBe('hello');
		expect(state.open).toBe(false);
	});

	it('stores kbd keys in state', () => {
		const { state, openTooltip } = useGlobalTooltip();

		openTooltip({
			content: 'Save',
			kbd: ['meta', 's'],
			side: 'top',
			align: 'center',
			inverted: false,
			monospace: false,
			delayDuration: 0,
			virtualRef: null,
		});

		vi.advanceTimersByTime(0);
		expect(state.kbd).toEqual(['meta', 's']);
	});

	it('kbd defaults to undefined when not provided', () => {
		const { state, openTooltip } = useGlobalTooltip();

		openTooltip({
			content: 'hello',
			side: 'top',
			align: 'center',
			inverted: false,
			monospace: false,
			delayDuration: 0,
			virtualRef: null,
		});

		vi.advanceTimersByTime(0);
		expect(state.kbd).toBeUndefined();
	});

	it('cancels pending open when closed before delay', () => {
		const { state, openTooltip, closeTooltip } = useGlobalTooltip();

		openTooltip({
			content: 'hello',
			side: 'top',
			align: 'center',
			inverted: false,
			monospace: false,
			delayDuration: 500,
			virtualRef: null,
		});

		closeTooltip();
		vi.advanceTimersByTime(500);
		expect(state.open).toBe(false);
	});
});

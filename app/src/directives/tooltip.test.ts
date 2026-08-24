import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DirectiveBinding } from 'vue';
import {
	getGlobalTooltip,
	isDisabled,
	resolveAlign,
	resolveSide,
	resolveTooltipValue,
	type TooltipPayload,
} from './tooltip';

function makePayload(overrides: Partial<TooltipPayload> = {}): TooltipPayload {
	return {
		content: 'hello',
		side: 'top',
		align: 'center',
		inverted: false,
		monospace: false,
		delayDuration: 0,
		virtualRef: null,
		...overrides,
	};
}

function createElement(html: string): HTMLElement {
	const div = document.createElement('div');
	div.innerHTML = html;
	return div.firstElementChild as HTMLElement;
}

describe('isDisabled', () => {
	describe('when the element itself is disabled', () => {
		it('returns true for disabled attribute', () => {
			const element = createElement('<button disabled>Click</button>');
			expect(isDisabled(element)).toBe(true);
		});

		it('returns true for aria-disabled="true"', () => {
			const element = createElement('<div aria-disabled="true">Click</div>');
			expect(isDisabled(element)).toBe(true);
		});
	});

	describe('when a direct child is disabled', () => {
		it('returns true for a direct child with disabled attribute', () => {
			const element = createElement('<span><button disabled>Click</button></span>');
			expect(isDisabled(element)).toBe(true);
		});

		it('returns true for a direct child with aria-disabled="true"', () => {
			const element = createElement('<span><div aria-disabled="true">Click</div></span>');
			expect(isDisabled(element)).toBe(true);
		});
	});

	describe('when the element is not disabled', () => {
		it('returns false for an enabled element', () => {
			const element = createElement('<button>Click</button>');
			expect(isDisabled(element)).toBe(false);
		});

		it('returns false when aria-disabled is not "true"', () => {
			const element = createElement('<div aria-disabled="false">Click</div>');
			expect(isDisabled(element)).toBe(false);
		});

		it('returns false when only a deeply nested descendant is disabled', () => {
			const element = createElement('<span><span><button disabled>Click</button></span></span>');
			expect(isDisabled(element)).toBe(false);
		});
	});
});

function makeBinding(overrides: Partial<DirectiveBinding> = {}): DirectiveBinding {
	return {
		value: 'tooltip text',
		oldValue: null,
		arg: undefined,
		modifiers: {},
		instance: null,
		dir: {} as DirectiveBinding['dir'],
		...overrides,
	};
}

describe('resolveSide', () => {
	it('defaults to top', () => {
		expect(resolveSide(makeBinding())).toBe('top');
	});

	it('returns bottom for .bottom modifier', () => {
		expect(resolveSide(makeBinding({ modifiers: { bottom: true } }))).toBe('bottom');
	});

	it('returns left for .left modifier', () => {
		expect(resolveSide(makeBinding({ modifiers: { left: true } }))).toBe('left');
	});

	it('returns right for .right modifier', () => {
		expect(resolveSide(makeBinding({ modifiers: { right: true } }))).toBe('right');
	});

	it('returns top for .top modifier', () => {
		expect(resolveSide(makeBinding({ modifiers: { top: true } }))).toBe('top');
	});

	it('uses binding.arg as fallback', () => {
		expect(resolveSide(makeBinding({ arg: 'bottom' }))).toBe('bottom');
	});
});

describe('resolveAlign', () => {
	it('defaults to center', () => {
		expect(resolveAlign(makeBinding())).toBe('center');
	});

	it('returns start for .start modifier', () => {
		expect(resolveAlign(makeBinding({ modifiers: { start: true } }))).toBe('start');
	});

	it('returns end for .end modifier', () => {
		expect(resolveAlign(makeBinding({ modifiers: { end: true } }))).toBe('end');
	});
});

describe('resolveTooltipValue', () => {
	it('normalizes a string value to { content, kbd: undefined }', () => {
		expect(resolveTooltipValue('hello')).toEqual({ content: 'hello', kbd: undefined });
	});

	it('normalizes an object value with text and kbd', () => {
		expect(resolveTooltipValue({ text: 'Save', kbd: ['meta', 's'] })).toEqual({
			content: 'Save',
			kbd: ['meta', 's'],
		});
	});

	it('normalizes an object value with no kbd', () => {
		expect(resolveTooltipValue({ text: 'Save' })).toEqual({ content: 'Save', kbd: undefined });
	});
});

describe('getGlobalTooltip', () => {
	const resetState = {
		open: false,
		content: '',
		kbd: undefined,
		side: 'top',
		align: 'center',
		inverted: false,
		monospace: false,
		virtualRef: null,
	};

	beforeEach(() => {
		vi.useFakeTimers();
		Object.assign(getGlobalTooltip().state, resetState);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('starts closed', () => {
		expect(getGlobalTooltip().state.open).toBe(false);
	});

	it('opens after delay', () => {
		const { state, openTooltip } = getGlobalTooltip();
		openTooltip(makePayload({ content: 'hello', delayDuration: 500 }));
		expect(state.open).toBe(false);
		expect(state.content).not.toBe('hello');
		vi.advanceTimersByTime(500);
		expect(state.open).toBe(true);
		expect(state.content).toBe('hello');
	});

	it('opens immediately when delayDuration is 0', () => {
		const { state, openTooltip } = getGlobalTooltip();
		openTooltip(makePayload());
		vi.advanceTimersByTime(0);
		expect(state.open).toBe(true);
	});

	it('closes immediately', () => {
		const { state, openTooltip, closeTooltip } = getGlobalTooltip();
		openTooltip(makePayload());
		vi.advanceTimersByTime(0);
		expect(state.open).toBe(true);
		closeTooltip();
		expect(state.open).toBe(false);
	});

	it('updates content immediately when immediateContent is true', () => {
		const { state, openTooltip } = getGlobalTooltip();
		openTooltip(makePayload({ content: 'hello', delayDuration: 500 }), true);
		expect(state.content).toBe('hello');
		expect(state.open).toBe(false);
	});

	it('stores kbd keys in state', () => {
		const { state, openTooltip } = getGlobalTooltip();
		openTooltip(makePayload({ content: 'Save', kbd: ['meta', 's'] }));
		vi.advanceTimersByTime(0);
		expect(state.kbd).toEqual(['meta', 's']);
	});

	it('kbd defaults to undefined when not provided', () => {
		const { state, openTooltip } = getGlobalTooltip();
		openTooltip(makePayload());
		vi.advanceTimersByTime(0);
		expect(state.kbd).toBeUndefined();
	});

	it('cancels pending open when closed before delay', () => {
		const { state, openTooltip, closeTooltip } = getGlobalTooltip();
		openTooltip(makePayload({ delayDuration: 500 }));
		closeTooltip();
		vi.advanceTimersByTime(500);
		expect(state.open).toBe(false);
	});
});

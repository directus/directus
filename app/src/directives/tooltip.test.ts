import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DirectiveBinding } from 'vue';
import Tooltip, {
	getGlobalTooltip,
	isDisabled,
	resolveAlign,
	resolveSide,
	resolveTooltipValue,
	resolveTrigger,
	TOOLTIP_CONTENT_ID,
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

const RESET_STATE = {
	open: false,
	content: '',
	kbd: undefined,
	side: 'top',
	align: 'center',
	inverted: false,
	monospace: false,
	virtualRef: null,
};

describe('getGlobalTooltip', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		Object.assign(getGlobalTooltip().state, RESET_STATE);
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

describe('resolveTrigger', () => {
	it('returns the element itself when it is focusable', () => {
		const element = createElement('<button>Save</button>');
		expect(resolveTrigger(element)).toBe(element);
	});

	it('returns the focusable direct child of a wrapper', () => {
		const element = createElement('<div class="v-button"><button class="button">Save</button></div>');
		expect(resolveTrigger(element)).toBe(element.firstElementChild);
	});

	it('returns a direct child link with an href', () => {
		const element = createElement('<div class="v-button"><a href="/items">Save</a></div>');
		expect(resolveTrigger(element)).toBe(element.firstElementChild);
	});

	it('falls back to the element when no direct child is focusable', () => {
		const element = createElement('<span><span><button>Save</button></span></span>');
		expect(resolveTrigger(element)).toBe(element);
	});
});

describe('Tooltip directive', () => {
	type Hook = (element: HTMLElement, binding: DirectiveBinding) => void;

	const {
		mounted: mount,
		unmounted: unmount,
		updated: update,
	} = Tooltip as unknown as Record<'mounted' | 'unmounted' | 'updated', Hook>;

	function stubFocusVisible(element: HTMLElement) {
		element.matches = (selector: string) =>
			selector === ':focus-visible' ? true : Element.prototype.matches.call(element, selector);
	}

	function createWrapper() {
		const element = createElement('<div class="v-button"><button class="button">Save</button></div>');
		return { element, trigger: element.firstElementChild as HTMLElement };
	}

	beforeEach(() => {
		vi.useFakeTimers();
		Object.assign(getGlobalTooltip().state, RESET_STATE);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('opens on focus of the control inside a wrapper', () => {
		const { element, trigger } = createWrapper();
		mount(element, makeBinding({ value: 'Save' }));
		stubFocusVisible(trigger);

		trigger.dispatchEvent(new FocusEvent('focus'));
		vi.advanceTimersByTime(500);

		expect(getGlobalTooltip().state.open).toBe(true);
		expect(getGlobalTooltip().state.content).toBe('Save');
	});

	it('opens on focus when the element itself is the control', () => {
		const element = createElement('<button>Save</button>');
		mount(element, makeBinding({ value: 'Save' }));
		stubFocusVisible(element);

		element.dispatchEvent(new FocusEvent('focus'));
		vi.advanceTimersByTime(500);

		expect(getGlobalTooltip().state.open).toBe(true);
	});

	it('does not open when the focus is not focus-visible', () => {
		const { element, trigger } = createWrapper();
		mount(element, makeBinding({ value: 'Save' }));

		trigger.dispatchEvent(new FocusEvent('focus'));
		vi.advanceTimersByTime(500);

		expect(getGlobalTooltip().state.open).toBe(false);
	});

	it('still opens on hover of the wrapper', () => {
		const { element } = createWrapper();
		mount(element, makeBinding({ value: 'Save' }));

		element.dispatchEvent(new Event('mouseenter'));
		vi.advanceTimersByTime(500);

		expect(getGlobalTooltip().state.open).toBe(true);
	});

	it('describes the control rather than the wrapper', () => {
		const { element, trigger } = createWrapper();
		mount(element, makeBinding({ value: 'Save' }));

		expect(trigger.getAttribute('aria-describedby')).toBe(TOOLTIP_CONTENT_ID);
		expect(element.hasAttribute('aria-describedby')).toBe(false);
	});

	it('detaches from the control on unmount', () => {
		const { element, trigger } = createWrapper();
		mount(element, makeBinding({ value: 'Save' }));
		unmount(element, makeBinding({ value: 'Save' }));
		stubFocusVisible(trigger);

		trigger.dispatchEvent(new FocusEvent('focus'));
		vi.advanceTimersByTime(500);

		expect(getGlobalTooltip().state.open).toBe(false);
		expect(trigger.hasAttribute('aria-describedby')).toBe(false);
	});

	it('re-binds when the wrapped control is replaced', () => {
		const { element } = createWrapper();
		const binding = makeBinding({ value: 'Save', oldValue: 'Save' });
		mount(element, binding);

		element.innerHTML = '<a href="/items">Save</a>';
		update(element, binding);

		const trigger = element.firstElementChild as HTMLElement;
		stubFocusVisible(trigger);

		trigger.dispatchEvent(new FocusEvent('focus'));
		vi.advanceTimersByTime(500);

		expect(getGlobalTooltip().state.open).toBe(true);
	});
});

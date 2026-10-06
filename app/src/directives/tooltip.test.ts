import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DirectiveBinding, ObjectDirective } from 'vue';
import Tooltip, {
	getGlobalTooltip,
	isDisabled,
	isSameTooltipValue,
	resolveAlign,
	resolveSide,
	resolveTooltipValue,
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

describe('isSameTooltipValue', () => {
	it('treats equal objects as the same value', () => {
		expect(isSameTooltipValue({ text: 'Save', kbd: ['meta', 's'] }, { text: 'Save', kbd: ['meta', 's'] })).toBe(true);
	});

	it('detects changed text or keys', () => {
		expect(isSameTooltipValue({ text: 'Save', kbd: ['meta', 's'] }, { text: 'Save', kbd: ['meta', 'x'] })).toBe(false);
		expect(isSameTooltipValue('Save', 'Saved')).toBe(false);
		expect(isSameTooltipValue('Save', false)).toBe(false);
	});
});

describe('Tooltip directive', () => {
	const directive = Tooltip as ObjectDirective<HTMLElement>;
	const mounted: HTMLElement[] = [];

	function mount(html: string, value: DirectiveBinding['value'] = 'Save') {
		const element = createElement(html);
		document.body.append(element);
		directive.beforeMount!(element, makeBinding({ value, modifiers: { instant: true } }), null!, null);
		mounted.push(element);
		return element;
	}

	function mountNested(element: HTMLElement, value: string) {
		directive.beforeMount!(element, makeBinding({ value, modifiers: { instant: true } }), null!, null);
		mounted.push(element);
	}

	function focus(target: HTMLElement) {
		target.focus();
		vi.advanceTimersByTime(0);
	}

	beforeEach(() => {
		vi.useFakeTimers();
		Object.assign(getGlobalTooltip().state, RESET_STATE);
	});

	afterEach(() => {
		for (const element of mounted.splice(0).reverse()) {
			directive.unmounted!(element, makeBinding(), null!, null);
			element.remove();
		}

		vi.useRealTimers();
	});

	it('opens when a deeply nested control gets keyboard focus', () => {
		const element = mount('<div><span><span><button>Save</button></span></span></div>');
		const button = element.querySelector('button')!;

		focus(button);

		expect(getGlobalTooltip().state.open).toBe(true);
		expect(getGlobalTooltip().state.content).toBe('Save');
		expect(button.getAttribute('aria-describedby')).toBe(TOOLTIP_CONTENT_ID);
	});

	it('stays open while focus moves inside the wrapper and closes when it leaves', () => {
		const element = mount('<div><button>First</button><button>Second</button></div>');
		const [first, second] = element.querySelectorAll('button');
		const outside = mount('<button>Outside</button>', false);

		focus(first!);
		focus(second!);

		expect(getGlobalTooltip().state.open).toBe(true);
		expect(first!.hasAttribute('aria-describedby')).toBe(false);
		expect(second!.getAttribute('aria-describedby')).toBe(TOOLTIP_CONTENT_ID);

		focus(outside);

		expect(getGlobalTooltip().state.open).toBe(false);
		expect(second!.hasAttribute('aria-describedby')).toBe(false);
	});

	it('does not open when focus comes from a mouse click', () => {
		const element = mount('<div><button>Save</button></div>');
		const button = element.querySelector('button')!;
		vi.spyOn(button, 'matches').mockImplementation((selector) => selector !== ':focus-visible');

		focus(button);

		expect(getGlobalTooltip().state.open).toBe(false);
	});

	it('still opens on hover of the wrapper', () => {
		const element = mount('<div><button>Save</button></div>');

		element.dispatchEvent(new Event('mouseenter'));
		vi.advanceTimersByTime(0);

		expect(getGlobalTooltip().state.open).toBe(true);
	});

	it('lets a nested tooltip host describe its own control', () => {
		const element = mount(
			'<div><button class="outer">Outer</button><span><button class="inner">Inner</button></span></div>',
			'Outer',
		);

		mountNested(element.querySelector('span')!, 'Inner');
		const inner = element.querySelector<HTMLElement>('.inner')!;

		focus(element.querySelector<HTMLElement>('.outer')!);
		focus(inner);

		expect(getGlobalTooltip().state.open).toBe(true);
		expect(getGlobalTooltip().state.content).toBe('Inner');
		expect(inner.getAttribute('aria-describedby')).toBe(TOOLTIP_CONTENT_ID);
	});

	it('ignores controls opted out with data-no-tooltip', () => {
		const element = mount('<div><button class="main">Save</button><button data-no-tooltip>More</button></div>');
		const optedOut = element.querySelector<HTMLElement>('[data-no-tooltip]')!;

		focus(element.querySelector<HTMLElement>('.main')!);
		expect(getGlobalTooltip().state.open).toBe(true);

		focus(optedOut);

		expect(getGlobalTooltip().state.open).toBe(false);
		expect(optedOut.hasAttribute('aria-describedby')).toBe(false);
	});

	it('preserves an existing aria-describedby on the control', () => {
		const element = mount('<div><input aria-describedby="hint" /></div>');
		const input = element.querySelector('input')!;

		focus(input);
		expect(input.getAttribute('aria-describedby')).toBe(`hint ${TOOLTIP_CONTENT_ID}`);

		input.blur();
		expect(input.getAttribute('aria-describedby')).toBe('hint');
	});

	it('removes its description on unmount while focused', () => {
		const element = mount('<div><input aria-describedby="hint" /></div>');
		const input = element.querySelector('input')!;

		focus(input);
		directive.unmounted!(element, makeBinding(), null!, null);

		expect(input.getAttribute('aria-describedby')).toBe('hint');
	});

	it('keeps the tooltip open when re-rendered with an equal object value', () => {
		const element = mount('<div><button>Bold</button></div>', { text: 'Bold', kbd: ['meta', 'b'] });

		focus(element.querySelector('button')!);

		directive.updated!(
			element,
			makeBinding({ value: { text: 'Bold', kbd: ['meta', 'b'] }, oldValue: { text: 'Bold', kbd: ['meta', 'b'] } }),
			null!,
			null!,
		);

		expect(getGlobalTooltip().state.open).toBe(true);
	});

	it('shows the new value when it changes while the control is focused', () => {
		const element = mount('<div><button>Toggle</button></div>', 'Collapse');
		const button = element.querySelector('button')!;

		focus(button);

		directive.updated!(element, makeBinding({ value: 'Expand', oldValue: 'Collapse' }), null!, null!);
		vi.advanceTimersByTime(0);

		expect(getGlobalTooltip().state.open).toBe(true);
		expect(getGlobalTooltip().state.content).toBe('Expand');
		expect(button.getAttribute('aria-describedby')).toBe(TOOLTIP_CONTENT_ID);
	});

	it('shows the new value when it changes while the control is hovered', () => {
		const element = mount('<div><button>Toggle</button></div>', 'Collapse');
		vi.spyOn(element, 'matches').mockImplementation((selector) => selector === ':hover');

		directive.updated!(element, makeBinding({ value: 'Expand', oldValue: 'Collapse' }), null!, null!);
		vi.advanceTimersByTime(0);

		expect(getGlobalTooltip().state.open).toBe(true);
		expect(getGlobalTooltip().state.content).toBe('Expand');
	});
});

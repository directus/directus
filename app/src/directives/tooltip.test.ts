import { describe, expect, it } from 'vitest';
import type { DirectiveBinding } from 'vue';
import { isDisabled, resolveAlign, resolveSide, resolveTooltipValue } from './tooltip';

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

import { describe, expect, it } from 'vitest';
import { isDisabled } from './tooltip';

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

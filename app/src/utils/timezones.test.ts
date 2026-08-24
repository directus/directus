import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getTimezoneOptions } from '@/utils/timezones';

describe('getTimezoneOptions', () => {
	describe('when Intl.supportedValuesOf is available', () => {
		beforeEach(() => {
			vi.spyOn(Intl, 'supportedValuesOf').mockReturnValue([
				'America/New_York',
				'America/Los_Angeles',
				'Europe/London',
				'Europe/Paris',
				'Asia/Kolkata',
				'UTC',
			]);
		});

		afterEach(() => {
			vi.restoreAllMocks();
		});

		it('groups timezones by region prefix', () => {
			const result = getTimezoneOptions();
			const texts = result.map((node) => node.text);
			expect(texts).toContain('America');
			expect(texts).toContain('Europe');
			expect(texts).toContain('Asia');
		});

		it('populates children with text and value for each timezone', () => {
			const result = getTimezoneOptions();
			const america = result.find((node) => node.text === 'America');

			expect(america?.children).toEqual([
				{ text: 'New York', value: 'America/New_York' },
				{ text: 'Los Angeles', value: 'America/Los_Angeles' },
			]);
		});

		it('replaces underscores with spaces in timezone text', () => {
			const result = getTimezoneOptions();
			const america = result.find((node) => node.text === 'America');
			const newYork = america?.children?.find((c) => c.value === 'America/New_York');
			expect(newYork?.text).toBe('New York');
		});

		it('handles nested paths by preserving the full sub-path as text', () => {
			vi.spyOn(Intl, 'supportedValuesOf').mockReturnValue(['America/Indiana/Indianapolis']);
			const result = getTimezoneOptions();
			const america = result.find((node) => node.text === 'America');
			expect(america?.children).toEqual([{ text: 'Indiana/Indianapolis', value: 'America/Indiana/Indianapolis' }]);
		});
	});

	describe('when Intl.supportedValuesOf is not available', () => {
		let original: typeof Intl.supportedValuesOf | undefined;

		beforeEach(() => {
			original = Intl.supportedValuesOf;

			delete (Intl as any).supportedValuesOf;
		});

		afterEach(() => {
			(Intl as any).supportedValuesOf = original;
		});

		it('falls back to the built-in minimal timezone list', () => {
			const result = getTimezoneOptions();
			expect(result.length).toBeGreaterThan(0);

			const allValues = result.flatMap((node) => node.children?.map((c) => c.value) ?? []);
			expect(allValues).toContain('UTC');
			expect(allValues).toContain('Europe/Oslo');
			expect(allValues).toContain('America/New_York');
		});
	});
});

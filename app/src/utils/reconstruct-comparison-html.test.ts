import { describe, expect, it } from 'vitest';
import { reconstructComparisonHtml } from './reconstruct-comparison-html';
import type { Change } from '@/composables/use-comparison-diff';

describe('reconstructComparisonHtml', () => {
	it('returns the full HTML value if isHtml is true and side matches', () => {
		const changes: Change[] = [
			{ value: '<p>Old</p>', removed: true, isHtml: true },
			{ value: '<p>New</p>', added: true, isHtml: true },
		];

		expect(reconstructComparisonHtml(changes, 'base')).toBe('<p>Old</p>');
		expect(reconstructComparisonHtml(changes, 'incoming')).toBe('<p>New</p>');
	});

	it('identifies HTML from string content if isHtml is not set', () => {
		const changes: Change[] = [{ value: '<p>Hello</p>' }];

		expect(reconstructComparisonHtml(changes, 'incoming')).toBe('<p>Hello</p>');
	});

	it('reconstructs HTML with added parts for incoming side', () => {
		const changes: Change[] = [
			{ value: '<p>', isHtml: true },
			{ value: 'Hello ' },
			{ value: 'there', added: true },
			{ value: '</p>', isHtml: true },
		];

		const result = reconstructComparisonHtml(changes, 'incoming');
		expect(result).toBe('<p>Hello <span class="comparison--diff-added">there</span></p>');
	});

	it('reconstructs HTML with removed parts for base side', () => {
		const changes: Change[] = [
			{ value: '<p>', isHtml: true },
			{ value: 'Hello ' },
			{ value: 'there', removed: true },
			{ value: '</p>', isHtml: true },
		];

		const result = reconstructComparisonHtml(changes, 'base');
		expect(result).toBe('<p>Hello <span class="comparison--diff-removed">there</span></p>');
	});

	it('skips added parts when side is base', () => {
		const changes: Change[] = [{ value: 'Static ' }, { value: 'Added', added: true }, { value: '<span></span>' }];

		const result = reconstructComparisonHtml(changes, 'base');
		expect(result).toBe('Static <span></span>');
	});

	it('skips removed parts when side is incoming', () => {
		const changes: Change[] = [{ value: 'Static ' }, { value: 'Removed', removed: true }, { value: '<span></span>' }];

		const result = reconstructComparisonHtml(changes, 'incoming');
		expect(result).toBe('Static <span></span>');
	});

	it('handles null or undefined values gracefully', () => {
		const changes: Change[] = [
			{ value: '<p>', isHtml: true },
			{ value: null as any },
			{ value: undefined as any },
			{ value: '</p>', isHtml: true },
		];

		const result = reconstructComparisonHtml(changes, 'incoming');
		expect(result).toBe('<p></p>');
	});
});

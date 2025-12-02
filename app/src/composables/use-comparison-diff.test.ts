import { describe, expect, it } from 'vitest';
import { useComparisonDiff } from './use-comparison-diff';

describe('useComparisonDiff - HTML Diff', () => {
	const { computeDiff } = useComparisonDiff();

	it('should not detect changes if the text and formatting are the same', () => {
		const baseValue = '<p>Hello beautiful world</p>';
		const incomingValue = '<p>Hello beautiful world</p>';

		const changes = computeDiff(baseValue, incomingValue);

		expect(changes.length).toBe(0);
	});

	it('should detect and highlight text changes in HTML', () => {
		const baseValue = '<p>Hello world</p>';
		const incomingValue = '<p>Hello beautiful world</p>';

		const changes = computeDiff(baseValue, incomingValue);

		expect(changes.length).toBeGreaterThan(0);
		expect(changes[0]?.removed).toBe(true);
		expect(changes[1]?.added).toBe(true);
	});

	it('should highlight formatting changes created by html tags', () => {
		const baseValue = '<p>Hello <strong>beautiful</strong> world</p>';
		const incomingValue = '<p>Hello <em>beautiful</em> world</p>';

		const changes = computeDiff(baseValue, incomingValue);

		expect(changes.length).toBeGreaterThan(0);
		expect(changes[0]?.removed).toBe(true);
		expect(changes[1]?.added).toBe(true);
	});
});

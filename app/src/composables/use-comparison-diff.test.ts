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

	it.each(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'DEL', 'A', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'])(
		'should highlight formatting changes created by the <%s> tag',
		(tag) => {
			const baseValue = `<p>Hello beautiful world</p>`;
			const incomingValue = `<p>Hello <${tag.toLowerCase()}>beautiful</${tag.toLowerCase()}> world</p>`;

			const changes = computeDiff(baseValue, incomingValue);

			expect(changes.length).toBe(2);
			expect(changes[0]?.removed).toBe(true);
			expect(changes[1]?.added).toBe(true);
			expect(changes[1]?.value).toContain(`class="comparison-diff--added"`);
			expect(changes[1]?.value).toContain(`beautiful`);
		},
	);

	it('should highlight formatting changes created by CSS text-decoration: underline', () => {
		const baseValue = '<p>Hello beautiful world</p>';
		const incomingValue = '<p>Hello <span style="text-decoration: underline;">beautiful</span> world</p>';

		const changes = computeDiff(baseValue, incomingValue);

		expect(changes.length).toBe(2);
		expect(changes[0]?.removed).toBe(true);
		expect(changes[1]?.added).toBe(true);
		expect(changes[1]?.value).toContain('comparison-diff--added');
		expect(changes[1]?.value).toContain('beautiful');
	});

	it('should highlight formatting changes created by CSS text-decoration-line: underline', () => {
		const baseValue = '<p>Hello beautiful world</p>';
		const incomingValue = '<p>Hello <span style="text-decoration-line: underline;">beautiful</span> world</p>';

		const changes = computeDiff(baseValue, incomingValue);

		expect(changes.length).toBe(2);
		expect(changes[0]?.removed).toBe(true);
		expect(changes[1]?.added).toBe(true);
		expect(changes[1]?.value).toContain('comparison-diff--added');
		expect(changes[1]?.value).toContain('beautiful');
	});

	it('highlights all content on incoming side when base is empty', () => {
		const { computeDiff } = useComparisonDiff();
		const base = null;
		const incoming = '<p>Hello World</p>';

		const changes = computeDiff(base, incoming);

		expect(changes).toHaveLength(2);
		expect(changes[1]?.added).toBe(true);
		expect(changes[1]?.value).toContain('<span class="comparison-diff--added">Hello World</span>');
	});

	it('highlights all content on base side when incoming is empty', () => {
		const { computeDiff } = useComparisonDiff();
		const base = '<p>Hello World</p>';
		const incoming = null;

		const changes = computeDiff(base, incoming);

		expect(changes).toHaveLength(2);
		expect(changes[0]?.removed).toBe(true);
		expect(changes[0]?.value).toContain('<span class="comparison-diff--removed">Hello World</span>');
	});
});

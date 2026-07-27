import { describe, expect, test } from 'vitest';
import { buildCustomFormats } from '../extensions/custom-formats';
import { computeNormalizationDiff, computeValueNormalizationDiff } from './normalization-diff';

function removedText(code: string): string {
	const changes = computeNormalizationDiff(code);
	expect(changes).not.toBeNull();
	return changes!
		.filter((change) => change.removed)
		.map((change) => change.value)
		.join('');
}

describe('computeNormalizationDiff', () => {
	test('returns null for HTML the schema preserves', () => {
		expect(computeNormalizationDiff('<p>hello <strong>world</strong></p>')).toBeNull();
	});

	test('returns null for a title attribute the schema preserves', () => {
		expect(computeNormalizationDiff('<p><span title="Tooltip">text</span></p>')).toBeNull();
	});

	test('returns null for role, lang and dir the schema preserves', () => {
		// authored in the editor's canonical render order (role, lang, aria-*, dir) so the textual
		// diff only surfaces genuine loss, not attribute reordering
		expect(
			computeNormalizationDiff('<p><span role="note" lang="fr" aria-label="Note" dir="rtl">text</span></p>'),
		).toBeNull();
	});

	test('returns null for cosmetic-only reformatting', () => {
		// Same document, arbitrary incoming indentation/whitespace — no semantic change.
		expect(computeNormalizationDiff('<ul>\n\n    <li><p>one</p></li>\n  <li><p>two</p></li>\n</ul>')).toBeNull();
	});

	test('returns null for a trailing space inside an inline-only block', () => {
		// Tiptap trims the trailing space; the delta is cosmetic and must not warn.
		expect(computeNormalizationDiff('<p>The content is pretty awesome </p>')).toBeNull();
	});

	test('flags dropped table markup', () => {
		expect(removedText('<table><tbody><tr><td>a</td></tr></tbody></table>')).toContain('<table');
	});

	test('flags dropped element while keeping surrounding content', () => {
		expect(removedText('<p>keep</p><object data="about:blank"></object>')).toContain('<object');
	});

	test('returns null for iframe preserved by the media node', () => {
		expect(computeNormalizationDiff('<iframe src="about:blank"></iframe>')).toBeNull();
	});

	// Custom-format marks live only on the editor instance, so the round-trip must be told about them
	// or their markup reads as dropped/reordered and falsely triggers the warning (ENG-1474).
	test('returns null for custom-format markup when its extensions are supplied', () => {
		const { extensions } = buildCustomFormats([
			{ title: 'Highlight', inline: 'span', classes: 'highlight', styles: { 'background-color': 'yellow' } },
			{ title: 'Cite', inline: 'cite', classes: 'src' },
		]);

		expect(
			computeNormalizationDiff(
				'<p><span class="highlight" style="background-color: yellow;">a</span> <cite class="src">b</cite></p>',
				extensions,
			),
		).toBeNull();
	});

	test('still flags custom-format markup when the extensions are missing', () => {
		expect(removedText('<p><cite class="src">b</cite></p>')).toContain('cite');
	});
});

describe('computeValueNormalizationDiff', () => {
	test('returns null for custom-format markup when its extensions are supplied', () => {
		const { extensions } = buildCustomFormats([{ title: 'Cite', inline: 'cite', classes: 'src' }]);
		expect(computeValueNormalizationDiff('<p><cite class="src">b</cite></p>', extensions)).toBeNull();
	});
});

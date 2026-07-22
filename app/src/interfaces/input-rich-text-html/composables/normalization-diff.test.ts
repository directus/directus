import { describe, expect, test } from 'vitest';
import { computeNormalizationDiff } from './normalization-diff';

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

	test('flags dropped table markup', () => {
		expect(removedText('<table><tbody><tr><td>a</td></tr></tbody></table>')).toContain('<table');
	});

	test('flags dropped element while keeping surrounding content', () => {
		expect(removedText('<p>keep</p><object data="about:blank"></object>')).toContain('<object');
	});

	test('returns null for iframe preserved by the media node', () => {
		expect(computeNormalizationDiff('<iframe src="about:blank"></iframe>')).toBeNull();
	});
});

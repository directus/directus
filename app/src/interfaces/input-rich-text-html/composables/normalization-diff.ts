import { type AnyExtension, Editor } from '@tiptap/vue-3';
import { type Change, diffLines } from 'diff';
import { fieldEditorExtensions } from '../extensions';
import { decodePageBreaks, encodePageBreaks } from '../extensions/page-break';
import { formatHtml } from './format-html';

// Re-parse through the schema exactly as saveSourceCode will, so the diff compares against what
// actually gets stored. `extraExtensions` is the per-field slice from buildFieldSchema the live
// editor was built with — without it that markup reads as dropped and falsely trips the warning.
function roundTrip(html: string, extraExtensions: AnyExtension[]): string {
	const editor = new Editor({ extensions: fieldEditorExtensions(extraExtensions), content: html });
	const out = editor.getHTML();
	editor.destroy();
	return out;
}

// Both sides run through formatHtml so only semantic loss surfaces, never cosmetic reformatting.
function diffFormatted(rawBefore: string, rawAfter: string): Change[] | null {
	const before = formatHtml(rawBefore);
	const after = formatHtml(rawAfter);
	if (before === after) return null;

	const changes = diffLines(before, after);
	if (!changes.some((change) => change.added || change.removed)) return null;
	return changes;
}

/**
 * Diffs the source-code drawer's HTML against what saving it would actually store. Returns null
 * when the document survives normalization unchanged.
 */
export function computeNormalizationDiff(code: string, extraExtensions: AnyExtension[] = []): Change[] | null {
	return diffFormatted(code, roundTrip(code, extraExtensions));
}

/**
 * Same check for the stored field value: both sides are compared in the encoded (stored)
 * representation so the page-break marker ↔ element boundary cancels out instead of reading
 * as a change.
 *
 * Each miss builds a throwaway editor, and a comparison asks the same question about the same value
 * repeatedly (per side, per rendered interface, per revision pick), so verdicts are cached against
 * `schemaKey`. Without one, only the base schema is cached — dynamic custom format marks reuse names.
 */
export function computeValueNormalizationDiff(
	value: string,
	extraExtensions: AnyExtension[] = [],
	schemaKey?: string,
): Change[] | null {
	const key = schemaKey ?? (extraExtensions.length === 0 ? '' : null);

	if (key === null) return valueNormalizationDiff(value, extraExtensions);

	const cacheKey = `${key}\u0000${value}`;
	if (verdictCache.has(cacheKey)) return verdictCache.get(cacheKey)!;

	const verdict = valueNormalizationDiff(value, extraExtensions);

	if (verdictCache.size >= VERDICT_CACHE_SIZE) verdictCache.delete(verdictCache.keys().next().value!);
	verdictCache.set(cacheKey, verdict);

	return verdict;
}

const VERDICT_CACHE_SIZE = 24;
const verdictCache = new Map<string, Change[] | null>();

function valueNormalizationDiff(value: string, extraExtensions: AnyExtension[]): Change[] | null {
	const decoded = decodePageBreaks(value);
	return diffFormatted(encodePageBreaks(decoded), encodePageBreaks(roundTrip(decoded, extraExtensions)));
}

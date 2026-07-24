import { type AnyExtension, Editor } from '@tiptap/vue-3';
import { type Change, diffLines } from 'diff';
import { editorExtensions } from '../extensions';
import { decodePageBreaks, encodePageBreaks } from '../extensions/page-break';
import { formatHtml } from './format-html';

// Re-parse through the schema exactly as saveSourceCode will, so the diff compares against what
// actually gets stored. `extraExtensions` carries the instance-only marks (custom formats) the live
// editor was built with — without them their markup reads as dropped and falsely trips the warning.
function roundTrip(html: string, extraExtensions: AnyExtension[]): string {
	const editor = new Editor({ extensions: [...editorExtensions, ...extraExtensions], content: html });
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
 */
export function computeValueNormalizationDiff(value: string, extraExtensions: AnyExtension[] = []): Change[] | null {
	const decoded = decodePageBreaks(value);
	return diffFormatted(encodePageBreaks(decoded), encodePageBreaks(roundTrip(decoded, extraExtensions)));
}

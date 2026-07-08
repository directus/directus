import { Editor } from '@tiptap/vue-3';
import { type Change, diffLines } from 'diff';
import { editorExtensions } from '../extensions';
import { formatHtml } from './format-html';

// Re-parse through the schema exactly as saveSourceCode will, so the diff compares against what
// actually gets stored.
function roundTrip(html: string): string {
	const editor = new Editor({ extensions: editorExtensions, content: html });
	const out = editor.getHTML();
	editor.destroy();
	return out;
}

/**
 * Diffs the drawer's HTML against what saving it would actually store. Both sides run through
 * formatHtml so only semantic loss surfaces, never cosmetic reformatting. Returns null when the
 * document survives normalization unchanged.
 */
export function computeNormalizationDiff(code: string): Change[] | null {
	const before = formatHtml(code);
	const after = formatHtml(roundTrip(code));
	if (before === after) return null;

	const changes = diffLines(before, after);
	if (!changes.some((change) => change.added || change.removed)) return null;
	return changes;
}

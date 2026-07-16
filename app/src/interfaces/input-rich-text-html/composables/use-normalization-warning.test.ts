import { Editor } from '@tiptap/vue-3';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { nextTick, ref, shallowRef } from 'vue';
import { editorExtensions } from '../extensions';
import { NORMALIZATION_WARNING_DISMISSED, useNormalizationWarning } from './use-normalization-warning';

const editors: Editor[] = [];

beforeEach(() => {
	localStorage.removeItem(NORMALIZATION_WARNING_DISMISSED);
});

afterEach(() => {
	while (editors.length) editors.pop()!.destroy();
});

function setup(initialValue: string | null) {
	const editor = shallowRef(new Editor({ extensions: editorExtensions, content: '' }));
	editors.push(editor.value);
	const value = ref<string | null>(initialValue);
	const usable = useNormalizationWarning(editor, value);
	return { editor, value, ...usable };
}

const LOSSY = '<marquee>a</marquee>';

test('focus with clean content shows no warning', () => {
	const { normalizationWarningOpen, onEditorFocus } = setup('<p>hello <strong>world</strong></p>');

	onEditorFocus();

	expect(normalizationWarningOpen.value).toBe(false);
});

test('focus with unsupported markup opens the warning with a diff', () => {
	const { normalizationWarningOpen, normalizationWarningDiff, onEditorFocus } = setup(LOSSY);

	onEditorFocus();

	expect(normalizationWarningOpen.value).toBe(true);
	expect(normalizationWarningDiff.value.length).toBeGreaterThan(0);
});

test('the warning shows at most once per mount', () => {
	const { normalizationWarningOpen, onEditorFocus, cancelNormalizationWarning } = setup(LOSSY);

	onEditorFocus();
	cancelNormalizationWarning();
	onEditorFocus();

	expect(normalizationWarningOpen.value).toBe(false);
});

test('page-break storage markers do not trigger the warning', () => {
	const { normalizationWarningOpen, onEditorFocus } = setup('<p>a</p><!-- pagebreak --><p>b</p>');

	onEditorFocus();

	expect(normalizationWarningOpen.value).toBe(false);
});

test('an empty value does not consume the once-per-mount check', () => {
	const { normalizationWarningOpen, value, onEditorFocus } = setup(null);

	onEditorFocus();
	expect(normalizationWarningOpen.value).toBe(false);

	value.value = LOSSY;
	onEditorFocus();
	expect(normalizationWarningOpen.value).toBe(true);
});

test('confirm closes the warning without persisting when the checkbox is unchecked', async () => {
	const { normalizationWarningOpen, onEditorFocus, confirmNormalizationWarning } = setup(LOSSY);

	onEditorFocus();
	confirmNormalizationWarning();
	await nextTick();

	expect(normalizationWarningOpen.value).toBe(false);
	expect(localStorage.getItem(NORMALIZATION_WARNING_DISMISSED)).not.toBe('true');
});

test('confirm with "don\'t show again" persists the opt-out and suppresses future instances', async () => {
	const first = setup(LOSSY);

	first.onEditorFocus();
	first.dontShowAgain.value = true;
	first.confirmNormalizationWarning();
	await nextTick();

	expect(localStorage.getItem(NORMALIZATION_WARNING_DISMISSED)).toBe('true');

	const second = setup(LOSSY);
	second.onEditorFocus();
	expect(second.normalizationWarningOpen.value).toBe(false);
});

test('cancel with "don\'t show again" also persists the opt-out', async () => {
	const { onEditorFocus, dontShowAgain, cancelNormalizationWarning } = setup(LOSSY);

	onEditorFocus();
	dontShowAgain.value = true;
	cancelNormalizationWarning();
	await nextTick();

	expect(localStorage.getItem(NORMALIZATION_WARNING_DISMISSED)).toBe('true');
});

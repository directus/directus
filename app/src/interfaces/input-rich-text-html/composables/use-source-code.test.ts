import { Editor } from '@tiptap/vue-3';
import { afterEach, expect, test, vi } from 'vitest';
import { shallowRef } from 'vue';
import { editorExtensions } from '../extensions';
import { useSourceCode } from './use-source-code';

const editors: Editor[] = [];

afterEach(() => {
	while (editors.length) editors.pop()!.destroy();
});

function setup(content = '<p></p>') {
	const editor = shallowRef(new Editor({ extensions: editorExtensions, content }));
	editors.push(editor.value);
	const usable = useSourceCode(editor);
	return { editor, ...usable };
}

test('openSourceCodeDrawer opens the drawer seeded with the current document HTML', () => {
	const { code, sourceCodeDrawerOpen, openSourceCodeDrawer } = setup('<p>hello</p>');

	openSourceCodeDrawer();

	expect(sourceCodeDrawerOpen.value).toBe(true);
	expect(code.value).toBe('<p>hello</p>');
});

test('openSourceCodeDrawer pretty-prints nested block structure', () => {
	const { code, openSourceCodeDrawer } = setup('<ul><li><p>one</p></li></ul>');

	openSourceCodeDrawer();

	expect(code.value).toBe(['<ul>', '  <li>', '    <p>one</p>', '  </li>', '</ul>'].join('\n'));
});

test('save with unchanged code leaves the document identical', () => {
	const { editor, openSourceCodeDrawer, saveSourceCode } = setup('<p>hello <strong>world</strong></p>');

	const before = editor.value.getHTML();
	openSourceCodeDrawer();
	saveSourceCode();

	expect(editor.value.getHTML()).toBe(before);
});

test('save applies edited HTML and closes the drawer', () => {
	const { editor, code, sourceCodeDrawerOpen, openSourceCodeDrawer, saveSourceCode } = setup('<p>before</p>');

	openSourceCodeDrawer();
	code.value = '<p>after</p>';
	saveSourceCode();

	expect(editor.value.getHTML()).toBe('<p>after</p>');
	expect(sourceCodeDrawerOpen.value).toBe(false);
});

test('save emits an update so the field value syncs', () => {
	const { editor, code, openSourceCodeDrawer, saveSourceCode } = setup('<p>before</p>');

	const onUpdate = vi.fn();
	editor.value.on('update', onUpdate);

	openSourceCodeDrawer();
	code.value = '<p>after</p>';
	saveSourceCode();

	expect(onUpdate).toHaveBeenCalled();
});

test('closeSourceCodeDrawer closes without touching the document', () => {
	const { editor, code, sourceCodeDrawerOpen, openSourceCodeDrawer, closeSourceCodeDrawer } = setup('<p>keep</p>');

	openSourceCodeDrawer();
	code.value = '<p>discarded</p>';
	closeSourceCodeDrawer();

	expect(sourceCodeDrawerOpen.value).toBe(false);
	expect(editor.value.getHTML()).toBe('<p>keep</p>');
});

const LOSSY = '<table><tbody><tr><td>a</td></tr></tbody></table>';

test('save with unsupported markup opens the confirm dialog instead of applying', () => {
	const {
		editor,
		code,
		sourceCodeDrawerOpen,
		normalizeConfirmOpen,
		normalizeDiff,
		openSourceCodeDrawer,
		saveSourceCode,
	} = setup('<p>keep</p>');

	const before = editor.value.getHTML();
	openSourceCodeDrawer();
	code.value = LOSSY;
	saveSourceCode();

	expect(normalizeConfirmOpen.value).toBe(true);
	expect(normalizeDiff.value.length).toBeGreaterThan(0);
	expect(sourceCodeDrawerOpen.value).toBe(true);
	expect(editor.value.getHTML()).toBe(before);
});

test('confirmSaveSourceCode applies the edit and closes both drawer and dialog', () => {
	const {
		editor,
		code,
		sourceCodeDrawerOpen,
		normalizeConfirmOpen,
		openSourceCodeDrawer,
		saveSourceCode,
		confirmSaveSourceCode,
	} = setup('<p>keep</p>');

	openSourceCodeDrawer();
	code.value = LOSSY;
	saveSourceCode();
	confirmSaveSourceCode();

	expect(normalizeConfirmOpen.value).toBe(false);
	expect(sourceCodeDrawerOpen.value).toBe(false);
	expect(editor.value.getHTML()).not.toContain('<table');
});

test('cancelNormalize closes the dialog but keeps the drawer open and document untouched', () => {
	const {
		editor,
		code,
		sourceCodeDrawerOpen,
		normalizeConfirmOpen,
		openSourceCodeDrawer,
		saveSourceCode,
		cancelNormalize,
	} = setup('<p>keep</p>');

	const before = editor.value.getHTML();
	openSourceCodeDrawer();
	code.value = LOSSY;
	saveSourceCode();
	cancelNormalize();

	expect(normalizeConfirmOpen.value).toBe(false);
	expect(sourceCodeDrawerOpen.value).toBe(true);
	expect(editor.value.getHTML()).toBe(before);
});

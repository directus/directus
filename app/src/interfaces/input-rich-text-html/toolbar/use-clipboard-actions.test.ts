import StarterKit from '@tiptap/starter-kit';
import { Editor } from '@tiptap/vue-3';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useClipboardActions } from './use-clipboard-actions';

function makeEditor(content = '<p>hello world</p>') {
	return new Editor({ extensions: [StarterKit], content });
}

let write: ReturnType<typeof vi.fn>;
let read: ReturnType<typeof vi.fn>;
let readText: ReturnType<typeof vi.fn>;

beforeEach(() => {
	write = vi.fn().mockResolvedValue(undefined);
	read = vi.fn();
	readText = vi.fn().mockResolvedValue('');

	Object.defineProperty(navigator, 'clipboard', {
		configurable: true,
		value: { write, read, readText },
	});
});

afterEach(() => vi.restoreAllMocks());

describe('copy', () => {
	test('writes the selected HTML + plain text to the clipboard', async () => {
		const editor = makeEditor();
		editor.commands.selectAll();

		await useClipboardActions().copySelection(editor);

		expect(write).toHaveBeenCalledOnce();
		const items = write.mock.calls[0]?.[0] as ClipboardItem[];
		expect(items).toHaveLength(1);
		expect(items[0]!.types).toContain('text/html');
		expect(items[0]!.types).toContain('text/plain');
	});

	test('no-ops on an empty selection', async () => {
		const editor = makeEditor();
		editor.commands.setTextSelection(1); // collapsed cursor

		await useClipboardActions().copySelection(editor);

		expect(write).not.toHaveBeenCalled();
	});
});

describe('cut', () => {
	test('copies then removes the selection', async () => {
		const editor = makeEditor();
		editor.commands.selectAll();

		await useClipboardActions().cutSelection(editor);

		expect(write).toHaveBeenCalledOnce();
		expect(editor.getText()).toBe('');
	});
});

describe('paste', () => {
	test('inserts text/html from the clipboard', async () => {
		const editor = makeEditor('<p>start </p>');
		editor.commands.setTextSelection(7); // end of "start "

		read.mockResolvedValue([
			{
				types: ['text/html'],
				getType: async () => new Blob(['<strong>bold</strong>'], { type: 'text/html' }),
			},
		]);

		await useClipboardActions().paste(editor);

		expect(editor.getHTML()).toContain('<strong>bold</strong>');
	});

	test('swallows clipboard errors (e.g. permission denied / Firefox)', async () => {
		const editor = makeEditor();
		read.mockRejectedValue(new Error('NotAllowedError'));
		readText.mockRejectedValue(new Error('NotAllowedError'));

		await expect(useClipboardActions().paste(editor)).resolves.toBeUndefined();
	});
});

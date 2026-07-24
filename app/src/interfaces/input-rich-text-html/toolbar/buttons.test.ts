import { describe, expect, test } from 'vitest';
import { toolbarButtons } from './buttons';

describe('font-family toolbar button', () => {
	// The revert-to-default entry (value null → unsetFontFamily) must be the first item so users can
	// clear a custom font and fall back to the editor's base font.
	test('exposes a Default (null) revert entry first', () => {
		const items = toolbarButtons.fontfamily!.componentProps!.items as { label: string; value: string | null }[];
		expect(items[0]).toEqual({ label: 'wysiwyg_options.default', value: null });
	});
});

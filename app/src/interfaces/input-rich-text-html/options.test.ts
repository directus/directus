import type { DeepPartial, Field } from '@directus/types';
import { describe, expect, test } from 'vitest';
import config from './index';

/**
 * Options-schema compatibility with the legacy TinyMCE interface: option keys and choice values
 * must keep working with stored field-meta as-is (no migration). `tinymceOverrides` is deprecated —
 * hidden for new fields, still rendered for fields that carry a value.
 */

function resolveOptions(fieldOptions?: Record<string, unknown>) {
	const field: DeepPartial<Field> = { meta: { options: fieldOptions } };
	const options = typeof config.options === 'function' ? config.options({ field } as any) : config.options;
	return options as { standard: DeepPartial<Field>[]; advanced: DeepPartial<Field>[] };
}

function fieldKeys(fields: DeepPartial<Field>[]) {
	return fields.map((f) => f.field);
}

describe('options compat', () => {
	test('keeps all legacy option keys', () => {
		const { standard, advanced } = resolveOptions({ tinymceOverrides: { font_size_formats: '8pt' } });

		expect(fieldKeys(standard)).toEqual(['toolbar', 'font', 'folder', 'imageToken']);
		expect(fieldKeys(advanced)).toEqual(['softLength', 'customFormats', 'tinymceOverrides']);
	});

	test('keeps all legacy toolbar choice values', () => {
		const { standard } = resolveOptions();
		const toolbar = standard.find((f) => f.field === 'toolbar');
		const values = toolbar?.meta?.options?.choices?.map((choice: any) => choice.value);

		expect(values).toEqual([
			'undo',
			'redo',
			'bold',
			'italic',
			'underline',
			'strikethrough',
			'subscript',
			'superscript',
			'fontfamily',
			'fontsize',
			'h1',
			'h2',
			'h3',
			'h4',
			'h5',
			'h6',
			'customPre',
			'alignleft',
			'aligncenter',
			'alignright',
			'alignjustify',
			'alignnone',
			'indent',
			'outdent',
			'numlist',
			'bullist',
			'forecolor',
			'backcolor',
			'removeformat',
			'cut',
			'copy',
			'paste',
			'remove',
			'selectall',
			'blockquote',
			'customInlineCode',
			'customLink',
			'unlink',
			'customImage',
			'customMedia',
			'table',
			'hr',
			'pagebreak',
			'insertdatetime',
			'fullscreen',
			'visualaid',
			'ltr rtl',
			'code',
		]);
	});
});

describe('tinymceOverrides deprecation', () => {
	test('is hidden for new fields (no stored value)', () => {
		expect(fieldKeys(resolveOptions().advanced)).not.toContain('tinymceOverrides');
		expect(fieldKeys(resolveOptions({}).advanced)).not.toContain('tinymceOverrides');
	});

	test('stays rendered for fields that have a stored value', () => {
		const { advanced } = resolveOptions({ tinymceOverrides: { font_size_formats: '8pt 10pt' } });
		expect(fieldKeys(advanced)).toContain('tinymceOverrides');
	});

	test('stays hidden when other options have values but tinymceOverrides is unset', () => {
		const { advanced } = resolveOptions({ softLength: 255 });
		expect(fieldKeys(advanced)).not.toContain('tinymceOverrides');
	});
});

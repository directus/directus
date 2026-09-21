import type { DeepPartial, Field } from '@directus/types';
import { afterEach, describe, expect, test } from 'vitest';
import config from './index';
import { registerRichTexts } from '@/rich-text/register';

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

describe('richtext extensions', () => {
	const callout = {
		id: 'spike-callout',
		name: 'Callout',
		buttons: [{ key: 'callout', icon: 'info', label: 'Callout', command: () => {} }],
	};

	const kbd = {
		id: 'spike-kbd',
		name: 'Keyboard Key',
		buttons: [{ key: 'kbd', icon: 'keyboard', label: 'Keyboard Key', command: () => {} }],
	};

	function optionField(key: string, fieldOptions?: Record<string, unknown>) {
		return resolveOptions(fieldOptions).standard.find((f) => f.field === key);
	}

	function choices(key: string, fieldOptions?: Record<string, unknown>) {
		return optionField(key, fieldOptions)?.meta?.options?.choices as { value: string; text: string }[];
	}

	// keeps the strict core-choices assertions above unaffected
	afterEach(() => registerRichTexts([]));

	test('hides the extensions option when nothing is registered', () => {
		expect(optionField('extensions')).toBeUndefined();
	});

	test('offers every registered extension once one exists', () => {
		registerRichTexts([callout, kbd]);

		expect(choices('extensions')).toEqual([
			{ value: 'spike-callout', text: 'Callout' },
			{ value: 'spike-kbd', text: 'Keyboard Key' },
		]);
	});

	test('defaults to nothing enabled, so installing an extension leaves fields alone', () => {
		registerRichTexts([callout]);
		expect(optionField('extensions')?.schema?.default_value).toEqual([]);
	});

	test('offers a button only for the extensions the field enabled', () => {
		registerRichTexts([callout, kbd]);
		const values = choices('toolbar', { extensions: ['spike-kbd'] }).map((choice) => choice.value);

		expect(values).toContain('spike-kbd:kbd');
		expect(values).not.toContain('spike-callout:callout');
	});

	test('offers no contributed button when the field enabled no extension', () => {
		registerRichTexts([callout, kbd]);
		const values = choices('toolbar').map((choice) => choice.value);

		expect(values).not.toContain('spike-kbd:kbd');
		expect(values).not.toContain('spike-callout:callout');
	});

	test('keeps a contributed button apart from a core button with the same key', () => {
		registerRichTexts([{ id: 'spike-bold', name: 'Bold', buttons: [{ ...callout.buttons[0]!, key: 'bold' }] }]);
		const values = choices('toolbar', { extensions: ['spike-bold'] }).map((choice) => choice.value);

		expect(values.filter((value) => value === 'bold')).toHaveLength(1);
		expect(values).toContain('spike-bold:bold');
	});

	// installing an extension must not change the toolbar of existing fields
	test('leaves the default toolbar untouched', async () => {
		registerRichTexts([callout]);
		const toolbarDefault = (await import('./toolbar-default')).default;
		expect(toolbarDefault).not.toContain('callout');
	});
});

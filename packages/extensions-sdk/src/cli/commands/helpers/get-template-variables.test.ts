import { describe, expect, test } from 'vitest';
import getTemplateVariables, { fillTemplate } from './get-template-variables.js';

describe('getTemplateVariables', () => {
	test('derives every variant from a kebab-case name', () => {
		expect(getTemplateVariables('text-highlight')).toEqual({
			__EXTENSION_ID__: 'text-highlight',
			__EXTENSION_NAME__: 'Text Highlight',
			__EXTENSION_CAMEL_NAME__: 'textHighlight',
			__EXTENSION_PASCAL_NAME__: 'TextHighlight',
		});
	});

	test('drops the package scope, path, and directus-extension prefix', () => {
		expect(getTemplateVariables('@acme/directus-extension-text_highlight')).toMatchObject({
			__EXTENSION_ID__: 'text-highlight',
		});

		expect(getTemplateVariables('some/dir/text-highlight')).toMatchObject({ __EXTENSION_ID__: 'text-highlight' });
	});

	test('prefixes names that do not start with a letter', () => {
		expect(getTemplateVariables('2col')).toMatchObject({
			__EXTENSION_ID__: 'custom-2col',
			__EXTENSION_CAMEL_NAME__: 'custom2col',
		});

		expect(getTemplateVariables('---')).toMatchObject({ __EXTENSION_ID__: 'custom' });
	});
});

describe('fillTemplate', () => {
	test('replaces every occurrence of each variable', () => {
		const variables = getTemplateVariables('text-highlight');

		expect(fillTemplate("'__EXTENSION_ID__' '__EXTENSION_ID__' __EXTENSION_PASCAL_NAME__", variables)).toBe(
			"'text-highlight' 'text-highlight' TextHighlight",
		);
	});
});

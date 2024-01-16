import { expect, test } from 'vitest';
import type { SearchOptions } from '../types/search-options.js';
import { constructText } from './construct-text.js';

const cases: [Pick<SearchOptions, 'text' | 'extensionType' | 'author' | 'maintainer'>, string][] = [
	[{}, 'keywords:"directus-extension"'],
	[{ text: 'some search query' }, 'some search query keywords:"directus-extension"'],
	[
		{ text: 'some search query', extensionType: 'interface' },
		'some search query keywords:"directus-extension-interface"',
	],
	[
		{ text: 'some search query', extensionType: 'interface', author: 'rijk' },
		'some search query keywords:"directus-extension-interface" author:rijk',
	],
	[
		{ text: 'some search query', extensionType: 'interface', author: 'rijk', maintainer: 'ben' },
		'some search query keywords:"directus-extension-interface" author:rijk maintainer:ben',
	],
];

test.each(cases)('Case %#: %c %s', (input, output) => {
	expect(constructText(input)).toBe(output);
});

import { CUSTOM_ICONS } from '@directus/constants';
import { camelCase, upperFirst } from 'lodash-es';
import { expect, test } from 'vitest';
import { components } from './custom-icons';

// CUSTOM_ICONS is what the API accepts as a custom icon name, so it has to list exactly the components v-icon renders
test('CUSTOM_ICONS names every custom icon component', () => {
	const componentNames = CUSTOM_ICONS.map((name) => `CustomIcon${upperFirst(camelCase(name.replace(/_/g, '-')))}`);

	expect(componentNames.sort()).toEqual(Object.keys(components).sort());
});

import { defineDisplay } from '@directus/shared/utils';
import { TYPES } from '@directus/shared/constants';

export default defineDisplay({
	id: 'raw',
	name: '$t:displays.raw.raw',
	icon: 'code',
	component: ({ value }) => (typeof value === 'string' ? value : JSON.stringify(value)),
	options: [],
	types: TYPES,
	localTypes: ['file', 'files', 'group', 'm2a', 'm2m', 'm2o', 'o2m', 'presentation', 'standard', 'translations'],
});

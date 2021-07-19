import { defineDisplay } from '@/displays/define';
import { types } from '@directus/shared/constants';

export default defineDisplay({
	id: 'raw',
	name: '$t:displays.raw.raw',
	icon: 'code',
	handler: (value) => value,
	options: [],
	types: types,
});

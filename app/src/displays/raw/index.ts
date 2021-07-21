import { defineDisplay } from '@/displays/define';
import { types } from '@/types';

export default defineDisplay({
	id: 'raw',
	name: '$t:displays.raw.raw',
	icon: 'code',
	handler: (value) => value,
	options: [],
	types: types,
});

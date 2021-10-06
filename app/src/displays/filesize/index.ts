import { defineDisplay } from '@directus/shared/utils';
import bytes from 'bytes';

export default defineDisplay({
	id: 'filesize',
	name: '$t:displays.filesize.filesize',
	description: '$t:displays.filesize.description',
	icon: 'description',
	component: ({ value }: { value: number }) => bytes(value, { decimalPlaces: 0 }),
	options: [],
	types: ['integer'],
});

import { defineDisplay } from '@directus/extensions';
import { h } from 'vue';
import { formatFilesize } from '@/utils/format-filesize';

export default defineDisplay({
	id: 'filesize',
	name: '$t:displays.filesize.filesize',
	description: '$t:displays.filesize.description',
	icon: 'description',
	component: ({ value }: { value: number }) => h('span', null, formatFilesize(value)),
	handler: (value: number) => formatFilesize(value),
	options: [],
	types: ['integer', 'bigInteger'],
});

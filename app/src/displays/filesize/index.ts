import { defineDisplay } from '@directus/shared/utils';
import { formatFilesize } from '@/utils/format-filesize';
import { h } from 'vue';

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

import { defineDisplay } from '@directus/shared/utils';
import formatFilesize from '@/utils/format-filesize';

export default defineDisplay({
	id: 'filesize',
	name: '$t:displays.filesize.filesize',
	description: '$t:displays.filesize.description',
	icon: 'description',
	component: ({ value }: { value: number }) => formatFilesize(value),
	handler: ({ value }: { value: number }) => formatFilesize(value),
	options: [],
	types: ['integer', 'bigInteger'],
});

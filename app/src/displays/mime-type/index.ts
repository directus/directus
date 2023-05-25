import { readableMimeType } from '@/utils/readable-mime-type';
import { defineDisplay } from '@directus/utils';
import mime from 'mime/lite';
import { h } from 'vue';

export default defineDisplay({
	id: 'mime-type',
	name: '$t:displays.mime-type.mime-type',
	description: '$t:displays.mime-type.description',
	icon: 'picture_as_pdf',
	options: [
		{
			field: 'showAsExtension',
			name: '$t:displays.mime-type.extension_only',
			type: 'boolean',
			meta: {
				interface: 'boolean',
				options: {
					label: '$t:displays.mime-type.extension_only_label',
				},
			},
			schema: {
				default_value: false,
			},
		},
	],
	types: ['string'],
	component: ({ value, showAsExtension }: { value: string; showAsExtension: boolean }) => {
		if (showAsExtension) {
			return h('span', mime.getExtension(value) as string);
		}

		return h('span', readableMimeType(value) as string);
	},
	handler: (value, options) => {
		if (options.showAsExtension) {
			return mime.getExtension(value);
		}

		return readableMimeType(value);
	},
});

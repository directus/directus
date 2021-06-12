import { defineDisplay } from '@/displays/define';
import readableMimeType from '@/utils/readable-mime-type';
import mime from 'mime/lite';

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
	handler: (value: string, options) => {
		if (options && options.showAsExtension) {
			return mime.getExtension(value);
		}

		return readableMimeType(value);
	},
});

import readableMimeType from '@/utils/readable-mime-type';
import { extension } from 'mime-types';
import { defineDisplay } from '@/displays/define';

export default defineDisplay(({ i18n }) => ({
	id: 'mime-type',
	name: i18n.t('mime_type'),
	icon: 'picture_as_pdf',
	options: [
		{
			field: 'showAsExtension',
			name: i18n.t('extension_only'),
			type: 'boolean',
			system: {
				interface: 'toggle',
				options: {
					label: i18n.t('only_show_the_file_extension'),
				},
				default_value: false,
			}
		},
	],
	types: ['string'],
	handler: (value: string, options) => {
		if (options && options.showAsExtension) {
			return extension(value);
		}

		return readableMimeType(value);
	},
}));

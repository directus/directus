import readableMimeType from '@/utils/readable-mime-type';
import { extension } from 'mime-types';
import { defineDisplay } from '@/displays/define';

export default defineDisplay(({ i18n }) => ({
	id: 'mime-type',
	name: i18n.t('displays.mime-type.mime-type'),
	description: i18n.t('displays.mime-type.description'),
	icon: 'picture_as_pdf',
	options: [
		{
			field: 'showAsExtension',
			name: i18n.t('displays.mime-type.extension_only'),
			type: 'boolean',
			meta: {
				interface: 'toggle',
				options: {
					label: i18n.t('displays.mime-type.extension_only_label'),
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
			return extension(value);
		}

		return readableMimeType(value);
	},
}));

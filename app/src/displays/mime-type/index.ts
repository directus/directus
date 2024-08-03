import { readableMimeType } from '@/utils/readable-mime-type';
import { defineDisplay } from '@directus/extensions';
import mime from 'mime/lite';
import { h, defineComponent } from 'vue';

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
	component: defineComponent({
		props: {
			value: {
				type: String,
				required: true,
			},
			showAsExtension: {
				type: Boolean,
				required: true,
			},
		},
		setup(props, { slots }) {
			if (props.showAsExtension) {
				return () => [
					h('span', mime.getExtension(props.value) as string),
					slots.default && slots.default({ copyValue: mime.getExtension(props.value) }),
				];
			}

			return () => [
				h('span', readableMimeType(props.value) as string),
				slots.default && slots.default({ copyValue: readableMimeType(props.value) }),
			];
		},
	}),
	handler: (value, options) => {
		if (options.showAsExtension) {
			return mime.getExtension(value);
		}

		return readableMimeType(value);
	},
});

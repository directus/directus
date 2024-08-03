import { defineDisplay } from '@directus/extensions';
import { formatFilesize } from '@/utils/format-filesize';
import { h, defineComponent } from 'vue';

export default defineDisplay({
	id: 'filesize',
	name: '$t:displays.filesize.filesize',
	description: '$t:displays.filesize.description',
	icon: 'description',
	component: defineComponent({
		props: {
			value: {
				type: Number,
				required: true,
			},
		},
		setup(props, { slots }) {
			return () => [
				h('span', null, formatFilesize(props.value)),
				slots.default && slots.default({ copyValue: formatFilesize(props.value) }),
			];
		},
	}),
	handler: (value: number) => formatFilesize(value),
	options: [],
	types: ['integer', 'bigInteger'],
});

import { defineDisplay } from '@directus/extensions';
import { TYPES, LOCAL_TYPES } from '@directus/constants';
import { defineComponent, PropType } from 'vue';

export default defineDisplay({
	id: 'raw',
	name: '$t:displays.raw.raw',
	icon: 'code',
	component: defineComponent({
		props: {
			value: {
				type: Object as PropType<any>,
				required: true,
			},
		},
		setup(props, { slots }) {
			const value = typeof props.value === 'string' ? props.value : JSON.stringify(props.value);
			return () => [value, slots.default && slots.default({ copyValue: value })];
		},
	}),
	options: [],
	types: TYPES,
	localTypes: LOCAL_TYPES,
});

import { defineInterface } from '@directus/extensions';
import SystemFlowSelect from './system-flow-select.vue';

export default defineInterface({
	id: 'system-flow-select',
	name: '$t:interfaces.flow-select.flow-select',
	icon: 'arrow_drop_down_circle',
	component: SystemFlowSelect,
	types: ['string'],
	system: true,
	options: [
		{
			field: 'flowField',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'input',
			},
		},
	],
});

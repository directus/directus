import { defineInterface } from '@directus/extensions';
import SystemFlowSelect from './system-flow-select.vue';

export default defineInterface({
	id: 'system-flow-select',
	name: 'System Flow Select',
	description: 'Select a flow',
	icon: 'arrow_drop_down_circle',
	component: SystemFlowSelect,
	types: ['string'],
	system: true,
	options: [
		{
			field: 'flowField',
			name: 'Name goes here',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'input',
			},
		},
	],
});

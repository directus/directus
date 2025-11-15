import { defineInterface } from '@directus/extensions';
import SystemManualFlowSelect from './system-manual-flow-select.vue';

export default defineInterface({
	id: 'system-manual-flow-select',
	name: '$t:interfaces.flow-select.flow-select',
	icon: 'arrow_drop_down_circle',
	component: SystemManualFlowSelect,
	types: ['string'],
	system: true,
	options: [],
});

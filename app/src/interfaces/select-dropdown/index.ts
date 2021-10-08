import { defineInterface } from '@directus/shared/utils';
import Options from './options.vue';
import InterfaceSelectDropdown from './select-dropdown.vue';

export default defineInterface({
	id: 'select-dropdown',
	name: '$t:dropdown',
	description: '$t:interfaces.select-dropdown.description',
	icon: 'arrow_drop_down_circle',
	component: InterfaceSelectDropdown,
	types: ['string', 'bigInteger', 'integer', 'float', 'decimal'],
	options: Options,
	recommendedDisplays: ['labels'],
});

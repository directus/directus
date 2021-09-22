import { defineInterface } from '@directus/shared/utils';
import InterfaceSelectDropdownM2O from './select-dropdown-m2o.vue';
import Options from './options.vue';

export default defineInterface({
	id: 'select-dropdown-m2o',
	name: '$t:interfaces.select-dropdown-m2o.many-to-one',
	description: '$t:interfaces.select-dropdown-m2o.description',
	icon: 'arrow_right_alt',
	component: InterfaceSelectDropdownM2O,
	types: ['uuid', 'string', 'text', 'integer', 'bigInteger'],
	relational: true,
	groups: ['m2o'],
	options: Options,
	recommendedDisplays: ['related-values'],
});

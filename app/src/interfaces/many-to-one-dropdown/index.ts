import { defineInterface } from '../define';
import InterfaceManyToOneDropdown from './many-to-one-dropdown.vue';
import Options from './options.vue';

export default defineInterface(({ i18n }) => ({
	id: 'many-to-one-dropdown',
	name: 'Many to one - Filtered dropdown',
	description: 'Filtered selection of related table values',
	icon: 'arrow_right_alt',
	component: InterfaceManyToOneDropdown,
	types: ['uuid', 'string', 'text', 'integer', 'bigInteger'],
	relational: true,
	groups: ['m2o'],
	recommendedDisplays: ['related-values'],
	options: Options,
}));

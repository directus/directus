import { defineInterface } from '@/interfaces/define';
import InterfaceMap from './map.vue';
import Options from './options.vue';

export default defineInterface({
	id: 'map',
	name: '$t:interfaces.map.map',
	description: '$t:interfaces.map.description',
	icon: 'map',
	component: InterfaceMap,
	types: ['json', 'csv', 'string', 'text', 'binary', 'unknown'],
	options: Options,
	recommendedDisplays: [],
});

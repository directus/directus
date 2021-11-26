import { defineInterface } from '@directus/shared/utils';
import InterfaceMap from './map.vue';
import Options from './options.vue';

export default defineInterface({
	id: 'map',
	name: '$t:interfaces.map.map',
	description: '$t:interfaces.map.description',
	icon: 'map',
	component: InterfaceMap,
	types: [
		'geometry.Point',
		'geometry.LineString',
		'geometry.Polygon',
		'geometry.MultiPoint',
		'geometry.MultiLineString',
		'geometry.MultiPolygon',
		'geometry',
		'json',
		'string',
		'text',
		'csv',
	],
	group: 'selection',
	options: Options,
	recommendedDisplays: [],
});

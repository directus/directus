import { defineInterface } from '@directus/utils';
import type { ComponentOptions } from 'vue';
import InterfaceMap from './map.vue';
import Options from './options.vue';
import PreviewSVG from './preview.svg?raw';

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
	options: Options as ComponentOptions,
	recommendedDisplays: [],
	preview: PreviewSVG,
});

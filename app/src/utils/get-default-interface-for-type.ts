import { Type } from '@directus/types';

const defaultInterfaceMap: Record<Type, string> = {
	alias: 'input',
	bigInteger: 'input',
	binary: 'input',
	boolean: 'boolean',
	date: 'datetime',
	dateTime: 'datetime',
	decimal: 'input',
	float: 'input',
	integer: 'input',
	json: 'input-code',
	string: 'input',
	text: 'input-multiline',
	time: 'datetime',
	timestamp: 'datetime',
	uuid: 'input',
	unknown: 'input',
	csv: 'tags',
	hash: 'input-hash',
	geometry: 'map',
	'geometry.Point': 'map',
	'geometry.LineString': 'map',
	'geometry.Polygon': 'map',
	'geometry.MultiPoint': 'map',
	'geometry.MultiLineString': 'map',
	'geometry.MultiPolygon': 'map',
};

export function getDefaultInterfaceForType(type: Type): string {
	return defaultInterfaceMap[type] || 'input';
}

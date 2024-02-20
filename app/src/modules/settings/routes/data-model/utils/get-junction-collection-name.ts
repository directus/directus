import { collectionExists } from './collection-exists';

export function getAutomaticJunctionCollectionName(collectionA: string, field: string) {
	let index = 0;
	let name = getName(index);

	while (collectionExists(name)) {
		index++;
		name = getName(index);
	}

	return name;

	function getName(index: number) {
		let name = `${collectionA}_${field}`;

		if (name.startsWith('directus_')) {
			name = 'junction_' + name;
		}

		if (index) return name + '_' + index;
		return name;
	}
}

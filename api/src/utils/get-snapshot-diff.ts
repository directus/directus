import { Snapshot, Collection, Relation } from '../types';
import { Field } from '@directus/shared/types';
import { diff } from 'deep-diff';

export function getSnapshotDiff(current: Snapshot, after: Snapshot) {
	const createCollections: Collection[] = [];
	const updateCollections: Collection[] = [];

	const deleteCollections: string[] = current.collections
		.filter(
			(currentCollection) =>
				!!after.collections.find((afterCollection) => afterCollection.collection === currentCollection.collection) ===
				false
		)
		.map(({ collection }) => collection);

	for (const afterCollection of after.collections) {
		const currentCollection = current.collections.find(
			(currentCollection) => currentCollection.collection === afterCollection.collection
		);

		if (!currentCollection) {
			createCollections.push(afterCollection);
			continue;
		}

		const difference = diff(currentCollection, afterCollection);

		if (difference) {
			updateCollections.push(afterCollection);
		}
	}

	return {
		createCollections,
		updateCollections,
		deleteCollections,
	};
}

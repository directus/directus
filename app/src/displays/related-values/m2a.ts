import { getFieldsFromTemplate } from '@directus/utils';
import type { RelationM2A } from '@/composables/use-relation-m2a';
import { adjustFieldsForDisplays } from '@/utils/adjust-fields-for-displays';
import { isCollectionInactive } from '@/utils/collection-status';
import { getM2ACollectionTemplates } from '@/utils/get-m2a-collection-templates';

export function getM2AJunctionTemplate(relationInfo: RelationM2A, template?: string | null): string | null {
	return template || relationInfo.junctionCollection?.meta?.display_template || null;
}

export function getM2AFields(relationInfo: RelationM2A, template?: string | null): string[] {
	const fields = new Set([relationInfo.junctionPrimaryKeyField.field, relationInfo.collectionField.field]);
	const junctionTemplate = getM2AJunctionTemplate(relationInfo, template);
	const collectionTemplates = getM2ACollectionTemplates(relationInfo);

	if (junctionTemplate) {
		const junctionCollection = relationInfo.junctionCollection.collection;

		for (const field of adjustFieldsForDisplays(getFieldsFromTemplate(junctionTemplate), junctionCollection)) {
			fields.add(field);
		}
	}

	for (const [collection, collectionTemplate] of Object.entries(collectionTemplates)) {
		const primaryKeyField = relationInfo.relationPrimaryKeyFields[collection];

		if (!primaryKeyField || isCollectionInactive(collection)) continue;

		const collectionFields = junctionTemplate
			? []
			: adjustFieldsForDisplays(getFieldsFromTemplate(collectionTemplate), collection);

		for (const field of [...collectionFields, primaryKeyField.field]) {
			fields.add(`${relationInfo.junctionField.field}:${collection}.${field}`);
		}
	}

	return [...fields];
}

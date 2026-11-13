import type { RelationM2A } from '@/composables/use-relation-m2a';

export function getM2ACollectionTemplates(relationInfo: RelationM2A): Record<string, string> {
	const templates: Record<string, string> = {};

	for (const { collection, meta } of relationInfo.allowedCollections) {
		if (meta?.singleton === true) continue;

		const primaryKeyField = relationInfo.relationPrimaryKeyFields[collection];
		const template = meta?.display_template || (primaryKeyField ? `{{${primaryKeyField.field}}}` : null);

		if (template) templates[collection] = template;
	}

	return templates;
}

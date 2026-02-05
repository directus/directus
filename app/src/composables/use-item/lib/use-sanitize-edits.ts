import { deepMapWithSchema } from '@directus/utils';
import { set } from 'lodash';
import { useSchemaOverview } from '@/composables/use-schema-overview';
import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';

export function useSanitizeEdits(edits: Record<string, unknown>, collection: string) {
	const permissionsStore = usePermissionsStore();

	const userStore = useUserStore();
	const unsavedEdits = {};

	if (userStore.isAdmin) return { allowedEdits: edits, unsavedEdits };

	const schema = useSchemaOverview();

	const allowedEdits = deepMapWithSchema(
		edits,
		([key, value], context) => {
			const permission = permissionsStore.getPermission(context.collection.collection, context.action ?? 'update');

			if (!permission?.fields?.includes('*') && !permission?.fields?.includes(String(key))) {
				set(unsavedEdits, [...context.path, key], value);

				const primaryKey = context.collection.primary;

				// Make sure we do not loose the primary key on relational changes
				if (primaryKey !== key && context.object[primaryKey]) {
					set(unsavedEdits, [...context.path, primaryKey], context.object[primaryKey]);
				}

				return;
			}

			return [key, value];
		},
		{ collection, schema: schema.value },
		{
			detailedUpdateSyntax: true,
		},
	);

	return { allowedEdits, unsavedEdits };
}

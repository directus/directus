import { deepMapWithSchema } from '@directus/utils';
import { set } from 'lodash';
import { useSchemaOverview } from '@/composables/use-schema-overview';
import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';

export function useSanitizeEdits(edits: any, collection: string) {
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
				return;
			}

			return [key, value];
		},
		{ collection, schema },
		{
			detailedUpdateSyntax: true,
		},
	);

	return { allowedEdits, unsavedEdits };
}

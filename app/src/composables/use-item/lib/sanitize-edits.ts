import { deepMapWithSchema } from '@directus/utils';
import { set } from 'lodash';
import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';
import { getSchemaOverview } from '@/utils/get-schema-overview';

export function sanitizeEdits(edits: any, collection: string) {
	const permissionsStore = usePermissionsStore();

	const userStore = useUserStore();
	const unsavedEdits = {};

	if (userStore.isAdmin) return { allowedEdits: edits, unsavedEdits };

	const schema = getSchemaOverview();

	const allowedEdits = deepMapWithSchema(
		edits,
		([key, value], context) => {
			const permission = permissionsStore.getPermission(context.collection.collection, context.action ?? 'update');

			if (!permission?.fields?.includes('*') && permission?.fields?.includes(String(key))) {
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

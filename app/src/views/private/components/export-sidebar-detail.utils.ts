import type { Field } from '@directus/types';

type ExportFieldSelection = string[] | null | undefined;

export function sanitizeExportFieldSelection(
	selectedFields: ExportFieldSelection,
	collectionFields: Field[] | null | undefined,
): ExportFieldSelection {
	if (!selectedFields || selectedFields.length === 0 || !collectionFields?.length) return selectedFields;

	const aliasFields = new Set(
		collectionFields
			.filter((field) => field.type === 'alias' || field.meta?.special?.includes('alias'))
			.map((field) => field.field),
	);

	return selectedFields.filter((fieldKey) => !aliasFields.has(getRootField(fieldKey)));
}

function getRootField(fieldKey: string) {
	const [rootPathSegment = fieldKey] = fieldKey.split('.');
	return rootPathSegment.split(':')[0] ?? rootPathSegment;
}

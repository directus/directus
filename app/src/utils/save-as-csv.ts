import { useAliasFields } from '@/composables/use-alias-fields';
import { useFieldsStore } from '@/stores/fields';
import { get } from '@directus/shared/utils';
import { Field, Item } from '@directus/shared/types';
import { saveAs } from 'file-saver';
import { parse } from 'json2csv';
import { computed, ref } from 'vue';
import { useExtension } from '@/composables/use-extension';

/**
 * Saves the given collection + items combination as a CSV file
 */
export async function saveAsCSV(collection: string, fields: string[], items: Item[]) {
	const fieldsStore = useFieldsStore();

	const fieldsUsed: Record<string, Field | null> = {};

	for (const key of fields) {
		fieldsUsed[key] = fieldsStore.getField(collection, key);
	}

	const { aliasFields } = useAliasFields(ref(fields));

	const parsedItems = [];

	for (const item of items) {
		const parsedItem: Record<string, any> = {};

		for (const key of fields) {
			let name: string;

			const keyParts = key.split('.');

			if (keyParts.length > 1) {
				const names = keyParts.map((fieldKey, index) => {
					const pathPrefix = keyParts.slice(0, index);
					const field = fieldsStore.getField(collection, [...pathPrefix, fieldKey].join('.'));
					return field?.name ?? fieldKey;
				});

				name = names.join(' -> ');
			} else {
				name = fieldsUsed[key]?.name ?? key;
			}

			const value =
				!aliasFields.value?.[key] || item[key] !== undefined
					? get(item, key)
					: get(item, aliasFields.value[key].fullAlias);

			const display = useExtension(
				'display',
				computed(() => fieldsUsed[key]?.meta?.display ?? null)
			);

			if (value !== undefined && value !== null) {
				parsedItem[name] = display.value?.handler
					? await display.value.handler(value, fieldsUsed[key]?.meta?.display_options ?? {}, {
							interfaceOptions: fieldsUsed[key]?.meta?.options ?? {},
							field: fieldsUsed[key] ?? undefined,
							collection: collection,
					  })
					: value;
			} else {
				parsedItem[name] = value;
			}
		}

		parsedItems.push(parsedItem);
	}

	const csvContent = parse(parsedItems);
	const now = new Date();

	const dateString = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now
		.getDate()
		.toString()
		.padStart(2, '0')}`;

	saveAs(new Blob([csvContent], { type: 'text/csv;charset=utf-8' }), `${collection}-${dateString}.csv`);
}

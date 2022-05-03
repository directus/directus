import { Item, Field, DisplayConfig } from '@directus/shared/types';
import { saveAs } from 'file-saver';
import { parse } from 'json2csv';
import { getDisplay } from '@/displays';
import { useFieldsStore } from '@/stores';

/**
 * Saves the given collection + items combination as a CSV file
 */
export async function saveAsCSV(collection: string, items: Item[]) {
	const fieldsStore = useFieldsStore();

	// It should be safe to assume that every object in the array of items has the same type signature
	const fieldKeys = Object.entries(items[0]).map(([key]) => key);

	const fieldsUsed: Record<string, Field | null> = {};

	for (const key of fieldKeys) {
		fieldsUsed[key] = fieldsStore.getField(collection, key);
	}

	const parsedItems = [];

	for (const item of items) {
		const parsedItem: Record<string, any> = {};

		for (const [key, value] of Object.entries(item)) {
			const name = fieldsUsed[key]?.name ?? key;

			let display: DisplayConfig | undefined;

			if (fieldsUsed[key]?.meta?.display) {
				display = getDisplay(fieldsUsed[key]!.meta!.display);
			}

			if (value !== undefined && value !== null) {
				parsedItem[name] = display?.handler
					? await display.handler(value, fieldsUsed[key]?.meta?.display_options ?? {}, {
							interfaceOptions: fieldsUsed[key]?.meta?.options ?? {},
							field: fieldsUsed[key] ?? undefined,
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

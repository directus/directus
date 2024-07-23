import { useFieldsStore } from '@/stores/fields';

export function fieldExists(collection: string, field: string) {
	return !!useFieldsStore().getField(collection, field);
}

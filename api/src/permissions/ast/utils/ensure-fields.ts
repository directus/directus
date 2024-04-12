import type { FieldMap } from "../types.js";

export function ensureFields(fieldMap: FieldMap, collection: string) {
	if (!fieldMap[collection]) {
		fieldMap[collection] = [];
	}
}

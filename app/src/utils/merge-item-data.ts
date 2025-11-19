import { mergeWith } from 'lodash';

export function mergeItemData(
	defaultValues: Record<string, any>,
	existingValues: Record<string, any>,
	edits: Record<string, any>,
) {
	return mergeWith({}, defaultValues, existingValues, edits, customizer);

	function customizer(_from: unknown, to: unknown): any {
		if (typeof to !== 'undefined') return to;
	}
}

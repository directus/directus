import { ref, type InjectionKey } from 'vue';

export interface FieldAnimations {
	triggerAnimations: (fields: string[]) => void;
	clearAnimation: (field: string) => void;
	getAnimationKey: (field: string) => number | undefined;
	getAnimationDelay: (field: string) => number;
}

export const fieldAnimationsKey: InjectionKey<FieldAnimations> = Symbol('field-animations');

const FIELD_ANIMATION_STAGGER = 150; // Stagger per field for smooth cascade

export function useFieldAnimations(): FieldAnimations {
	const updatedFields = ref<Map<string, number>>(new Map());

	function triggerAnimations(fields: string[]) {
		const newMap = new Map(updatedFields.value);
		const baseTime = Date.now();

		fields.forEach((field, index) => {
			// Handle nested paths - animate the top-level field
			const topLevel = field.includes('.') ? field.split('.')[0]! : field;
			// Stagger timestamps by 10ms for reliable ordering
			newMap.set(topLevel, baseTime + index * 10);
		});

		updatedFields.value = newMap;
	}

	function clearAnimation(field: string) {
		if (!updatedFields.value.has(field)) return;

		const newMap = new Map(updatedFields.value);
		newMap.delete(field);
		updatedFields.value = newMap;
	}

	function getAnimationKey(field: string): number | undefined {
		return updatedFields.value.get(field);
	}

	function getAnimationDelay(field: string): number {
		const timestamp = updatedFields.value.get(field);
		if (!timestamp) return 0;

		// Sort by timestamp to determine animation order
		const sorted = [...updatedFields.value.entries()].sort((a, b) => a[1] - b[1]);
		const index = sorted.findIndex(([f]) => f === field);

		return index * FIELD_ANIMATION_STAGGER;
	}

	return {
		triggerAnimations,
		clearAnimation,
		getAnimationKey,
		getAnimationDelay,
	};
}

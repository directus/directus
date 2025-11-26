import { ref, type InjectionKey } from 'vue';

interface FieldAnimationState {
	key: number;
	delay: number;
}

export interface FieldAnimations {
	triggerAnimations: (fields: string[]) => void;
	clearAnimation: (field: string) => void;
	getAnimationKey: (field: string) => number | undefined;
	getAnimationDelay: (field: string) => number;
}

export const fieldAnimationsKey: InjectionKey<FieldAnimations> = Symbol('field-animations');

const FIELD_ANIMATION_STAGGER = 150; // Stagger per field for smooth cascade

export function useFieldAnimations(): FieldAnimations {
	const updatedFields = ref<Map<string, FieldAnimationState>>(new Map());

	function triggerAnimations(fields: string[]) {
		const newMap = new Map(updatedFields.value);
		const baseKey = Date.now();

		fields.forEach((field, index) => {
			const [topLevel] = field.split('.');

			newMap.set(topLevel!, {
				key: baseKey + index,
				delay: index * FIELD_ANIMATION_STAGGER,
			});
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
		return updatedFields.value.get(field)?.key;
	}

	function getAnimationDelay(field: string): number {
		return updatedFields.value.get(field)?.delay ?? 0;
	}

	return {
		triggerAnimations,
		clearAnimation,
		getAnimationKey,
		getAnimationDelay,
	};
}

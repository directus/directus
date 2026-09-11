import { onBeforeUpdate, ref, type Ref, type Slots } from 'vue';

export function useSlotPresence(slots: Slots, name: string): Ref<boolean> {
	const hasSlot = ref(slots[name] !== undefined);

	onBeforeUpdate(() => {
		hasSlot.value = slots[name] !== undefined;
	});

	return hasSlot;
}

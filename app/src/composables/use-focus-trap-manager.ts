import type { UseFocusTrapReturn as FocusTrap } from '@vueuse/integrations/useFocusTrap';
import { inject, provide, ref } from 'vue';

const nestedValidationSymbol = 'focusTrapManager';

export function useFocusTrapManager() {
	const trap = ref<FocusTrap>();

	provide(nestedValidationSymbol, { pauseFocusTrap, unpauseFocusTrap });

	return { addFocusTrap };

	function addFocusTrap(focusTrap: FocusTrap) {
		trap.value = focusTrap;
	}

	function pauseFocusTrap() {
		trap.value?.pause();
	}

	function unpauseFocusTrap() {
		trap.value?.unpause();
	}
}

export function useInjectFocusTrapManager() {
	return inject(nestedValidationSymbol, {
		pauseFocusTrap: () => {},
		unpauseFocusTrap: () => {},
	});
}

export interface DialogTrapHandle {
	/** Mirrors the visual z-index stacking of the dialog placements */
	readonly zRank: number;
	reassert: () => void;
}

const activeDialogTraps: DialogTrapHandle[] = [];

/**
 * Dialog focus traps activate in mount order, which may not match their visual stacking:
 * a route drawer mounting after an already-open center modal would put its trap on top of
 * the focus-trap stack and block all interaction with the modal rendered above it.
 * Whenever a dialog trap activates, re-assert the highest-ranked active dialog trap
 * (most recently activated wins ties) so the trap order matches the visual order.
 */
export function registerDialogTrap(handle: DialogTrapHandle) {
	activeDialogTraps.push(handle);

	let top = handle;

	for (const trap of activeDialogTraps) {
		if (trap.zRank >= top.zRank) top = trap;
	}

	if (top !== handle) top.reassert();
}

export function unregisterDialogTrap(handle: DialogTrapHandle) {
	const index = activeDialogTraps.indexOf(handle);
	if (index !== -1) activeDialogTraps.splice(index, 1);
}

import { describe, expect, it, vi } from 'vitest';
import { type DialogTrapHandle, registerDialogTrap, unregisterDialogTrap } from './use-focus-trap-manager';

function makeHandle(zRank: number): DialogTrapHandle & { reassert: ReturnType<typeof vi.fn> } {
	return { zRank, reassert: vi.fn() };
}

describe('registerDialogTrap', () => {
	it('does not reassert when the new trap has the highest rank', () => {
		const drawer = makeHandle(500);
		const modal = makeHandle(600);

		registerDialogTrap(drawer);
		registerDialogTrap(modal);

		expect(drawer.reassert).not.toHaveBeenCalled();
		expect(modal.reassert).not.toHaveBeenCalled();

		unregisterDialogTrap(drawer);
		unregisterDialogTrap(modal);
	});

	it('reasserts an active center modal when a drawer activates after it', () => {
		// customer scenario: license modal already open, route drawer (field detail) mounts after
		const modal = makeHandle(600);
		const drawer = makeHandle(500);

		registerDialogTrap(modal);
		registerDialogTrap(drawer);

		expect(modal.reassert).toHaveBeenCalledOnce();
		expect(drawer.reassert).not.toHaveBeenCalled();

		unregisterDialogTrap(modal);
		unregisterDialogTrap(drawer);
	});

	it('lets the most recently activated trap win ties', () => {
		const drawerOne = makeHandle(500);
		const drawerTwo = makeHandle(500);

		registerDialogTrap(drawerOne);
		registerDialogTrap(drawerTwo);

		expect(drawerOne.reassert).not.toHaveBeenCalled();
		expect(drawerTwo.reassert).not.toHaveBeenCalled();

		unregisterDialogTrap(drawerOne);
		unregisterDialogTrap(drawerTwo);
	});

	it('reasserts the most recently activated of multiple higher-ranked traps', () => {
		const modalOne = makeHandle(600);
		const modalTwo = makeHandle(600);
		const drawer = makeHandle(500);

		registerDialogTrap(modalOne);
		registerDialogTrap(modalTwo);
		registerDialogTrap(drawer);

		expect(modalOne.reassert).not.toHaveBeenCalled();
		expect(modalTwo.reassert).toHaveBeenCalledOnce();

		unregisterDialogTrap(modalOne);
		unregisterDialogTrap(modalTwo);
		unregisterDialogTrap(drawer);
	});

	it('keeps keep-behind center dialogs below regular drawers', () => {
		const keepBehindModal = makeHandle(500);
		const drawer = makeHandle(500);

		registerDialogTrap(keepBehindModal);
		registerDialogTrap(drawer);

		// equal rank: drawer activated later, stays on top
		expect(keepBehindModal.reassert).not.toHaveBeenCalled();

		unregisterDialogTrap(keepBehindModal);
		unregisterDialogTrap(drawer);
	});

	it('does not reassert unregistered traps', () => {
		const modal = makeHandle(600);
		const drawer = makeHandle(500);

		registerDialogTrap(modal);
		unregisterDialogTrap(modal);
		registerDialogTrap(drawer);

		expect(modal.reassert).not.toHaveBeenCalled();

		unregisterDialogTrap(drawer);
	});
});

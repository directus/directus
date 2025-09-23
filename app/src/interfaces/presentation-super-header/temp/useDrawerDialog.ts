import { computed, ref } from 'vue';

/**
 * Composable for handling dialog positioning within drawers
 * Manages z-index stacking when dialogs are opened within drawers
 * and when subsequent drawers are opened from within those dialogs
 */
export function useDrawerDialog(dialogActive: () => boolean) {
	const isInsideDrawer = ref(false);
	const drawerCount = ref(0);
	const forceKeepBehind = ref(false);

	// Computed property to determine if dialog should be kept behind
	const dialogKeepBehind = computed(() => {
		return forceKeepBehind.value || !isInsideDrawer.value;
	});

	// Check if component is inside a drawer
	const detectDrawer = (element: HTMLElement | null) => {
		if (!element) return false;

		let currentElement: HTMLElement | null = element;

		while (currentElement) {
			if (
				currentElement.classList &&
				(currentElement.classList.contains('v-drawer') || currentElement.closest('.v-drawer'))
			) {
				return true;
			}

			currentElement = currentElement.parentElement;
		}

		return false;
	};

	// Observer to watch for drawer additions/removals
	const observeDialogOutlet = () => {
		const dialogOutlet = document.querySelector('#dialog-outlet');
		if (!dialogOutlet) return;

		// Initialize drawer count
		setTimeout(() => {
			const initialDrawers = dialogOutlet.querySelectorAll('.v-drawer').length;
			drawerCount.value = initialDrawers;
		}, 0);

		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (mutation.type === 'childList') {
					const currentDrawerCount = dialogOutlet.querySelectorAll('.v-drawer').length;

					if (currentDrawerCount > drawerCount.value) {
						// A new drawer was added
						drawerCount.value = currentDrawerCount;

						if (isInsideDrawer.value && dialogActive() && currentDrawerCount > 1) {
							// Dialog should go behind the new drawer
							forceKeepBehind.value = true;
						}
					} else if (currentDrawerCount < drawerCount.value) {
						// A drawer was removed
						drawerCount.value = currentDrawerCount;

						// Reset to original behavior based on whether we're in the initial drawer
						if (currentDrawerCount === 1 && isInsideDrawer.value && dialogActive()) {
							// Back to original state - dialog should be on top of the initial drawer
							forceKeepBehind.value = false;
						}
					}
				}
			});
		});

		observer.observe(dialogOutlet, { childList: true, subtree: true });

		// Return cleanup function
		return () => {
			observer.disconnect();
		};
	};

	// Initialize drawer detection for a specific element
	const initializeDrawerDetection = (element: HTMLElement | null) => {
		if (!element) return;

		isInsideDrawer.value = detectDrawer(element);

		const cleanup = observeDialogOutlet();

		// Return cleanup function
		return cleanup;
	};

	return {
		isInsideDrawer,
		dialogKeepBehind,
		initializeDrawerDetection,
	};
}

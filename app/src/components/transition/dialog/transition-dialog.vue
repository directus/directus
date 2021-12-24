<template>
	<transition name="dialog">
		<slot />
	</transition>
</template>

<style lang="scss">
/** @NOTE this is not scoped on purpose. The children are outside of the tree (teleport) */

.dialog-enter-active,
.dialog-leave-active {
	transition-duration: var(--slow);

	.v-overlay {
		opacity: 1;
		transition: opacity var(--slow) ease-out;
	}

	&.center > *:not(.v-overlay) {
		transform: translateY(0px);
		transition: transform var(--slow) ease-out;
	}

	&.right > *:not(.v-overlay) {
		transform: translateX(0px);
		transition: transform var(--slow) ease-out;
	}
}

.dialog-enter-from,
.dialog-leave-to {
	.v-overlay {
		opacity: 0;
		transition: opacity var(--slow) ease-in;
	}

	&.center > *:not(.v-overlay) {
		transform: translateY(50px);
		transition: transform var(--slow) ease-in;
	}

	&.right > *:not(.v-overlay) {
		transform: translateX(var(--v-drawer-max-width));
		transition: transform var(--slow) ease-in;
	}
}
</style>

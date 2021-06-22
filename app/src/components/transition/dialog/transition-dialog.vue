<template>
	<transition name="dialog">
		<slot />
	</transition>
</template>

<style lang="scss">
/** @NOTE this is not scoped on purpose. The children are outside of the tree (teleport) */

.dialog-enter-active,
.dialog-leave-active {
	transition-duration: var(--medium);

	.v-overlay {
		opacity: 1;
		transition: opacity var(--medium) var(--transition-in);
	}

	&.center > *:not(.v-overlay) {
		transform: translateY(0px);
		transition: transform var(--medium) var(--transition-in);
	}

	&.right > *:not(.v-overlay) {
		transform: translateX(0px);
		transition: transform var(--medium) var(--transition-in);
	}
}

.dialog-enter-from,
.dialog-leave-to {
	.v-overlay {
		opacity: 0;
		transition: opacity var(--medium) var(--transition-out);
	}

	&.center > *:not(.v-overlay) {
		transform: translateY(50px);
		transition: transform var(--medium) var(--transition-out);
	}

	&.right > *:not(.v-overlay) {
		transform: translateX(var(--v-drawer-max-width));
		transition: transform var(--medium) var(--transition-out);
	}
}
</style>

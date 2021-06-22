<template>
	<transition name="dialog">
		<slot />
	</transition>
</template>

<style lang="scss">
/** @NOTE this is not scoped on purpose. The children are outside of the tree (teleport) */

.dialog-enter-active,
.dialog-leave-active {
	transition-duration: var(--fast);

	.v-overlay {
		opacity: 1;
		transition: opacity var(--fast) linear;
	}

	&.center > *:not(.v-overlay) {
		transform: translateY(0px);
		transition: transform var(--fast) linear;
	}

	&.right > *:not(.v-overlay) {
		transform: translateX(0px);
		transition: transform var(--fast) linear;
	}
}

.dialog-enter-from,
.dialog-leave-to {
	.v-overlay {
		opacity: 0;
		transition: opacity var(--fast) linear;
	}

	&.center > *:not(.v-overlay) {
		transform: translateY(100%);
		transition: transform var(--fast) linear;
	}

	&.right > *:not(.v-overlay) {
		transform: translateX(var(--v-drawer-max-width));
		transition: transform var(--fast) linear;
	}
}
</style>

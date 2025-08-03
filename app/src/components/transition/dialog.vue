<template>
	<transition name="dialog">
		<slot />
	</transition>
</template>

<style lang="scss">
/** @NOTE this is not scoped on purpose. The children are outside of the tree (teleport) */

.dialog-enter-active,
.dialog-leave-active {
	transition: opacity var(--slow) var(--transition);

	&.center > *:not(.v-overlay) {
		transform: translateY(0);
		transition: transform var(--slow) var(--transition-in);
	}

	&.right > *:not(.v-overlay) {
		transform: translateX(0);
		transition: transform var(--slow) var(--transition-in);

		html[dir='rtl'] & {
			transform: translateX(0);
		}
	}
}

.dialog-enter-from,
.dialog-leave-to {
	opacity: 0;

	&.center > *:not(.v-overlay) {
		transform: translateY(50px);
		transition: transform var(--slow) var(--transition-out);
	}

	&.right > *:not(.v-overlay) {
		transform: translateX(50px);
		transition: transform var(--slow) var(--transition-out);

		html[dir='rtl'] & {
			transform: translateX(-50px);
		}
	}
}
</style>

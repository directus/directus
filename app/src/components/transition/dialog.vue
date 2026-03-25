<template>
	<Transition name="dialog">
		<slot />
	</Transition>
</template>

<style lang="scss">
/** @NOTE this is not scoped on purpose. The children are outside of the tree (teleport) */

.dialog-enter-active,
.dialog-leave-active {
	transition: opacity var(--medium) var(--transition);

	&.center > *:not(.v-overlay) {
		transform: translateY(0);
		transition: transform var(--medium) var(--transition-in);
	}

	&:is(.right, .left) > *:not(.v-overlay) {
		transform: translateX(0);
		transition: transform var(--medium) var(--transition-in);

		html[dir='rtl'] & {
			transform: translateX(0);
		}
	}
}

.dialog-enter-from,
.dialog-leave-to {
	opacity: 0;

	&.center > *:not(.v-overlay) {
		transform: translateY(2.8125rem);
		transition: transform var(--medium) var(--transition-out);
	}

	&.left > *:not(.v-overlay) {
		transform: translateX(-2.8125rem);
		transition: transform var(--medium) var(--transition-out);

		html[dir='rtl'] & {
			transform: translateX(2.8125rem);
		}
	}

	&.right > *:not(.v-overlay) {
		transform: translateX(2.8125rem);
		transition: transform var(--medium) var(--transition-out);

		html[dir='rtl'] & {
			transform: translateX(-2.8125rem);
		}
	}
}
</style>

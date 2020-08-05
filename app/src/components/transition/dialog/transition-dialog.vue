<template>
	<transition-group name="dialog">
		<slot />
	</transition-group>
</template>

<style lang="scss">
/** @NOTE this is not scoped on purpose. The children are outsisde of the tree (portal) */
.dialog-enter-active,
.dialog-leave-active {
	transition: opacity var(--slow) var(--transition);

	& > *:not(.v-overlay) {
		transform: translateY(0px);
		transition: transform var(--slow) var(--transition-in);
	}
}

.dialog-enter,
.dialog-leave-to {
	opacity: 0;

	& > *:not(.v-overlay) {
		transform: translateY(50px);
		transition: transform var(--slow) var(--transition-out);
	}
}
</style>

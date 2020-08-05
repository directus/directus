<template>
	<transition name="dialog">
		<slot />
	</transition>
</template>

<style lang="scss" scoped>
.dialog-enter-active,
.dialog-leave-active {
	transition: opacity var(--slow) var(--transition);

	::v-deep > *:not(.v-overlay) {
		transform: translateY(0px);
		transition: transform var(--slow) var(--transition-in);
	}
}

.dialog-enter,
.dialog-leave-to {
	opacity: 0;

	::v-deep > *:not(.v-overlay) {
		transform: translateY(50px);
		transition: transform var(--slow) var(--transition-out);
	}
}
</style>

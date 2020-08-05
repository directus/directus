<template>
	<transition name="bounce">
		<slot />
	</transition>
</template>

<style lang="scss" scoped>
.bounce-enter-active,
.bounce-leave-active {
	transition: opacity var(--fast) var(--transition);

	& ::v-deep > .v-menu-content {
		transition: transform var(--fast) cubic-bezier(0, 0, 0.2, 1.5);
	}
}

.bounce-enter,
.bounce-leave-to {
	opacity: 0;

	&[data-placement='top'] ::v-deep > .v-menu-content {
		transform: scaleY(0.8);
	}

	&[data-placement='top-start'] ::v-deep > .v-menu-content {
		transform: scaleY(0.8) scaleX(0.8);
	}

	&[data-placement='top-end'] ::v-deep > .v-menu-content {
		transform: scaleY(0.8) scaleX(0.8);
	}

	&[data-placement='right'] ::v-deep > .v-menu-content {
		transform: scaleX(0.8);
	}

	&[data-placement='right-start'] ::v-deep > .v-menu-content {
		transform: scaleY(0.8) scaleX(0.8);
	}

	&[data-placement='right-end'] ::v-deep > .v-menu-content {
		transform: scaleY(0.8) scaleX(0.8);
	}

	&[data-placement='bottom'] ::v-deep > .v-menu-content {
		transform: scaleY(0.8);
	}

	&[data-placement='bottom-start'] ::v-deep > .v-menu-content {
		transform: scaleY(0.8);
	}

	&[data-placement='bottom-end'] ::v-deep > .v-menu-content {
		transform: scaleY(0.8);
	}

	&[data-placement='left'] ::v-deep > .v-menu-content {
		transform: scaleX(0.8);
	}

	&[data-placement='left-start'] ::v-deep > .v-menu-content {
		transform: scaleY(0.8) scaleX(0.8);
	}

	&[data-placement='left-end'] ::v-deep > .v-menu-content {
		transform: scaleY(0.8) scaleX(0.8);
	}
}
</style>

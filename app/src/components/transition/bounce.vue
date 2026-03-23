<template>
	<TransitionGroup name="bounce" tag="div" v-bind="$attrs">
		<slot />
	</TransitionGroup>
</template>

<style lang="scss">
/** @NOTE this is not scoped on purpose. The children are outside of the tree (teleport) */

.bounce-enter-active,
.bounce-leave-active {
	transition: opacity var(--fast) var(--transition);

	& > .v-menu-content {
		transition: transform var(--fast) cubic-bezier(0, 0, 0.2, 1.5);
	}
}

.bounce-enter-from,
.bounce-leave-to {
	opacity: 0;

	&[data-placement='top'] > .v-menu-content {
		transform: scaleY(0.8);
	}

	&[data-placement='top-start'] > .v-menu-content {
		transform: scaleY(0.8) scaleX(0.8);
	}

	&[data-placement='top-end'] > .v-menu-content {
		transform: scaleY(0.8) scaleX(0.8);
	}

	&[data-placement='right'] > .v-menu-content {
		transform: scaleX(0.8);
	}

	&[data-placement='right-start'] > .v-menu-content {
		transform: scaleY(0.8) scaleX(0.8);
	}

	&[data-placement='right-end'] > .v-menu-content {
		transform: scaleY(0.8) scaleX(0.8);
	}

	&[data-placement='bottom'] > .v-menu-content {
		transform: scaleY(0.8);
	}

	&[data-placement='bottom-start'] > .v-menu-content {
		transform: scaleY(0.8);
	}

	&[data-placement='bottom-end'] > .v-menu-content {
		transform: scaleY(0.8);
	}

	&[data-placement='left'] > .v-menu-content {
		transform: scaleX(0.8);
	}

	&[data-placement='left-start'] > .v-menu-content {
		transform: scaleY(0.8) scaleX(0.8);
	}

	&[data-placement='left-end'] > .v-menu-content {
		transform: scaleY(0.8) scaleX(0.8);
	}
}
</style>

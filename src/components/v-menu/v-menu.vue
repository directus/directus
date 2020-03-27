<template>
	<div
		class="v-menu"
		v-click-outside="{
			handler: deactivate,
			disabled: closeOnClick === false,
		}"
	>
		<div ref="activator" class="v-menu-activator">
			<slot name="activator" v-bind="{ toggle: toggle, active: isActive }" />
		</div>

		<div ref="popper" class="v-menu-popper">
			<div v-show="showArrow" class="arrow" :class="{ active: isActive }" data-popper-arrow />
			<div :class="{ active: isActive }" class="v-menu-content" @click="onContentClick">
				<slot />
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, PropType, computed } from '@vue/composition-api';
import { usePopper } from './use-popper';
import { Placement } from '@popperjs/core';

export default defineComponent({
	props: {
		placement: {
			type: String as PropType<Placement>,
			default: 'bottom',
		},
		value: {
			type: Boolean,
			default: undefined,
		},
		closeOnClick: {
			type: Boolean,
			default: true,
		},
		closeOnContentClick: {
			type: Boolean,
			default: false,
		},
		attached: {
			type: Boolean,
			default: false,
		},
		showArrow: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		const activator = ref<HTMLElement>(null);
		const popper = ref<HTMLElement>(null);

		const reference = computed<HTMLElement | null>(() => {
			return (activator.value as HTMLElement)?.childNodes[0] as HTMLElement;
		});

		const { placement: popperPlacement } = usePopper(
			reference,
			popper,
			computed(() => ({
				placement: props.placement as Placement,
				attached: props.attached,
				arrow: props.showArrow,
			}))
		);

		const { isActive, deactivate, toggle } = useActiveState();

		return {
			activator,
			reference,
			popper,
			isActive,
			toggle,
			popperPlacement,
			deactivate,
			onContentClick,
		};

		function useActiveState() {
			const localIsActive = ref(false);
			const isActive = computed<boolean>({
				get() {
					if (props.value !== undefined) {
						return props.value;
					}

					return localIsActive.value;
				},
				set(newActive) {
					emit('input', newActive);
					localIsActive.value = newActive;
				},
			});

			return { isActive, activate, deactivate, toggle };

			function activate() {
				isActive.value = true;
			}

			function deactivate() {
				isActive.value = false;
			}

			function toggle() {
				isActive.value = !isActive.value;
			}
		}

		function onContentClick() {
			if (props.closeOnContentClick === true) {
				deactivate();
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.v-menu {
	display: contents;
}

.v-menu-activator {
	display: contents;
}

.v-menu-popper {
	.arrow,
	.arrow::before {
		position: absolute;
		z-index: -1;
		width: 8px;
		height: 8px;
	}

	.arrow {
		&::before {
			background: var(--input-border-color);
			transform: rotate(45deg) scale(0);
			transition: transform var(--fast) var(--transition-out);
			transition-delay: 0;
			content: '';
		}

		&.active::before {
			transform: rotate(45deg) scale(1);
			transition: transform var(--medium) var(--transition-in);
		}
	}

	&[data-popper-placement^='top'] .arrow {
		bottom: -4px;
	}

	&[data-popper-placement^='bottom'] .arrow {
		top: -4px;
	}

	&[data-popper-placement^='right'] .arrow {
		left: -4px;
	}

	&[data-popper-placement^='left'] .arrow {
		left: -4px;
	}

	.v-menu-content {
		overflow-x: hidden;
		overflow-y: auto;
		background-color: var(--highlight);
		border: 2px solid var(--input-border-color);
		border-radius: var(--input-border-radius);
		opacity: 0;
		transition-timing-function: var(--transition-out);
		transition-duration: var(--fast);
		transition-property: opacity, transform;
		pointer-events: none;
		contain: content;

		.v-list {
			--v-list-background-color: transparent;
		}
	}

	&[data-popper-placement='top'] .v-menu-content {
		transform: scaleY(0.8);
		transform-origin: bottom center;
	}

	&[data-popper-placement='top-start'] .v-menu-content {
		transform: scaleY(0.8) scaleX(0.8);
		transform-origin: bottom left;
	}

	&[data-popper-placement='top-end'] .v-menu-content {
		transform: scaleY(0.8) scaleX(0.8);
		transform-origin: bottom right;
	}

	&[data-popper-placement='right'] .v-menu-content {
		transform: scaleX(0.8);
		transform-origin: center left;
	}

	&[data-popper-placement='right-start'] .v-menu-content {
		transform: scaleY(0.8) scaleX(0.8);
		transform-origin: top left;
	}

	&[data-popper-placement='right-end'] .v-menu-content {
		transform: scaleY(0.8) scaleX(0.8);
		transform-origin: bottom left;
	}

	&[data-popper-placement='bottom'] .v-menu-content {
		transform: scaleY(0.8);
		transform-origin: top center;
	}

	&[data-popper-placement='bottom-start'] .v-menu-content {
		transform: scaleY(0.8);
		transform-origin: top left;
	}

	&[data-popper-placement='bottom-end'] .v-menu-content {
		transform: scaleY(0.8);
		transform-origin: top right;
	}

	&[data-popper-placement='left'] .v-menu-content {
		transform: scaleX(0.8);
		transform-origin: center right;
	}

	&[data-popper-placement='left-start'] .v-menu-content {
		transform: scaleY(0.8) scaleX(0.8);
		transform-origin: top right;
	}

	&[data-popper-placement='left-end'] .v-menu-content {
		transform: scaleY(0.8) scaleX(0.8);
		transform-origin: bottom right;
	}

	.v-menu-content.active {
		transform: scaleY(1) scaleX(1);
		opacity: 1;
		transition-timing-function: cubic-bezier(0, 0, 0.2, 1.5);
		transition-duration: var(--medium);
		pointer-events: all;
	}
}
</style>

<template>
	<div
		class="v-menu"
		v-click-outside="{
			handler: deactivate,
			disabled: isActive === false || closeOnClick === false,
		}"
	>
		<div ref="activator" class="v-menu-activator">
			<slot name="activator" v-bind="{ toggle: toggle, active: isActive }" />
		</div>

		<div
			ref="popper"
			class="v-menu-popper"
			:class="{ active: isActive, attached }"
			:data-placement="popperPlacement"
			:style="styles"
		>
			<div
				class="arrow"
				:class="{ active: showArrow && isActive }"
				:style="arrowStyles"
				data-popper-arrow
			/>
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
		disabled: {
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

		const { start, stop, styles, arrowStyles, placement: popperPlacement } = usePopper(
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
			deactivate,
			onContentClick,
			styles,
			arrowStyles,
			popperPlacement,
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
				async set(newActive) {
					if (newActive === true) {
						await start();
					} else {
						stop();
					}

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
				if (props.disabled === true) return;
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
	--v-menu-min-width: 100px;

	display: contents;
}

.v-menu-activator {
	display: contents;
	&::before {
		position: absolute;
		top: 0;
		right: 0;
		width: 2px;
		height: 2px;
		background: var(--border-normal);
		content: '';
	}
}

.v-menu-popper {
	position: absolute;
	left: -999px;
	z-index: 5;
	min-width: var(--v-menu-min-width);
	transform: translateY(2px);
	pointer-events: none;

	&.active {
		pointer-events: all;
	}

	.arrow,
	.arrow::before,
	.arrow::after {
		position: absolute;
		z-index: 1;
		width: 8px;
		height: 8px;
		border-radius: 2px;
	}

	.arrow {
		&::before,
		&::after {
			background: var(--border-normal);
			transform: rotate(45deg) scale(0);
			transition: transform var(--fast) var(--transition-out);
			transition-delay: 0;
			content: '';
		}

		&.active::before,
		&.active::after {
			transform: rotate(45deg) scale(1);
			transition: transform var(--medium) var(--transition-in);
		}

		&::after {
			background: var(--background-subdued);
		}
	}

	&[data-placement^='top'] .arrow {
		bottom: -4px;

		&::after {
			bottom: 3px;
		}
	}

	&[data-placement^='bottom'] .arrow {
		top: -4px;

		&::after {
			top: 3px;
		}
	}

	&[data-placement^='right'] .arrow {
		left: -4px;

		&::after {
			left: 3px;
		}
	}

	&[data-placement^='left'] .arrow {
		right: -4px;

		&::after {
			right: 3px;
		}
	}

	.v-menu-content {
		max-height: 50vh;
		padding: 0 4px;
		overflow-x: hidden;
		overflow-y: auto;
		background-color: var(--background-subdued);
		border: 2px solid var(--border-normal);
		border-radius: var(--border-radius);
		box-shadow: 0px 4px 12px rgba(38, 50, 56, 0.1);
		opacity: 0;
		transition-timing-function: var(--transition-out);
		transition-duration: var(--fast);
		transition-property: opacity, transform;
		contain: content;

		.v-list {
			--v-list-background-color: transparent;
		}
	}

	&[data-placement='top'] .v-menu-content {
		transform: scaleY(0.8);
		transform-origin: bottom center;
	}

	&[data-placement='top-start'] .v-menu-content {
		transform: scaleY(0.8) scaleX(0.8);
		transform-origin: bottom left;
	}

	&[data-placement='top-end'] .v-menu-content {
		transform: scaleY(0.8) scaleX(0.8);
		transform-origin: bottom right;
	}

	&[data-placement='right'] .v-menu-content {
		transform: scaleX(0.8);
		transform-origin: center left;
	}

	&[data-placement='right-start'] .v-menu-content {
		transform: scaleY(0.8) scaleX(0.8);
		transform-origin: top left;
	}

	&[data-placement='right-end'] .v-menu-content {
		transform: scaleY(0.8) scaleX(0.8);
		transform-origin: bottom left;
	}

	&[data-placement='bottom'] .v-menu-content {
		transform: scaleY(0.8);
		transform-origin: top center;
	}

	&[data-placement='bottom-start'] .v-menu-content {
		transform: scaleY(0.8);
		transform-origin: top left;
	}

	&[data-placement='bottom-end'] .v-menu-content {
		transform: scaleY(0.8);
		transform-origin: top right;
	}

	&[data-placement='left'] .v-menu-content {
		transform: scaleX(0.8);
		transform-origin: center right;
	}

	&[data-placement='left-start'] .v-menu-content {
		transform: scaleY(0.8) scaleX(0.8);
		transform-origin: top right;
	}

	&[data-placement='left-end'] .v-menu-content {
		transform: scaleY(0.8) scaleX(0.8);
		transform-origin: bottom right;
	}

	.v-menu-content.active {
		transform: scaleY(1) scaleX(1);
		opacity: 1;
		transition-timing-function: cubic-bezier(0, 0, 0.2, 1.5);
		transition-duration: var(--fast);
	}

	&.attached {
		.v-menu-content {
			border-top: none;
			border-top-left-radius: 0;
			border-top-right-radius: 0;
		}
	}
}
</style>

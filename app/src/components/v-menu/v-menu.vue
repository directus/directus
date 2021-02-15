<template>
	<div class="v-menu" @click="onClick">
		<div
			ref="activator"
			class="v-menu-activator"
			:class="{ attached }"
			@pointerenter="onPointerEnter"
			@pointerleave="onPointerLeave"
		>
			<slot
				name="activator"
				v-bind="{
					toggle: toggle,
					active: isActive,
					activate: activate,
					deactivate: deactivate,
				}"
			/>
		</div>

		<portal to="menu-outlet">
			<div
				v-if="isActive"
				class="v-menu-popper"
				:key="id"
				:id="id"
				:class="{ active: isActive, attached }"
				:data-placement="popperPlacement"
				:style="styles"
				v-click-outside="{
					handler: deactivate,
					middleware: onClickOutsideMiddleware,
					disabled: isActive === false || closeOnClick === false,
					events: ['click'],
				}"
			>
				<div class="arrow" :class="{ active: showArrow && isActive }" :style="arrowStyles" data-popper-arrow />
				<div class="v-menu-content" @click.stop="onContentClick">
					<slot
						:active="isActive"
						v-bind="{
							toggle: toggle,
							active: isActive,
							activate: activate,
							deactivate: deactivate,
						}"
					/>
				</div>
			</div>
		</portal>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, PropType, computed, watch } from '@vue/composition-api';
import { usePopper } from './use-popper';
import { Placement } from '@popperjs/core';
import { nanoid } from 'nanoid';
import Vue from 'vue';

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
			default: true,
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
		trigger: {
			type: String,
			default: null,
			validator: (val: string) => ['hover', 'click'].includes(val),
		},
		delay: {
			type: Number,
			default: 0,
		},
	},
	setup(props, { emit }) {
		const activator = ref<HTMLElement | null>(null);
		const reference = ref<HTMLElement | null>(null);

		const virtualReference = ref({
			getBoundingClientRect() {
				return {
					top: 0,
					left: 0,
					bottom: 0,
					right: 0,
					width: 0,
					height: 0,
				};
			},
		});

		const id = computed(() => nanoid());
		const popper = ref<HTMLElement | null>(null);

		const { start, stop, styles, arrowStyles, placement: popperPlacement } = usePopper(
			reference,
			popper,
			computed(() => ({
				placement: props.placement as Placement,
				attached: props.attached,
				arrow: props.showArrow,
			}))
		);

		const { isActive, activate, deactivate, toggle } = useActiveState();

		watch(isActive, (newActive) => {
			if (newActive === true) {
				reference.value = ((activator.value as HTMLElement)?.childNodes[0] as HTMLElement) || virtualReference.value;

				Vue.nextTick(() => {
					popper.value = document.getElementById(id.value);
				});
			}
		});

		const { onClick, onPointerEnter, onPointerLeave } = useEvents();

		const hoveringOnPopperContent = ref(false);

		return {
			id,
			activator,
			popper,
			reference,
			isActive,
			toggle,
			deactivate,
			onContentClick,
			onClickOutsideMiddleware,
			styles,
			arrowStyles,
			popperPlacement,
			activate,
			onClick,
			onPointerLeave,
			onPointerEnter,
			hoveringOnPopperContent,
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
					localIsActive.value = newActive;
					emit('input', newActive);
				},
			});

			watch(
				popper,
				async () => {
					if (popper.value !== null) {
						await start();
					} else {
						stop();
					}
				},
				{ immediate: true }
			);

			return { isActive, activate, deactivate, toggle };

			function activate(event?: MouseEvent) {
				if (event) {
					virtualReference.value = {
						getBoundingClientRect() {
							return {
								top: event.clientY,
								left: event.clientX,
								bottom: 0,
								right: 0,
								width: 0,
								height: 0,
							};
						},
					};
				}
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

		function onClickOutsideMiddleware(e: Event) {
			return !activator.value?.contains(e.target as Node);
		}

		function onContentClick() {
			if (props.closeOnContentClick === true) {
				deactivate();
			}
		}

		function useEvents() {
			let timeout: ReturnType<typeof setTimeout> | null = null;

			return { onClick, onPointerLeave, onPointerEnter };

			function onClick() {
				if (props.trigger !== 'click') return;

				toggle();
			}

			function onPointerEnter() {
				if (props.trigger !== 'hover') return;
				if (timeout) return;
				timeout = setTimeout(() => {
					activate();
				}, props.delay);
			}

			function onPointerLeave() {
				if (hoveringOnPopperContent.value === true) return;

				if (props.trigger !== 'hover') return;
				if (timeout === null) return;
				clearTimeout(timeout);
				deactivate();
				timeout = null;
			}
		}
	},
});
</script>

<style>
body {
	--v-menu-min-width: 100px;
}
</style>

<style lang="scss" scoped>
.v-menu {
	display: contents;
}

.v-menu-activator {
	display: contents;
}

.v-menu-popper {
	position: fixed;
	left: -999px;
	z-index: 500;
	min-width: var(--v-menu-min-width);
	transform: translateY(2px);
	pointer-events: none;

	&.active {
		pointer-events: all;
	}
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

[data-placement^='top'] .arrow {
	bottom: -4px;

	&::after {
		bottom: 3px;
	}
}

[data-placement^='bottom'] .arrow {
	top: -4px;

	&::after {
		top: 3px;
	}
}

[data-placement^='right'] .arrow {
	left: -4px;

	&::after {
		left: 3px;
	}
}

[data-placement^='left'] .arrow {
	right: -4px;

	&::after {
		right: 3px;
	}
}

.v-menu-content {
	max-height: 30vh;
	padding: 0 4px;
	overflow-x: hidden;
	overflow-y: auto;
	background-color: var(--background-subdued);
	border: 2px solid var(--border-normal);
	border-radius: var(--border-radius);
	box-shadow: 0px 4px 12px rgba(38, 50, 56, 0.1);
	transition-timing-function: var(--transition-out);
	transition-duration: var(--fast);
	transition-property: opacity, transform;
	contain: content;

	.v-list {
		--v-list-background-color: transparent;
	}
}

[data-placement='top'] > .v-menu-content {
	transform-origin: bottom center;
}

[data-placement='top-start'] > .v-menu-content {
	transform-origin: bottom left;
}

[data-placement='top-end'] > .v-menu-content {
	transform-origin: bottom right;
}

[data-placement='right'] > .v-menu-content {
	transform-origin: center left;
}

[data-placement='right-start'] > .v-menu-content {
	transform-origin: top left;
}

[data-placement='right-end'] > .v-menu-content {
	transform-origin: bottom left;
}

[data-placement='bottom'] > .v-menu-content {
	transform-origin: top center;
}

[data-placement='bottom-start'] > .v-menu-content {
	transform-origin: top left;
}

[data-placement='bottom-end'] > .v-menu-content {
	transform-origin: top right;
}

[data-placement='left'] > .v-menu-content {
	transform-origin: center right;
}

[data-placement='left-start'] > .v-menu-content {
	transform-origin: top right;
}

[data-placement='left-end'] > .v-menu-content {
	transform-origin: bottom right;
}

.attached {
	&[data-placement^='top'] {
		> .v-menu-content {
			border-bottom: none;
			border-bottom-right-radius: 0;
			border-bottom-left-radius: 0;
		}
	}

	&[data-placement^='bottom'] {
		> .v-menu-content {
			border-top: none;
			border-top-left-radius: 0;
			border-top-right-radius: 0;
		}
	}
}
</style>

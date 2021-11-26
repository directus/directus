<template>
	<div class="v-menu" @click="onClick">
		<div
			ref="activator"
			class="v-menu-activator"
			:class="{ attached }"
			@pointerenter.stop="onPointerEnter"
			@pointerleave.stop="onPointerLeave"
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

		<teleport to="#menu-outlet">
			<transition-bounce>
				<div
					v-if="isActive"
					:id="id"
					:key="id"
					v-click-outside="{
						handler: deactivate,
						middleware: onClickOutsideMiddleware,
						disabled: isActive === false || closeOnClick === false,
						events: ['click'],
					}"
					class="v-menu-popper"
					:class="{ active: isActive, attached }"
					:data-placement="popperPlacement"
					:style="styles"
				>
					<div class="arrow" :class="{ active: showArrow && isActive }" :style="arrowStyles" data-popper-arrow />
					<div
						class="v-menu-content"
						@click.stop="onContentClick"
						@pointerenter.stop="onPointerEnter"
						@pointerleave.stop="onPointerLeave"
					>
						<slot
							v-bind="{
								toggle: toggle,
								active: isActive,
								activate: activate,
								deactivate: deactivate,
							}"
						/>
					</div>
				</div>
			</transition-bounce>
		</teleport>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, PropType, computed, watch, nextTick } from 'vue';
import { usePopper } from './use-popper';
import { Placement } from '@popperjs/core';
import { nanoid } from 'nanoid';
import { debounce } from 'lodash';

export default defineComponent({
	props: {
		placement: {
			type: String as PropType<Placement>,
			default: 'bottom',
		},
		modelValue: {
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
			validator: (val: string) => ['hover', 'click', 'keyDown'].includes(val),
		},
		delay: {
			type: Number,
			default: 0,
		},
		offsetY: {
			type: Number,
			default: 8,
		},
		offsetX: {
			type: Number,
			default: 0,
		},
	},
	emits: ['update:modelValue'],
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

		const {
			start,
			stop,
			styles,
			arrowStyles,
			placement: popperPlacement,
		} = usePopper(
			reference,
			popper,
			computed(() => ({
				placement: props.placement,
				attached: props.attached,
				arrow: props.showArrow,
				offsetY: props.offsetY,
				offsetX: props.offsetX,
			}))
		);

		const { isActive, activate, deactivate, toggle } = useActiveState();

		watch(isActive, (newActive) => {
			if (newActive === true) {
				reference.value = (activator.value?.children[0] as HTMLElement) || virtualReference.value;

				nextTick(() => {
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
					if (props.modelValue !== undefined) {
						return props.modelValue;
					}

					return localIsActive.value;
				},
				async set(newActive) {
					localIsActive.value = newActive;
					emit('update:modelValue', newActive);
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

		function onContentClick(e: Event) {
			if (props.closeOnContentClick === true && e.target !== e.currentTarget) {
				deactivate();
			}
		}

		function useEvents() {
			const isHovered = ref(false);

			watch(
				isHovered,
				debounce((newHoveredState) => {
					if (newHoveredState) {
						if (!isActive.value) activate();
					} else {
						deactivate();
					}
				}, props.delay)
			);

			return { onClick, onPointerLeave, onPointerEnter };

			function onClick() {
				if (props.trigger !== 'click') return;

				toggle();
			}

			function onPointerEnter() {
				if (props.trigger !== 'hover') return;
				isHovered.value = true;
			}

			function onPointerLeave() {
				if (props.trigger !== 'hover') return;
				isHovered.value = false;
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
.arrow::after {
	position: absolute;
	z-index: 1;
	width: 10px;
	height: 10px;
	overflow: hidden;
	border-radius: 2px;
	box-shadow: none;
}

.arrow {
	&::after {
		background: var(--card-face-color);
		transform: rotate(45deg) scale(0);
		transition: transform var(--fast) var(--transition-out);
		transition-delay: 0;
		content: '';
	}

	&.active::after {
		transform: rotate(45deg) scale(1);
		transition: transform var(--medium) var(--transition-in);
	}
}

[data-placement^='top'] .arrow {
	bottom: -6px;

	&::after {
		bottom: 3px;
		box-shadow: 2px 2px 4px -2px rgba(var(--card-shadow-color), 0.2);
	}
}

[data-placement^='bottom'] .arrow {
	top: -6px;

	&::after {
		top: 3px;
		box-shadow: -2px -2px 4px -2px rgba(var(--card-shadow-color), 0.2);
	}
}

[data-placement^='right'] .arrow {
	left: -6px;

	&::after {
		left: 2px;
		box-shadow: -2px 2px 4px -2px rgba(var(--card-shadow-color), 0.2);
	}
}

[data-placement^='left'] .arrow {
	right: -6px;

	&::after {
		right: 2px;
		box-shadow: 2px -2px 4px -2px rgba(var(--card-shadow-color), 0.2);
	}
}

.v-menu-content {
	max-height: 30vh;
	padding: 0 4px;
	overflow-x: hidden;
	overflow-y: auto;
	background-color: var(--card-face-color);
	border: none;
	border-radius: var(--border-radius);
	box-shadow: 0px 0px 6px 0px rgb(var(--card-shadow-color), 0.2), 0px 0px 12px 2px rgb(var(--card-shadow-color), 0.05);
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
			transform: translateY(-2px);
		}
	}

	&[data-placement^='bottom'] {
		> .v-menu-content {
			transform: translateY(2px);
		}
	}
}
</style>

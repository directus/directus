<template>
	<div ref="v-menu" class="v-menu" v-on="trigger === 'click' ? { click: onClick } : {}">
		<div
			ref="activator"
			class="v-menu-activator"
			:class="{ attached }"
			v-on="trigger === 'hover' ? { pointerenter: onPointerEnter, pointerleave: onPointerLeave } : {}"
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
					v-click-outside="{
						handler: deactivate,
						middleware: onClickOutsideMiddleware,
						disabled: closeOnClick === false,
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
						:class="{ 'full-height': fullHeight, seamless }"
						v-on="{
							...(closeOnContentClick ? { click: onContentClick } : {}),
							...(trigger === 'hover' ? { pointerenter: onPointerEnter, pointerleave: onPointerLeave } : {}),
						}"
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

<script setup lang="ts">
import { Instance, Modifier, Placement } from '@popperjs/core';
import arrow from '@popperjs/core/lib/modifiers/arrow';
import computeStyles from '@popperjs/core/lib/modifiers/computeStyles';
import eventListeners from '@popperjs/core/lib/modifiers/eventListeners';
import flip from '@popperjs/core/lib/modifiers/flip';
import offset from '@popperjs/core/lib/modifiers/offset';
import popperOffsets from '@popperjs/core/lib/modifiers/popperOffsets';
import preventOverflow from '@popperjs/core/lib/modifiers/preventOverflow';
import { createPopper } from '@popperjs/core/lib/popper-lite';
import { debounce } from 'lodash';
import { nanoid } from 'nanoid/non-secure';
import { computed, nextTick, onUnmounted, ref, Ref, watch } from 'vue';

interface Props {
	/** Where to position the popper */
	placement?: Placement;
	/** Model the open state */
	modelValue?: boolean;
	/** Close the menu when clicking outside of the menu */
	closeOnClick?: boolean;
	/** Close the menu when clicking the content of the menu */
	closeOnContentClick?: boolean;
	/** Attach the menu to an input */
	attached?: boolean;
	/** Should the menu have the same width as the input when attached */
	isSameWidth?: boolean;
	/** Show an arrow pointer */
	showArrow?: boolean;
	/** Menu does not appear */
	disabled?: boolean;
	/** Activate the menu on a trigger */
	trigger?: 'hover' | 'click' | 'keyDown' | null;
	/** Time in ms before menu activates after trigger */
	delay?: number;
	/** Offset from the top */
	offsetY?: number;
	/** Offset from the left */
	offsetX?: number;
	/** Removes the scrollbar */
	fullHeight?: boolean;
	/** Removes any styling from the menu */
	seamless?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	placement: 'bottom',
	modelValue: undefined,
	closeOnClick: true,
	closeOnContentClick: true,
	attached: false,
	isSameWidth: true,
	showArrow: false,
	disabled: false,
	trigger: null,
	delay: 0,
	offsetY: 8,
	offsetX: 0,
	fullHeight: false,
	seamless: false,
});

const emit = defineEmits(['update:modelValue']);

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
	reference as any, // Fix as TS thinks Ref<HTMLElement | null> !== Ref<HTMLElement | null> 🙃
	popper as any,
	computed(() => ({
		placement: props.placement,
		attached: props.attached,
		isSameWidth: props.isSameWidth,
		arrow: props.showArrow,
		offsetY: props.offsetY,
		offsetX: props.offsetX,
	}))
);

const { isActive, activate, deactivate, toggle } = useActiveState();

defineExpose({ activator, id, activate, deactivate });

watch(isActive, (newActive) => {
	if (newActive === true) {
		reference.value = (activator.value?.children[0] as HTMLElement) || virtualReference.value;

		nextTick(() => {
			popper.value = document.getElementById(id.value);
		});
	}
});

const { onClick, onPointerEnter, onPointerLeave } = useEvents();

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
	e.stopPropagation();

	if (e.target !== e.currentTarget) {
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
		toggle();
	}

	function onPointerEnter(event: Event) {
		event.stopPropagation();
		isHovered.value = true;
	}

	function onPointerLeave(event: Event) {
		event.stopPropagation();
		isHovered.value = false;
	}
}

function usePopper(
	reference: Ref<HTMLElement | null>,
	popper: Ref<HTMLElement | null>,
	options: Readonly<
		Ref<
			Readonly<{
				placement: Placement;
				attached: boolean;
				isSameWidth: boolean;
				arrow: boolean;
				offsetY: number;
				offsetX: number;
			}>
		>
	>
): Record<string, any> {
	const popperInstance = ref<Instance | null>(null);
	const styles = ref({});
	const arrowStyles = ref({});

	// The internal placement can change based on the flip / overflow modifiers
	const placement = ref(options.value.placement);

	onUnmounted(() => {
		stop();
	});

	watch(
		options,
		() => {
			popperInstance.value?.setOptions({
				placement: options.value.attached ? 'bottom-start' : options.value.placement,
				modifiers: getModifiers(),
			});
		},
		{ immediate: true }
	);

	const observer = new MutationObserver(() => {
		popperInstance.value?.forceUpdate();
	});

	return { popperInstance, placement, start, stop, styles, arrowStyles };

	function start() {
		return new Promise((resolve) => {
			popperInstance.value = createPopper(reference.value!, popper.value!, {
				placement: options.value.attached ? 'bottom-start' : options.value.placement,
				modifiers: getModifiers(resolve),
				strategy: 'fixed',
			});

			popperInstance.value.forceUpdate();

			observer.observe(popper.value!, {
				attributes: false,
				childList: true,
				characterData: true,
				subtree: true,
			});
		});
	}

	function stop() {
		popperInstance.value?.destroy();
		observer.disconnect();
	}

	function getModifiers(callback: (value?: unknown) => void = () => undefined) {
		const modifiers: Modifier<string, any>[] = [
			popperOffsets,
			{
				...offset,
				options: {
					offset: options.value.attached ? [0, 0] : [options.value.offsetX ?? 0, options.value.offsetY ?? 8],
				},
			},
			{
				...preventOverflow,
				options: {
					padding: 8,
				},
			},
			computeStyles,
			flip,
			eventListeners,
			{
				name: 'placementUpdater',
				enabled: true,
				phase: 'afterWrite',
				fn({ state }) {
					placement.value = state.placement;
				},
			},
			{
				name: 'applyStyles',
				enabled: true,
				phase: 'write',
				fn({ state }) {
					styles.value = state.styles.popper;
					arrowStyles.value = state.styles.arrow;
					callback();
				},
			},
		];

		if (options.value.arrow === true) {
			modifiers.push({
				...arrow,
				options: {
					padding: 6,
				},
			});
		}

		if (options.value.attached === true) {
			modifiers.push({
				name: 'sameWidth',
				enabled: options.value.isSameWidth,
				fn: ({ state }) => {
					state.styles.popper.width = `${state.rects.reference.width}px`;
				},
				phase: 'beforeWrite',
				requires: ['computeStyles'],
			});
		}

		return modifiers;
	}
}
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

.v-menu-content.full-height {
	max-height: none;
}

.v-menu-content.seamless {
	padding: 0;
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

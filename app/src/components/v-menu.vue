<script setup lang="ts">
import { useShortcut } from '@/composables/use-shortcut';
import { useUserStore } from '@/stores/user';
import { Instance, Modifier, Placement, detectOverflow } from '@popperjs/core';
import arrow from '@popperjs/core/lib/modifiers/arrow';
import computeStyles from '@popperjs/core/lib/modifiers/computeStyles';
import eventListeners from '@popperjs/core/lib/modifiers/eventListeners';
import flip from '@popperjs/core/lib/modifiers/flip';
import offset from '@popperjs/core/lib/modifiers/offset';
import popperOffsets from '@popperjs/core/lib/modifiers/popperOffsets';
import preventOverflow from '@popperjs/core/lib/modifiers/preventOverflow';
import { createPopper } from '@popperjs/core/lib/popper-lite';
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap';
import { debounce } from 'lodash';
import { nanoid } from 'nanoid/non-secure';
import { computed, nextTick, onUnmounted, ref, useTemplateRef, watch, type Ref } from 'vue';

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
	/** Show an arrow pointer */
	showArrow?: boolean;
	/** Fixed arrow placement */
	arrowPlacement?: 'start';
	/** Space between the arrow and the edge of the menu */
	arrowPadding?: number;
	/** Menu does not appear */
	disabled?: boolean;
	/** Set the non-editable state for the menu */
	nonEditable?: boolean;
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
	/** Lets other overlays (drawer, dialog) open on top */
	keepBehind?: boolean;
	/** Do not focus activator when deactivating focus trap */
	noFocusReturn?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	placement: 'bottom',
	modelValue: undefined,
	closeOnClick: true,
	closeOnContentClick: true,
	arrowPadding: 6,
	trigger: null,
	delay: 0,
	offsetY: 8,
	offsetX: 0,
});

const emit = defineEmits(['update:modelValue']);

const userStore = useUserStore();

const isRTL = computed(() => userStore.textDirection === 'rtl');

const activator = ref<HTMLElement | null>(null);
const reference = ref<HTMLElement | null>(null);

const forceMaxHeight = ref<number | null>(null);

const maxHeight = computed(() => {
	if (forceMaxHeight.value) return `${forceMaxHeight.value}px`;

	if (props.fullHeight) return null;

	return '30vh';
});

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
	})),
);

const { isActive, activate, deactivate, toggle } = useActiveState();

useShortcut('escape', (_event, cancelNext) => {
	if (isActive.value) {
		deactivate();
		cancelNext();
	}
});

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

	const menuEl = useTemplateRef<HTMLDivElement>('menuEl');

	const { activate: activateFocusTrap, deactivate: deactivateFocusTrap } = useFocusTrap([menuEl, activator], {
		escapeDeactivates: false,
		initialFocus: false,
		returnFocusOnDeactivate: !props.noFocusReturn,
		allowOutsideClick: true,
		clickOutsideDeactivates: props.closeOnClick,
	});

	const isActive = computed<boolean>({
		get() {
			if (props.modelValue !== undefined) {
				return props.modelValue;
			}

			return localIsActive.value;
		},
		async set(newActive) {
			if (!newActive) deactivateFocusTrap();

			localIsActive.value = newActive;
			emit('update:modelValue', newActive);

			if (newActive) {
				await nextTick();
				activateFocusTrap();
			}
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
		{ immediate: true },
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
		}, props.delay),
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
				arrow: boolean;
				offsetY: number;
				offsetX: number;
			}>
		>
	>,
): Record<string, any> {
	const popperInstance = ref<Instance | null>(null);
	const styles = ref({});
	const arrowStyles = ref({});

	// The internal placement can change based on the flip / overflow modifiers
	const placement = ref(options.value.placement);

	onUnmounted(() => {
		stop();
	});

	function getPlacement() {
		if (isRTL.value) {
			if (options.value.attached) {
				return 'bottom-end';
			} else if (options.value.placement.includes('start') || options.value.placement.includes('end')) {
				return options.value.placement.replace(/start|end/g, (match) => (match === 'start' ? 'end' : 'start'));
			}
		}

		return options.value.attached ? 'bottom-start' : options.value.placement;
	}

	watch(
		options,
		() => {
			popperInstance.value?.setOptions({
				placement: getPlacement() as Placement,
				modifiers: getModifiers(),
			});
		},
		{ immediate: true },
	);

	const observer = new MutationObserver(() => {
		popperInstance.value?.forceUpdate();
	});

	return { popperInstance, placement, start, stop, styles, arrowStyles };

	function start() {
		return new Promise((resolve) => {
			popperInstance.value = createPopper(reference.value!, popper.value!, {
				placement: getPlacement() as Placement,
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
		const padding = 8;

		const modifiers: Modifier<string, any>[] = [
			popperOffsets,
			{
				...offset,
				options: {
					offset: options.value.attached ? [0, 0] : [options.value.offsetX ?? 0, options.value.offsetY ?? padding],
				},
			},
			{
				...preventOverflow,
				options: {
					padding,
				},
			},
			computeStyles,
			flip,
			eventListeners,
			{
				...arrow,
				enabled: options.value.arrow === true,
				options: {
					padding: props.arrowPadding,
				},
			},
			{
				name: 'minWidth',
				enabled: options.value.attached === true,
				fn: ({ state }) => {
					if (state.styles.popper) state.styles.popper.minWidth = `${state.rects.reference.width}px`;
				},
				phase: 'beforeWrite',
				requires: ['computeStyles'],
			},
			{
				name: 'maxHeight',
				enabled: true,
				phase: 'beforeWrite',
				requires: ['computeStyles'],
				requiresIfExists: ['offset'],
				fn({ state }) {
					const overflow = detectOverflow(state, {
						padding,
					});

					if (state.placement.startsWith('top') && overflow.top < 0) {
						forceMaxHeight.value = state.elements.popper.offsetHeight - Math.ceil(overflow.top);
					} else if (state.placement.startsWith('bottom') && overflow.bottom > 0) {
						forceMaxHeight.value = state.elements.popper.offsetHeight - Math.floor(overflow.bottom);
					} else {
						forceMaxHeight.value = null;
					}
				},
			},
			{
				name: 'applyStyles',
				enabled: true,
				phase: 'write',
				fn({ state }) {
					if (state.styles.popper) styles.value = state.styles.popper;

					if (state.styles.arrow) {
						if (props.arrowPlacement === 'start') {
							let x = 0;
							let y = 0;

							switch (state.placement) {
								case 'top-start':
								case 'bottom-start':
									x = props.arrowPadding;
									break;
								case 'top-end':
								case 'bottom-end':
									x = props.arrowPadding * -1;
									break;
								case 'left-start':
								case 'right-start':
									y = props.arrowPadding;
									break;
							}

							state.styles.arrow.transform = `translate3d(${x}px, ${y}px, 0)`;

							if (isRTL.value) {
								state.styles.arrow.right = state.styles.arrow.left;
								state.styles.arrow.left = `unset`;
							}
						}

						arrowStyles.value = state.styles.arrow;
					}

					callback();
				},
			},
			{
				name: 'placementUpdater',
				enabled: true,
				phase: 'afterWrite',
				fn({ state }) {
					placement.value = state.placement;
				},
			},
		];

		return modifiers;
	}
}
</script>

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
					:class="{ active: isActive, attached, 'keep-behind': keepBehind }"
					:data-placement="popperPlacement"
					:style="styles"
				>
					<div class="arrow" :class="{ active: showArrow && isActive }" :style="arrowStyles" data-popper-arrow>
						<div class="arrow-triangle" />
					</div>
					<div
						ref="menuEl"
						class="v-menu-content"
						:class="{ seamless }"
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

<style lang="scss" scoped>
.v-menu {
	display: contents;
}

.v-menu-activator {
	display: contents;
}

.v-menu-popper {
	position: fixed;
	inset-inline-start: -999px;
	z-index: 600;
	min-inline-size: 100px;
	transform: translateY(2px);
	pointer-events: none;

	&.active {
		pointer-events: all;
	}

	&.keep-behind {
		z-index: 490;
	}
}

.arrow,
.arrow-triangle,
.arrow-triangle::before,
.arrow-triangle::after {
	position: absolute;
	inline-size: 10px;
	block-size: 10px;
}

.arrow {
	z-index: 1;

	.arrow-triangle {
		overflow: visible clip;

		[data-placement^='left'] &,
		[data-placement^='right'] & {
			overflow: clip visible;
		}

		&::before,
		&::after {
			content: '';
			background: var(--theme--popover--menu--background);
			transform: rotate(45deg) scale(0);
			transition: transform var(--fast) var(--transition-out);
		}

		&::after {
			/* To apply a shadow with less opacity to the triangle, we need to duplicate it (:before & :after) */
			box-shadow: var(--theme--popover--menu--box-shadow);
			opacity: 0.75;
		}
	}

	&.active .arrow-triangle {
		&::before,
		&::after {
			transform: rotate(45deg) scale(1);
			transition: transform var(--medium) var(--transition-in);
		}
	}
}

[data-placement^='top'] .arrow {
	inset-block-end: -10px;

	.arrow-triangle {
		&::before,
		&::after {
			inset-block-end: 7px;
		}
	}
}

[data-placement^='bottom'] .arrow {
	inset-block-start: -10px;

	.arrow-triangle {
		&::before,
		&::after {
			inset-block-start: 7px;
		}
	}
}

[data-placement^='right'] .arrow {
	inset-inline-start: -10px;

	html[dir='rtl'] & {
		inset-inline-start: unset;
		inset-inline-end: -10px;
	}

	.arrow-triangle {
		&::before,
		&::after {
			inset-inline-start: 7px;

			html[dir='rtl'] & {
				inset-inline-start: unset;
				inset-inline-end: 7px;
			}
		}
	}
}

[data-placement^='left'] .arrow {
	inset-inline-end: -10px;

	html[dir='rtl'] & {
		inset-inline-end: unset;
		inset-inline-start: -10px;
	}

	.arrow-triangle {
		&::before,
		&::after {
			inset-inline-end: 7px;

			html[dir='rtl'] & {
				inset-inline-end: unset;
				inset-inline-start: 7px;
			}
		}
	}
}

.v-menu-content {
	max-block-size: v-bind(maxHeight);
	padding: 0 4px;
	overflow: hidden auto;
	background-color: var(--theme--popover--menu--background);
	border: none;
	border-radius: var(--theme--popover--menu--border-radius);
	box-shadow: var(--theme--popover--menu--box-shadow);
	transition-timing-function: var(--transition-out);
	transition-duration: var(--fast);
	transition-property: opacity, transform;
	contain: content;

	.v-list {
		--v-list-background-color: transparent;
	}
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
